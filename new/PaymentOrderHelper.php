<?php

declare(strict_types=1);

namespace Franchglobal;

use PDO;

/**
 * Orders for email, admin tracking, and customer "My orders" use the `payments` table
 * (payload_json), enriched with razorpay_order_snapshots — not the legacy `orders` table.
 */
final class PaymentOrderHelper
{
    public static function paymentMatchesCustomer(array $payment, array $user): bool
    {
        $userId = (string) ($user['id'] ?? '');
        $email = self::sanitizeEmail((string) ($user['email'] ?? ''));
        $paymentUserId = (string) ($payment['userId'] ?? '');
        $paymentEmail = self::sanitizeEmail((string) ($payment['customerEmail'] ?? ($payment['email'] ?? '')));

        if ($userId !== '' && $paymentUserId !== '' && $paymentUserId === $userId) {
            return true;
        }

        return $email !== '' && $paymentEmail !== '' && $paymentEmail === $email;
    }

    public static function sanitizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    /** @return array<string, mixed> */
    public static function normalizePaymentView(array $row): array
    {
        $payload = [];
        if (!empty($row['payload_json'])) {
            $decoded = json_decode((string) $row['payload_json'], true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }

        $view = array_merge($payload, [
            'id' => (string) ($row['id'] ?? ''),
            'razorpay_order_id' => (string) ($row['razorpay_order_id'] ?? ($payload['razorpay_order_id'] ?? '')),
            'razorpay_payment_id' => (string) ($row['razorpay_payment_id'] ?? ($payload['razorpay_payment_id'] ?? '')),
            'amount' => isset($row['amount']) ? (float) $row['amount'] : (float) ($payload['amount'] ?? 0),
            'isValid' => isset($row['is_valid']) ? ((int) $row['is_valid'] === 1) : !empty($payload['isValid']),
            'paymentStatus' => isset($row['is_valid']) && (int) $row['is_valid'] === 1 ? 'paid' : (string) ($payload['paymentStatus'] ?? 'pending'),
            'createdAt' => $row['created_at'] ?? ($payload['createdAt'] ?? null),
            'updatedAt' => $row['updated_at'] ?? ($payload['updatedAt'] ?? null),
        ]);

        $view['fulfillmentStatus'] = self::normalizeFulfillmentStatus($view['fulfillmentStatus'] ?? 'placed');
        $view['awbNumber'] = trim((string) ($view['awbNumber'] ?? ''));
        $view['trackingUrl'] = trim((string) ($view['trackingUrl'] ?? ''));
        $view['placedEmailSent'] = !empty($view['placedEmailSent']);

        $customer = is_array($view['customer'] ?? null) ? $view['customer'] : [];
        $entity = self::extractRazorpayPaymentEntity($view);
        $entityNotes = is_array($entity['notes'] ?? null) ? $entity['notes'] : [];

        if (!isset($view['selectedAddress']) && isset($view['address']) && is_array($view['address'])) {
            $view['selectedAddress'] = $view['address'];
        }
        $addr = is_array($view['selectedAddress'] ?? null) ? $view['selectedAddress'] : [];

        $notesName = self::pickNoteValue($entityNotes, 'name')
            ?? self::pickNoteValue($entityNotes, 'customer_name')
            ?? self::pickNoteValue($view, 'notes_name');

        $view['customerName'] = trim((string) (
            $view['customerName']
            ?? $view['name']
            ?? $view['customer_name']
            ?? $customer['name']
            ?? ($addr['name'] ?? '')
            ?? ($entity['name'] ?? '')
            ?? $notesName
            ?? self::nameFromSnapshot($view)
            ?? ''
        ));
        $view['customerEmail'] = self::sanitizeEmail((string) (
            $view['customerEmail']
            ?? $view['email']
            ?? $customer['email']
            ?? ($entity['email'] ?? '')
            ?? ''
        ));
        $view['customerPhone'] = trim((string) (
            $view['customerPhone']
            ?? $view['phone']
            ?? $customer['phone']
            ?? ($entity['contact'] ?? '')
            ?? ''
        ));
        $view['name'] = $view['customerName'];
        $view['email'] = $view['customerEmail'];
        $view['phone'] = $view['customerPhone'];

        $view['totalAmount'] = (float) ($view['totalAmount'] ?? $view['amount'] ?? 0);
        if (!isset($view['items']) && isset($view['cart']) && is_array($view['cart'])) {
            $view['items'] = self::mapCartItems($view['cart']);
        }

        $createdAt = (string) ($view['createdAt'] ?? $row['created_at'] ?? '');
        $view['trackingEligible'] = self::isPaymentCreatedAfterTrackingStart($createdAt);
        $cutoffDisplay = trim((string) Config::get('TRACKING_FEATURE_START_AT', ''));
        if ($cutoffDisplay !== '') {
            $view['trackingCutoffAt'] = $cutoffDisplay;
        }

        return $view;
    }

    /** Empty .env value = tracking enabled for all paid payments. */
    public static function trackingFeatureStartAtSql(): ?string
    {
        $raw = trim((string) Config::get('TRACKING_FEATURE_START_AT', ''));
        if ($raw === '') {
            return null;
        }
        $ts = strtotime($raw);

        return $ts !== false ? date('Y-m-d H:i:s', $ts) : null;
    }

    public static function isPaymentCreatedAfterTrackingStart(?string $createdAt): bool
    {
        $cutoff = self::trackingFeatureStartAtSql();
        if ($cutoff === null) {
            return true;
        }
        $createdAt = trim((string) $createdAt);
        if ($createdAt === '') {
            return false;
        }
        $orderTs = strtotime($createdAt);
        $cutoffTs = strtotime($cutoff);

        if ($orderTs === false || $cutoffTs === false) {
            return true;
        }

        return $orderTs >= $cutoffTs;
    }

    /** @return array<string, mixed> Shape expected by OrderEmailTemplates + sendOrderStatusEmail */
    public static function buildEmailOrder(array $view): array
    {
        $items = is_array($view['items'] ?? null) ? $view['items'] : self::mapCartItems($view['cart'] ?? []);

        return [
            'id' => (string) ($view['id'] ?? ''),
            'orderNo' => (string) ($view['id'] ?? ''),
            'customerName' => (string) ($view['customerName'] ?? ''),
            'customerEmail' => (string) ($view['customerEmail'] ?? ''),
            'customerPhone' => (string) ($view['customerPhone'] ?? ''),
            'email' => (string) ($view['customerEmail'] ?? ''),
            'phone' => (string) ($view['customerPhone'] ?? ''),
            'name' => (string) ($view['customerName'] ?? ''),
            'address' => is_array($view['selectedAddress'] ?? null) ? $view['selectedAddress'] : [],
            'selectedAddress' => is_array($view['selectedAddress'] ?? null) ? $view['selectedAddress'] : [],
            'items' => $items,
            'cart' => is_array($view['cart'] ?? null) ? $view['cart'] : [],
            'totalAmount' => (float) ($view['totalAmount'] ?? $view['amount'] ?? 0),
            'fulfillmentStatus' => self::normalizeFulfillmentStatus($view['fulfillmentStatus'] ?? 'placed'),
            'awbNumber' => (string) ($view['awbNumber'] ?? ''),
            'trackingUrl' => (string) ($view['trackingUrl'] ?? ''),
            'razorpay_order_id' => (string) ($view['razorpay_order_id'] ?? ''),
            'razorpay_payment_id' => (string) ($view['razorpay_payment_id'] ?? ''),
        ];
    }

    /** @param array<int, mixed> $cart */
    public static function mapCartItems(array $cart): array
    {
        $items = [];
        foreach ($cart as $item) {
            if (!is_array($item)) {
                continue;
            }
            $qty = max(1, (int) ($item['qty'] ?? $item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0);
            $items[] = [
                'sku' => (string) ($item['sku'] ?? ''),
                'title' => (string) ($item['title'] ?? $item['name'] ?? 'Product'),
                'qty' => $qty,
                'price' => $price,
                'total' => $price * $qty,
                'imageURL' => (string) ($item['imageURL'] ?? $item['image_url'] ?? ''),
            ];
        }

        return $items;
    }

    public static function normalizeFulfillmentStatus(?string $status): string
    {
        $s = strtolower(trim((string) $status));
        $allowed = ['placed', 'shipped', 'in_transit', 'delivered'];

        return in_array($s, $allowed, true) ? $s : 'placed';
    }

    public static function fetchPaymentRowById(PDO $pdo, int $id): ?array
    {
        if ($id <= 0) {
            return null;
        }
        $stmt = $pdo->prepare(
            'SELECT id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at, updated_at
             FROM payments WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public static function fetchPaymentRowByRazorpayOrderId(PDO $pdo, string $razorpayOrderId): ?array
    {
        $razorpayOrderId = trim($razorpayOrderId);
        if ($razorpayOrderId === '') {
            return null;
        }
        $stmt = $pdo->prepare(
            'SELECT id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at, updated_at
             FROM payments WHERE razorpay_order_id = :oid LIMIT 1'
        );
        $stmt->execute(['oid' => $razorpayOrderId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @param array<string, mixed> $payloadPatch merged into existing payload_json */
    public static function updatePaymentPayload(PDO $pdo, int $paymentId, array $payloadPatch): void
    {
        $row = self::fetchPaymentRowById($pdo, $paymentId);
        if (!$row) {
            return;
        }
        $existing = [];
        $decoded = json_decode((string) ($row['payload_json'] ?? '{}'), true);
        if (is_array($decoded)) {
            $existing = $decoded;
        }
        $merged = array_merge($existing, $payloadPatch);
        $stmt = $pdo->prepare('UPDATE payments SET payload_json = :payload_json, updated_at = NOW() WHERE id = :id');
        $stmt->execute([
            'id' => $paymentId,
            'payload_json' => json_encode($merged, JSON_UNESCAPED_SLASHES),
        ]);
    }

    /**
     * After a successful charge, send placed email once and set fulfillment on the payment row.
     *
     * @param callable(array): bool $sendEmail fn(buildEmailOrder) => bool
     */
    public static function afterSuccessfulPayment(
        PDO $pdo,
        OrderRepository $repo,
        string $razorpayOrderId,
        callable $sendEmail,
        ?int $authUserId = null
    ): ?string {
        $row = self::fetchPaymentRowByRazorpayOrderId($pdo, $razorpayOrderId);
        if (!$row || (int) ($row['is_valid'] ?? 0) !== 1) {
            return $row ? (string) $row['id'] : null;
        }

        $paymentId = (int) $row['id'];
        $view = self::normalizePaymentView($row);
        $snapshot = $repo->getRazorpayOrderSnapshotByRazorpayOrderId($razorpayOrderId);
        $enriched = self::enrichWithRazorpaySnapshot($view, $snapshot);

        $patch = [
            'fulfillmentStatus' => self::normalizeFulfillmentStatus($enriched['fulfillmentStatus'] ?? 'placed'),
        ];
        if ($authUserId !== null && $authUserId > 0) {
            $patch['userId'] = (string) $authUserId;
        }
        self::updatePaymentPayload($pdo, $paymentId, $patch);

        $row = self::fetchPaymentRowById($pdo, $paymentId);
        $view = self::normalizePaymentView($row ?: []);

        if (empty($view['placedEmailSent'])) {
            $emailOrder = self::buildEmailOrder($view);
            if (trim((string) ($emailOrder['customerEmail'] ?? '')) !== '') {
                $sent = $sendEmail($emailOrder);
                if ($sent) {
                    self::updatePaymentPayload($pdo, $paymentId, ['placedEmailSent' => true]);
                }
            }
        }

        return (string) $paymentId;
    }

    /**
     * @param array<string, mixed> $context
     * @param array<string, mixed>|null $orderApi
     * @return array<string, mixed>
     */
    /**
     * @param array<string, mixed> $context
     * @param array<string, mixed>|null $initiation payload_json from order_initiations
     * @return array<string, mixed>
     */
    public static function enrichWithOrderInitiation(array $context, ?array $initiation): array
    {
        if ($initiation === null || !is_array($initiation)) {
            return $context;
        }

        $name = trim((string) (
            $initiation['customer_name']
            ?? $initiation['name']
            ?? ($initiation['selectedAddress']['name'] ?? '')
            ?? ($initiation['address']['name'] ?? '')
            ?? ''
        ));
        if ($name !== '' && trim((string) ($context['customerName'] ?? '')) === '') {
            $context['customerName'] = $name;
            $context['name'] = $name;
            $context['customer_name'] = $name;
        }

        $email = self::sanitizeEmail((string) (
            $initiation['customer_email']
            ?? $initiation['email']
            ?? ''
        ));
        if ($email !== '' && trim((string) ($context['customerEmail'] ?? '')) === '') {
            $context['customerEmail'] = $email;
            $context['email'] = $email;
        }

        $phone = trim((string) (
            $initiation['customer_phone']
            ?? $initiation['phone']
            ?? ''
        ));
        if ($phone !== '' && trim((string) ($context['customerPhone'] ?? '')) === '') {
            $context['customerPhone'] = $phone;
            $context['phone'] = $phone;
        }

        $addr = $initiation['selectedAddress'] ?? $initiation['address'] ?? null;
        if (is_array($addr) && count($addr) > 0) {
            $context['selectedAddress'] = array_merge(
                is_array($context['selectedAddress'] ?? null) ? $context['selectedAddress'] : [],
                $addr
            );
            if ($name !== '' && trim((string) ($context['selectedAddress']['name'] ?? '')) === '') {
                $context['selectedAddress']['name'] = $name;
            }
        }

        return $context;
    }

    public static function enrichWithRazorpaySnapshot(array $context, ?array $orderApi): array
    {
        if ($orderApi === null || !is_array($orderApi)) {
            return $context;
        }

        $ship = self::pickShippingAddress($orderApi);
        if (is_array($ship)) {
            $context['selectedAddress'] = array_merge(
                is_array($context['selectedAddress'] ?? null) ? $context['selectedAddress'] : [],
                [
                    'line1' => (string) ($ship['line1'] ?? ''),
                    'line2' => (string) ($ship['line2'] ?? ''),
                    'city' => (string) ($ship['city'] ?? ''),
                    'state' => (string) ($ship['state'] ?? ''),
                    'country' => (string) ($ship['country'] ?? ''),
                    'pincode' => (string) ($ship['zipcode'] ?? ''),
                ]
            );
            $n = trim((string) ($ship['name'] ?? ''));
            if ($n !== '' && trim((string) ($context['customerName'] ?? '')) === '') {
                $context['customerName'] = $n;
                $context['name'] = $n;
            }
        }

        $cd = $orderApi['customer_details'] ?? [];
        if (is_array($cd)) {
            if (!empty($cd['email']) && trim((string) ($context['customerEmail'] ?? '')) === '') {
                $context['customerEmail'] = self::sanitizeEmail((string) $cd['email']);
                $context['email'] = $context['customerEmail'];
            }
            if (!empty($cd['contact']) && trim((string) ($context['customerPhone'] ?? '')) === '') {
                $context['customerPhone'] = (string) $cd['contact'];
                $context['phone'] = $context['customerPhone'];
            }
        }

        $lineItems = $orderApi['line_items'] ?? [];
        if (is_array($lineItems) && count($lineItems) > 0 && empty($context['cart'])) {
            $cartFromApi = [];
            foreach ($lineItems as $li) {
                if (!is_array($li)) {
                    continue;
                }
                $qty = (int) ($li['quantity'] ?? 1);
                $offerPaise = (int) ($li['offer_price'] ?? $li['price'] ?? 0);
                $cartFromApi[] = [
                    'title' => (string) ($li['name'] ?? 'Item'),
                    'name' => (string) ($li['name'] ?? 'Item'),
                    'qty' => max(1, $qty),
                    'price' => $offerPaise / 100.0,
                ];
            }
            if (count($cartFromApi) > 0) {
                $context['cart'] = $cartFromApi;
                $context['items'] = self::mapCartItems($cartFromApi);
            }
        }

        return $context;
    }

    private static function pickNoteValue(array $notes, string $key): ?string
    {
        if (!isset($notes[$key])) {
            return null;
        }
        $v = $notes[$key];
        if (is_scalar($v)) {
            $s = trim((string) $v);

            return $s !== '' ? $s : null;
        }

        return null;
    }

    private static function nameFromSnapshot(array $view): string
    {
        foreach (['razorpay_snapshot', 'snapshot'] as $snapKey) {
            $snap = $view[$snapKey] ?? null;
            if (!is_array($snap)) {
                continue;
            }
            $cd = $snap['customer_details'] ?? [];
            if (!is_array($cd)) {
                continue;
            }
            foreach (['shipping_address', 'billing_address'] as $addrKey) {
                $a = $cd[$addrKey] ?? null;
                if (is_array($a) && trim((string) ($a['name'] ?? '')) !== '') {
                    return trim((string) $a['name']);
                }
            }
        }

        return '';
    }

    /** Razorpay webhook body or verify payload may nest customer under payload.payment.entity */
    private static function extractRazorpayPaymentEntity(array $view): array
    {
        $candidates = [
            $view['payload']['payment']['entity'] ?? null,
            $view['payment']['entity'] ?? null,
            $view['payload_json']['payload']['payment']['entity'] ?? null,
        ];
        foreach ($candidates as $entity) {
            if (is_array($entity)) {
                return $entity;
            }
        }

        return [];
    }

    /** @return array<string, mixed>|null */
    private static function pickShippingAddress(array $orderApi): ?array
    {
        $cd = $orderApi['customer_details'] ?? [];
        if (!is_array($cd)) {
            return null;
        }
        $ship = $cd['shipping_address'] ?? null;
        if (is_array($ship) && trim((string) ($ship['line1'] ?? '')) !== '') {
            return $ship;
        }
        $bill = $cd['billing_address'] ?? null;

        return is_array($bill) ? $bill : null;
    }

    /** @return array<string, mixed> For Telegram helpers (legacy shape) */
    public static function paymentViewToTelegramContext(array $view): array
    {
        return [
            'orderId' => (string) ($view['orderId'] ?? $view['id'] ?? ''),
            'amount' => (float) ($view['amount'] ?? $view['totalAmount'] ?? 0),
            'customer_name' => (string) ($view['customerName'] ?? ''),
            'customer_email' => (string) ($view['customerEmail'] ?? ''),
            'customer_phone' => (string) ($view['customerPhone'] ?? ''),
            'selectedAddress' => is_array($view['selectedAddress'] ?? null) ? $view['selectedAddress'] : [],
            'cart' => is_array($view['cart'] ?? null) ? $view['cart'] : [],
        ];
    }
}
