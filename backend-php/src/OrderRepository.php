<?php

declare(strict_types=1);

namespace Franchglobal;

use PDO;

final class OrderRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function storeOrderInitiation(array $payload): void
    {
        $sql = 'INSERT INTO order_initiations (razorpay_order_id, order_ref, amount, payload_json, created_at)
                VALUES (:razorpay_order_id, :order_ref, :amount, :payload_json, NOW())
                ON DUPLICATE KEY UPDATE amount = VALUES(amount), payload_json = VALUES(payload_json), updated_at = NOW()';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'razorpay_order_id' => (string) ($payload['razorpay_order_id'] ?? ''),
            'order_ref' => (string) ($payload['orderId'] ?? ''),
            'amount' => (float) ($payload['amount'] ?? 0),
            'payload_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
        ]);
    }

    public function storePayment(array $payload): void
    {
        $razorpayOrderId = (string) ($payload['razorpay_order_id'] ?? '');
        $incomingPayloadJson = $payload['payload_json'] ?? $payload;
        $incomingPayloadJson = is_array($incomingPayloadJson) ? $incomingPayloadJson : [];
        $existingPayloadJson = $this->getExistingPaymentPayloadByOrderId($razorpayOrderId);

        // Razorpay can emit payment.failed for an earlier attempt after a later attempt succeeds on the
        // same order id. One payments row per razorpay_order_id must not be downgraded to failed.
        if ($this->shouldSkipStoringFailedPayment($existingPayloadJson, $incomingPayloadJson)) {
            return;
        }

        $mergedPayloadJson = $this->mergePaymentPayload($existingPayloadJson, $incomingPayloadJson);

        $sql = 'INSERT INTO payments (
                    razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at
                ) VALUES (
                    :razorpay_order_id, :razorpay_payment_id, :razorpay_signature, :amount, :is_valid, :payload_json, NOW()
                )
                ON DUPLICATE KEY UPDATE
                    razorpay_payment_id = VALUES(razorpay_payment_id),
                    razorpay_signature = VALUES(razorpay_signature),
                    amount = VALUES(amount),
                    is_valid = VALUES(is_valid),
                    payload_json = VALUES(payload_json),
                    updated_at = NOW()';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'razorpay_order_id' => $razorpayOrderId,
            'razorpay_payment_id' => (string) ($payload['razorpay_payment_id'] ?? ''),
            'razorpay_signature' => (string) ($payload['razorpay_signature'] ?? ''),
            'amount' => (float) ($payload['amount'] ?? 0),
            'is_valid' => !empty($payload['is_valid']) ? 1 : 0,
            'payload_json' => json_encode($mergedPayloadJson, JSON_UNESCAPED_SLASHES),
        ]);
    }

    private function getExistingPaymentPayloadByOrderId(string $razorpayOrderId): array
    {
        if ($razorpayOrderId === '') {
            return [];
        }
        $stmt = $this->pdo->prepare('SELECT payload_json FROM payments WHERE razorpay_order_id = :razorpay_order_id LIMIT 1');
        $stmt->execute(['razorpay_order_id' => $razorpayOrderId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return [];
        }
        $decoded = json_decode((string) ($row['payload_json'] ?? '{}'), true);
        return is_array($decoded) ? $decoded : [];
    }

    private function isMeaningfulScalar(mixed $value): bool
    {
        if ($value === null) {
            return false;
        }
        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '' || $trimmed === '—' || strtoupper($trimmed) === 'N/A') {
                return false;
            }
            return true;
        }
        if (is_bool($value)) {
            return true;
        }
        if (is_int($value) || is_float($value)) {
            return $value !== 0;
        }
        return true;
    }

    private function pickPreferredScalar(mixed $incoming, mixed $existing): mixed
    {
        if ($this->isMeaningfulScalar($incoming)) {
            return $incoming;
        }
        if ($this->isMeaningfulScalar($existing)) {
            return $existing;
        }
        return $incoming ?? $existing;
    }

    private function extractPaymentEntity(array $payload): array
    {
        $entity = $payload['payload']['payment']['entity'] ?? null;
        if (is_array($entity)) {
            return $entity;
        }
        $legacy = $payload['payment']['entity'] ?? null;

        return is_array($legacy) ? $legacy : [];
    }

    private function paymentPayloadIndicatesSuccessfulCharge(array $payload): bool
    {
        $event = strtolower((string) ($payload['event'] ?? ''));
        if (in_array($event, ['payment.captured', 'order.paid'], true)) {
            return true;
        }
        $entity = $this->extractPaymentEntity($payload);
        $status = strtolower((string) ($entity['status'] ?? ''));
        if ($status === 'captured') {
            return true;
        }
        $verified = !empty($payload['is_valid']) || !empty($payload['isValid']);
        $pid = (string) ($payload['razorpay_payment_id'] ?? '');
        if ($verified && $pid !== '' && $event !== 'payment.failed') {
            return true;
        }

        return false;
    }

    private function shouldSkipStoringFailedPayment(array $existingPayload, array $incomingPayload): bool
    {
        $incomingEvent = strtolower((string) ($incomingPayload['event'] ?? ''));
        if ($incomingEvent !== 'payment.failed') {
            return false;
        }
        if (!$this->paymentPayloadIndicatesSuccessfulCharge($existingPayload)) {
            return false;
        }
        $incomingEntity = $this->extractPaymentEntity($incomingPayload);
        $incomingPid = (string) ($incomingEntity['id'] ?? '');
        if ($incomingPid === '') {
            return false;
        }

        $existingEntity = $this->extractPaymentEntity($existingPayload);
        $existingPid = (string) ($existingEntity['id'] ?? '');
        if ($existingPid === '') {
            $existingPid = (string) ($existingPayload['razorpay_payment_id'] ?? '');
        }
        if ($existingPid === '') {
            return false;
        }

        return $incomingPid !== $existingPid;
    }

    private function mergePaymentPayload(array $existing, array $incoming): array
    {
        $merged = array_merge($existing, $incoming);

        $merged['customer'] = array_merge(
            is_array($existing['customer'] ?? null) ? $existing['customer'] : [],
            is_array($incoming['customer'] ?? null) ? $incoming['customer'] : []
        );
        $merged['customer']['name'] = $this->pickPreferredScalar(
            $incoming['customer']['name'] ?? ($incoming['name'] ?? null),
            $existing['customer']['name'] ?? ($existing['name'] ?? null)
        );
        $merged['customer']['email'] = $this->pickPreferredScalar(
            $incoming['customer']['email'] ?? ($incoming['email'] ?? null),
            $existing['customer']['email'] ?? ($existing['email'] ?? null)
        );
        $merged['customer']['phone'] = $this->pickPreferredScalar(
            $incoming['customer']['phone'] ?? ($incoming['phone'] ?? null),
            $existing['customer']['phone'] ?? ($existing['phone'] ?? null)
        );

        $merged['selectedAddress'] = array_merge(
            is_array($existing['selectedAddress'] ?? null) ? $existing['selectedAddress'] : [],
            is_array($incoming['selectedAddress'] ?? null) ? $incoming['selectedAddress'] : []
        );
        if (count($merged['selectedAddress']) === 0) {
            $merged['selectedAddress'] = is_array($existing['address'] ?? null)
                ? $existing['address']
                : (is_array($incoming['address'] ?? null) ? $incoming['address'] : []);
        }

        $incomingCart = is_array($incoming['cart'] ?? null) ? $incoming['cart'] : [];
        $existingCart = is_array($existing['cart'] ?? null) ? $existing['cart'] : [];
        $merged['cart'] = count($incomingCart) > 0 ? $incomingCart : $existingCart;

        $merged['name'] = $this->pickPreferredScalar($incoming['name'] ?? null, $existing['name'] ?? null);
        $merged['customer_name'] = $this->pickPreferredScalar(
            $incoming['customer_name'] ?? ($incoming['customerName'] ?? null),
            $existing['customer_name'] ?? ($existing['customerName'] ?? null)
        );
        if (!$this->isMeaningfulScalar($merged['name'] ?? null) && $this->isMeaningfulScalar($merged['customer_name'] ?? null)) {
            $merged['name'] = $merged['customer_name'];
        }
        $merged['email'] = $this->pickPreferredScalar($incoming['email'] ?? null, $existing['email'] ?? null);
        $merged['customer_email'] = $this->pickPreferredScalar(
            $incoming['customer_email'] ?? ($incoming['customerEmail'] ?? null),
            $existing['customer_email'] ?? ($existing['customerEmail'] ?? null)
        );
        if (!$this->isMeaningfulScalar($merged['email'] ?? null) && $this->isMeaningfulScalar($merged['customer_email'] ?? null)) {
            $merged['email'] = $merged['customer_email'];
        }
        $merged['phone'] = $this->pickPreferredScalar($incoming['phone'] ?? null, $existing['phone'] ?? null);
        $merged['customer_phone'] = $this->pickPreferredScalar(
            $incoming['customer_phone'] ?? ($incoming['customerPhone'] ?? null),
            $existing['customer_phone'] ?? ($existing['customerPhone'] ?? null)
        );
        if (!$this->isMeaningfulScalar($merged['phone'] ?? null) && $this->isMeaningfulScalar($merged['customer_phone'] ?? null)) {
            $merged['phone'] = $merged['customer_phone'];
        }

        $merged['selectedAddress']['name'] = $this->pickPreferredScalar(
            $incoming['selectedAddress']['name'] ?? null,
            $existing['selectedAddress']['name'] ?? null
        );
        $merged['orderId'] = $this->pickPreferredScalar($incoming['orderId'] ?? null, $existing['orderId'] ?? null);

        foreach (['fulfillmentStatus', 'awbNumber', 'trackingUrl', 'userId'] as $key) {
            if (array_key_exists($key, $incoming) && $this->isMeaningfulScalar($incoming[$key])) {
                $merged[$key] = $incoming[$key];
            } elseif (!isset($merged[$key]) && isset($existing[$key])) {
                $merged[$key] = $existing[$key];
            }
        }
        if (!empty($incoming['placedEmailSent'])) {
            $merged['placedEmailSent'] = true;
        } elseif (!empty($existing['placedEmailSent'])) {
            $merged['placedEmailSent'] = true;
        }

        return $merged;
    }

    public function storeWebhook(array $webhook, string $signature, bool $signatureValid): void
    {
        $sql = 'INSERT INTO razorpay_webhooks (event_type, entity_id, signature, signature_valid, payload_json, created_at)
                VALUES (:event_type, :entity_id, :signature, :signature_valid, :payload_json, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'event_type' => (string) ($webhook['event'] ?? 'unknown'),
            'entity_id' => (string) (($webhook['payload']['payment']['entity']['id'] ?? $webhook['id'] ?? 'unknown')),
            'signature' => $signature,
            'signature_valid' => $signatureValid ? 1 : 0,
            'payload_json' => json_encode($webhook, JSON_UNESCAPED_SLASHES),
        ]);
    }

    public function getOrderInitiationByRazorpayOrderId(string $razorpayOrderId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT payload_json FROM order_initiations WHERE razorpay_order_id = :razorpay_order_id LIMIT 1');
        $stmt->execute(['razorpay_order_id' => $razorpayOrderId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return null;
        }

        $payload = json_decode((string) ($row['payload_json'] ?? '{}'), true);
        return is_array($payload) ? $payload : null;
    }

    public function hasWebhookEventEntity(string $eventType, string $entityId): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM razorpay_webhooks WHERE event_type = :event_type AND entity_id = :entity_id LIMIT 1');
        $stmt->execute([
            'event_type' => $eventType,
            'entity_id' => $entityId,
        ]);
        return (bool) $stmt->fetchColumn();
    }

    public function upsertRazorpayOrderSnapshot(string $razorpayOrderId, array $orderApiJson): void
    {
        if ($razorpayOrderId === '') {
            return;
        }
        $sql = 'INSERT INTO razorpay_order_snapshots (razorpay_order_id, payload_json, fetched_at, updated_at)
                VALUES (:razorpay_order_id, :payload_json, NOW(), NOW())
                ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), updated_at = NOW()';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'razorpay_order_id' => $razorpayOrderId,
            'payload_json' => json_encode($orderApiJson, JSON_UNESCAPED_SLASHES),
        ]);
    }

    public function getRazorpayOrderSnapshotByRazorpayOrderId(string $razorpayOrderId): ?array
    {
        if ($razorpayOrderId === '') {
            return null;
        }
        $stmt = $this->pdo->prepare('SELECT payload_json FROM razorpay_order_snapshots WHERE razorpay_order_id = :id LIMIT 1');
        $stmt->execute(['id' => $razorpayOrderId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return null;
        }
        $decoded = json_decode((string) ($row['payload_json'] ?? '{}'), true);
        return is_array($decoded) ? $decoded : null;
    }
}

