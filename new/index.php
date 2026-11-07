<?php

declare(strict_types=1);

use Franchglobal\Config;
use Franchglobal\Session;
use Franchglobal\Database;
use Franchglobal\Http;
use Franchglobal\MetaCapiService;
use Franchglobal\OrderRepository;
use Franchglobal\OrderEmailTemplates;
use Franchglobal\CustomerAddressHelper;
use Franchglobal\CustomerDataRepository;
use Franchglobal\PaymentOrderHelper;

require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Session.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Http.php';
require_once __DIR__ . '/src/MetaCapiService.php';
require_once __DIR__ . '/src/OrderRepository.php';
require_once __DIR__ . '/src/OrderEmailTemplates.php';
require_once __DIR__ . '/src/CustomerDataRepository.php';
require_once __DIR__ . '/src/CustomerAddressHelper.php';
require_once __DIR__ . '/src/PaymentOrderHelper.php';

Session::start();

Http::cors();
Http::preflight();

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = Http::body();

/**
 * Temporary maintenance gate:
 * - Enable with APP_MAINTENANCE=true
 * - Allow only browsers with a matching secret cookie
 * - Keep Razorpay webhook and public product reviews API accessible (storefront reads/writes reviews in MySQL only)
 */
$maintenanceEnabled = filter_var((string) Config::get('APP_MAINTENANCE', 'false'), FILTER_VALIDATE_BOOLEAN);
if ($maintenanceEnabled) {
    $maintenanceCookieName = (string) Config::get('MAINTENANCE_COOKIE_NAME', 'site_access');
    $maintenanceCookieSecret = (string) Config::get('MAINTENANCE_COOKIE_SECRET', '');
    $requestCookieValue = (string) ($_COOKIE[$maintenanceCookieName] ?? '');
    $isWebhookPath = $path === '/api/webhooks/razorpay';
    $isReviewsApi = $path === '/api/reviews';
    $isRazorpayPaymentApi = str_starts_with($path, '/api/payments/razorpay/');

    $hasBypassCookie = $maintenanceCookieSecret !== ''
        && $requestCookieValue !== ''
        && hash_equals($maintenanceCookieSecret, $requestCookieValue);

    if (!$isWebhookPath && !$isReviewsApi && !$isRazorpayPaymentApi && !$hasBypassCookie) {
        Http::json([
            'success' => false,
            'error' => 'Service temporarily under maintenance',
        ], 503);
    }
}

$pdo = Database::pdo();
$repo = new OrderRepository($pdo);

function httpJsonRequest(string $url, array $options = []): array
{
    $method = $options['method'] ?? 'POST';
    $headers = $options['headers'] ?? ['Content-Type: application/json'];
    $payload = $options['json'] ?? null;
    $basicAuth = $options['basic_auth'] ?? null;

    $ch = curl_init($url);
    $curlOpts = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'FranchGlobal/1.0',
    ];
    if (($options['ssl_verify'] ?? true) === false) {
        $curlOpts[CURLOPT_SSL_VERIFYPEER] = false;
        $curlOpts[CURLOPT_SSL_VERIFYHOST] = 0;
    }
    curl_setopt_array($ch, $curlOpts);

    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }
    if ($basicAuth) {
        curl_setopt($ch, CURLOPT_USERPWD, $basicAuth[0] . ':' . $basicAuth[1]);
    }

    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'ok' => !$error && $status >= 200 && $status < 300,
        'status' => $status,
        'error' => $error ?: null,
        'raw' => $raw ?: '',
        'json' => json_decode((string) $raw, true),
    ];
}

/**
 * Shiprocket create/adhoc expects flat billing_* / shipping_* keys, not nested billing/shipping objects.
 */
function normalizeShiprocketCreateOrderPayload(array $input): array
{
    if (!empty($input['billing_customer_name'])) {
        return $input;
    }

    $billing = is_array($input['billing'] ?? null) ? $input['billing'] : [];
    $shipping = is_array($input['shipping'] ?? null) ? $input['shipping'] : [];
    $shippingIsBilling = $shipping['is_billing'] ?? $input['shipping_is_billing'] ?? true;
    if (is_string($shippingIsBilling)) {
        $shippingIsBilling = filter_var($shippingIsBilling, FILTER_VALIDATE_BOOLEAN);
    }

    $payload = [
        'order_id' => (string) ($input['order_id'] ?? ('FM_' . time())),
        'order_date' => (string) ($input['order_date'] ?? date('Y-m-d H:i')),
        'pickup_location' => (string) ($input['pickup_location'] ?? Config::get('SHIPROCKET_PICKUP_LOCATION', 'Primary')),
        'comment' => (string) ($input['comment'] ?? ''),
        'billing_customer_name' => trim((string) ($billing['name'] ?? '')),
        'billing_last_name' => trim((string) ($billing['last_name'] ?? '')),
        'billing_address' => trim((string) ($billing['address'] ?? '')),
        'billing_address_2' => trim((string) ($billing['address_2'] ?? '')),
        'billing_city' => trim((string) ($billing['city'] ?? '')),
        'billing_pincode' => trim((string) ($billing['pincode'] ?? '')),
        'billing_state' => trim((string) ($billing['state'] ?? '')),
        'billing_country' => trim((string) ($billing['country'] ?? 'India')),
        'billing_email' => trim((string) ($billing['email'] ?? '')),
        'billing_phone' => preg_replace('/\D/', '', (string) ($billing['phone'] ?? '')),
        'shipping_is_billing' => (bool) $shippingIsBilling,
        'payment_method' => (string) ($input['payment_method'] ?? 'Prepaid'),
        'shipping_charges' => (float) ($input['shipping_charges'] ?? 0),
        'giftwrap_charges' => (float) ($input['giftwrap_charges'] ?? 0),
        'transaction_charges' => (float) ($input['transaction_charges'] ?? 0),
        'total_discount' => (float) ($input['total_discount'] ?? 0),
        'sub_total' => (float) ($input['sub_total'] ?? 0),
        'length' => (float) ($input['length'] ?? 10),
        'breadth' => (float) ($input['breadth'] ?? 10),
        'height' => (float) ($input['height'] ?? 10),
        'weight' => (float) ($input['weight'] ?? 0.5),
        'order_items' => is_array($input['order_items'] ?? null) ? $input['order_items'] : [],
    ];

    if (!$payload['shipping_is_billing']) {
        $payload['shipping_customer_name'] = trim((string) ($shipping['name'] ?? ''));
        $payload['shipping_last_name'] = trim((string) ($shipping['last_name'] ?? ''));
        $payload['shipping_address'] = trim((string) ($shipping['address'] ?? ''));
        $payload['shipping_address_2'] = trim((string) ($shipping['address_2'] ?? ''));
        $payload['shipping_city'] = trim((string) ($shipping['city'] ?? ''));
        $payload['shipping_pincode'] = trim((string) ($shipping['pincode'] ?? ''));
        $payload['shipping_state'] = trim((string) ($shipping['state'] ?? ''));
        $payload['shipping_country'] = trim((string) ($shipping['country'] ?? 'India'));
        $payload['shipping_email'] = trim((string) ($shipping['email'] ?? ''));
        $payload['shipping_phone'] = preg_replace('/\D/', '', (string) ($shipping['phone'] ?? ''));
    }

    return $payload;
}

function shiprocketFormatValidationError(array $details): string
{
    if (!is_array($details['errors'] ?? null)) {
        return (string) ($details['message'] ?? 'Shiprocket rejected the order data.');
    }
    $parts = [];
    foreach ($details['errors'] as $field => $messages) {
        if (is_array($messages)) {
            $parts[] = $field . ': ' . implode(', ', $messages);
        }
    }
    return $parts ? implode('; ', $parts) : (string) ($details['message'] ?? 'Invalid order data for Shiprocket.');
}

function verifyRazorpaySignature(string $orderId, string $paymentId, string $signature): bool
{
    $secret = Config::get('RAZORPAY_KEY_SECRET', '');
    if (!$secret) {
        return false;
    }
    $generated = hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);
    return hash_equals($generated, $signature);
}

/**
 * GET /v1/orders/:id — Magic Checkout docs: includes customer_details.shipping_address when available.
 */
function fetchRazorpayOrderFromApi(string $orderId): ?array
{
    $orderId = trim($orderId);
    if ($orderId === '') {
        return null;
    }
    $keyId = Config::get('RAZORPAY_KEY_ID', '');
    $keySecret = Config::get('RAZORPAY_KEY_SECRET', '');
    if ($keyId === '' || $keySecret === '') {
        return null;
    }
    $url = 'https://api.razorpay.com/v1/orders/' . rawurlencode($orderId);
    $resp = httpJsonRequest($url, [
        'method' => 'GET',
        'headers' => ['Content-Type: application/json'],
        'basic_auth' => [$keyId, $keySecret],
    ]);
    if (!$resp['ok'] || !is_array($resp['json'])) {
        logRazorpayWebhook('razorpay_order_fetch_failed', [
            'order_id' => $orderId,
            'http_status' => $resp['status'] ?? 0,
            'curl_error' => $resp['error'],
            'raw_snippet' => substr((string) ($resp['raw'] ?? ''), 0, 500),
        ]);
        return null;
    }
    return $resp['json'];
}

function razorpayOrderAddressHasContent(array $a): bool
{
    $blob = trim((string) ($a['line1'] ?? ''))
        . trim((string) ($a['line2'] ?? ''))
        . trim((string) ($a['zipcode'] ?? ''))
        . trim((string) ($a['city'] ?? ''));

    return $blob !== '';
}

function razorpayOrderPickShippingLikeAddress(array $orderApi): ?array
{
    $cd = $orderApi['customer_details'] ?? null;
    if (!is_array($cd)) {
        return null;
    }
    $ship = $cd['shipping_address'] ?? null;
    if (is_array($ship) && razorpayOrderAddressHasContent($ship)) {
        return $ship;
    }
    $bill = $cd['billing_address'] ?? null;
    if (is_array($bill) && razorpayOrderAddressHasContent($bill)) {
        return $bill;
    }

    return null;
}

/**
 * Enrich initiation with Fetch Order API (address, contact, line_items) for Telegram / display.
 */
function mergeInitiationWithRazorpayOrderApi(?array $initiation, ?array $orderApi): ?array
{
    $initiation = is_array($initiation) ? $initiation : [];
    if ($orderApi === null || !is_array($orderApi)) {
        return count($initiation) > 0 ? $initiation : null;
    }

    $ship = razorpayOrderPickShippingLikeAddress($orderApi);
    if (is_array($ship)) {
        $initiation['selectedAddress'] = array_merge(
            is_array($initiation['selectedAddress'] ?? null) ? $initiation['selectedAddress'] : [],
            [
                'line1' => (string) ($ship['line1'] ?? ''),
                'line2' => (string) ($ship['line2'] ?? ''),
                'city' => (string) ($ship['city'] ?? ''),
                'state' => (string) ($ship['state'] ?? ''),
                'country' => (string) ($ship['country'] ?? ''),
                'pincode' => (string) ($ship['zipcode'] ?? ''),
                'area' => '',
            ]
        );
        $n = trim((string) ($ship['name'] ?? ''));
        if ($n !== '' && trim((string) ($initiation['customer_name'] ?? '')) === '') {
            $initiation['customer_name'] = $n;
        }
    }

    $cd = $orderApi['customer_details'] ?? [];
    if (is_array($cd)) {
        if (!empty($cd['email']) && trim((string) ($initiation['customer_email'] ?? '')) === '') {
            $initiation['customer_email'] = (string) $cd['email'];
        }
        if (!empty($cd['contact']) && trim((string) ($initiation['customer_phone'] ?? '')) === '') {
            $initiation['customer_phone'] = (string) $cd['contact'];
        }
    }

    $lineItems = $orderApi['line_items'] ?? [];
    if (is_array($lineItems) && count($lineItems) > 0 && empty($initiation['cart'])) {
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
            $initiation['cart'] = $cartFromApi;
        }
    }

    return count($initiation) > 0 ? $initiation : null;
}

function hasNonEmptyAddress(?array $initiation): bool
{
    if (!is_array($initiation)) {
        return false;
    }
    $a = $initiation['selectedAddress'] ?? null;
    if (!is_array($a)) {
        return false;
    }

    $joined = trim(
        (string) ($a['line1'] ?? '')
        . (string) ($a['line2'] ?? '')
        . (string) ($a['area'] ?? '')
        . (string) ($a['city'] ?? '')
        . (string) ($a['state'] ?? '')
        . (string) ($a['country'] ?? '')
        . (string) ($a['pincode'] ?? $a['zipcode'] ?? '')
    );

    return $joined !== '';
}

function sendTelegramHtmlMessage(string $message): array
{
    $token = Config::get('TELEGRAM_BOT_TOKEN', '');
    $chatId = Config::get('TELEGRAM_GROUP_ID', '');
    if (!$token || !$chatId || trim($message) === '') {
        return ['success' => false, 'error' => 'telegram_config_or_message_missing'];
    }

    $payload = [
        'chat_id' => $chatId,
        'text' => mb_strlen($message) > 3500 ? (mb_substr($message, 0, 3500) . "\n\n[truncated]") : $message,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true,
    ];
    $resp = httpJsonRequest(
        'https://api.telegram.org/bot' . $token . '/sendMessage',
        ['headers' => ['Content-Type: application/json'], 'json' => $payload]
    );

    if ($resp['ok'] && !empty($resp['json']['ok'])) {
        return ['success' => true];
    }

    // Fallback plain text when HTML formatting fails.
    $plain = strip_tags($payload['text']);
    $retry = httpJsonRequest(
        'https://api.telegram.org/bot' . $token . '/sendMessage',
        ['headers' => ['Content-Type: application/json'], 'json' => [
            'chat_id' => $chatId,
            'text' => $plain,
            'disable_web_page_preview' => true,
        ]]
    );
    return ['success' => ($retry['ok'] && !empty($retry['json']['ok']))];
}

function resolveTelegramCustomerName(string $nameCandidate, string $emailCandidate): string
{
    $name = trim($nameCandidate);
    if ($name !== '' && strtoupper($name) !== 'N/A') {
        return $name;
    }

    $email = trim($emailCandidate);
    if ($email === '' || strtoupper($email) === 'N/A') {
        return 'N/A';
    }

    $atPos = strpos($email, '@');
    $localPart = $atPos === false ? $email : substr($email, 0, $atPos);
    $localPart = trim(str_replace(['.', '_', '-'], ' ', $localPart));
    $localPart = preg_replace('/\s+/', ' ', $localPart) ?? '';
    if ($localPart === '') {
        return 'N/A';
    }

    return ucwords(strtolower($localPart));
}

function buildTelegramProductsData(array $entity, ?array $initiation): array
{
    $items = [];
    $itemsTotal = 0.0;

    $cart = is_array($initiation['cart'] ?? null) ? $initiation['cart'] : [];
    foreach ($cart as $item) {
        if (!is_array($item)) {
            continue;
        }
        $name = trim((string) ($item['title'] ?? $item['name'] ?? 'Item'));
        $qty = (int) ($item['qty'] ?? 1);
        $price = (float) ($item['price'] ?? 0);
        $lineTotal = $price * max(1, $qty);
        $items[] = [
            'name' => $name,
            'quantity' => max(1, $qty),
            'price' => $price,
            'total' => $lineTotal,
        ];
        $itemsTotal += $lineTotal;
    }
    if (count($items) > 0) {
        return [
            'items' => $items,
            'items_count' => count($items),
            'items_total' => $itemsTotal,
        ];
    }

    // Fallback for webhook-only cases: use Razorpay notes summary/description.
    $notesItems = trim((string) (($entity['notes']['items'] ?? '')));
    if ($notesItems !== '') {
        // Notes can be delimited by comma or semicolon depending on the producer.
        $parts = preg_split('/\s*[,;]\s*/', $notesItems) ?: [];
        $parts = array_filter(array_map('trim', $parts));
        foreach ($parts as $part) {
            $name = $part;
            $quantity = 1;
            if (preg_match('/^(.*?)\s*x\s*(\d+)$/i', $part, $m)) {
                $name = trim((string) $m[1]);
                $quantity = (int) $m[2];
            }
            $items[] = [
                'name' => $name !== '' ? $name : 'Item',
                'quantity' => max(1, $quantity),
                'price' => null,
                'total' => null,
            ];
        }
    }

    if (count($items) === 0) {
        $description = trim((string) ($entity['description'] ?? ''));
        if ($description !== '') {
            $items[] = [
                'name' => $description,
                'quantity' => 1,
                'price' => null,
                'total' => null,
            ];
        }
    }

    return [
        'items' => $items,
        'items_count' => count($items),
        'items_total' => null,
    ];
}

function buildTelegramAddressData(array $entity, ?array $initiation): array
{
    $selectedAddress = is_array($initiation['selectedAddress'] ?? null) ? $initiation['selectedAddress'] : [];
    $notes = is_array($entity['notes'] ?? null) ? $entity['notes'] : [];

    $line1 = trim((string) (($selectedAddress['line1'] ?? '') ?: ($notes['address_line1'] ?? '')));
    $line2 = trim((string) (($selectedAddress['line2'] ?? $selectedAddress['street'] ?? '') ?: ($notes['address_line2'] ?? '')));
    $area = trim((string) (($selectedAddress['area'] ?? '') ?: ($notes['area'] ?? '')));
    $city = trim((string) (($selectedAddress['city'] ?? '') ?: ($notes['city'] ?? '')));
    $state = trim((string) (($selectedAddress['state'] ?? '') ?: ($notes['state'] ?? '')));
    $country = trim((string) (($selectedAddress['country'] ?? '') ?: ($notes['country'] ?? '')));
    $pincode = trim((string) (($selectedAddress['pincode'] ?? $selectedAddress['zipcode'] ?? '') ?: ($notes['pincode'] ?? '')));

    return [
        'line1' => $line1 !== '' ? $line1 : 'N/A',
        'line2' => $line2 !== '' ? $line2 : 'N/A',
        'area' => $area !== '' ? $area : 'N/A',
        'city' => $city !== '' ? $city : 'N/A',
        'state' => $state !== '' ? $state : 'N/A',
        'country' => $country !== '' ? $country : 'N/A',
        'pincode' => $pincode !== '' ? $pincode : 'N/A',
    ];
}

function appendTelegramAddressSectionToLines(array &$lines, array $entity, ?array $initiation): void
{
    $address = buildTelegramAddressData($entity, $initiation);
    $lines[] = '<b>address:</b>';
    $lines[] = '  <b>line1:</b> ' . htmlspecialchars((string) $address['line1']);
    $lines[] = '  <b>line2:</b> ' . htmlspecialchars((string) $address['line2']);
    $lines[] = '  <b>city:</b> ' . htmlspecialchars((string) $address['city']);
    $lines[] = '  <b>state:</b> ' . htmlspecialchars((string) $address['state']);
    $lines[] = '  <b>country:</b> ' . htmlspecialchars((string) $address['country']);
    $lines[] = '  <b>pincode:</b> ' . htmlspecialchars((string) $address['pincode']);
}

/**
 * Appends the same products block (items, name/quantity/price/total, total amount) for success and failed webhooks.
 */
function appendTelegramProductsSectionToLines(array &$lines, array $entity, ?array $initiation, float $amount): void
{
    $products = buildTelegramProductsData($entity, $initiation);
    $items = is_array($products['items'] ?? null) ? $products['items'] : [];
    if (count($items) === 0) {
        return;
    }
    $lines[] = '<b>products:</b>';
    $lines[] = '  <b>items:</b> ' . (int) ($products['items_count'] ?? count($items));
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }
        $lineName = (string) ($item['name'] ?? 'Item');
        $lineQty = (int) ($item['quantity'] ?? 1);
        $linePrice = $item['price'] ?? null;
        $lineTotal = $item['total'] ?? null;
        $lines[] = '';
        $lines[] = '  <b>name:</b> ' . htmlspecialchars($lineName);
        $lines[] = '  <b>quantity:</b> ' . $lineQty;
        $lines[] = '  <b>price:</b> ' . ($linePrice === null ? 'N/A' : number_format((float) $linePrice, 2, '.', ''));
        $lines[] = '  <b>total:</b> ' . ($lineTotal === null ? 'N/A' : number_format((float) $lineTotal, 2, '.', ''));
    }
    $finalItemsTotal = $products['items_total'] ?? null;
    $lines[] = '';
    $lines[] = '<b>total amount:</b> ' . ($finalItemsTotal === null
        ? number_format($amount, 2, '.', '')
        : number_format((float) $finalItemsTotal, 2, '.', ''));
}

function formatTelegramPaidMessage(array $entity, ?array $initiation): string
{
    $orderRef = (string) (($initiation['orderId'] ?? '') ?: ($entity['order_id'] ?? 'N/A'));
    $paymentId = (string) ($entity['id'] ?? 'N/A');
    $razorpayOrderId = (string) ($entity['order_id'] ?? 'N/A');
    $amount = isset($entity['amount']) ? ((float) $entity['amount'] / 100) : (float) (($initiation['amount'] ?? 0));

    $customerEmail = (string) (($initiation['customer_email'] ?? '') ?: ($entity['email'] ?? 'N/A'));
    $customerName = resolveTelegramCustomerName(
        (string) (($initiation['customer_name'] ?? '') ?: ($entity['name'] ?? '')),
        $customerEmail
    );
    $customerPhone = (string) (($initiation['customer_phone'] ?? '') ?: ($entity['contact'] ?? 'N/A'));

    $lines = [
        '<b>Payment Successfully Completed</b>',
        '',
        '<b>status:</b> paid',
        '<b>orderId:</b> ' . htmlspecialchars($orderRef),
        '<b>razorpayOrderId:</b> ' . htmlspecialchars($razorpayOrderId),
        '<b>razorpayPaymentId:</b> ' . htmlspecialchars($paymentId),
        '<b>customer:</b>',
        '  <b>name:</b> ' . htmlspecialchars($customerName),
        '  <b>email:</b> ' . htmlspecialchars($customerEmail),
        '  <b>phone:</b> ' . htmlspecialchars($customerPhone),
        '<b>totalAmount:</b> ' . number_format($amount, 2, '.', ''),
        '<b>currency:</b> INR',
    ];
    appendTelegramAddressSectionToLines($lines, $entity, $initiation);
    appendTelegramProductsSectionToLines($lines, $entity, $initiation, $amount);
    return implode("\n", $lines);
}

function formatTelegramFailedMessage(array $entity, ?array $initiation): string
{
    $orderRef = (string) (($initiation['orderId'] ?? '') ?: ($entity['order_id'] ?? 'N/A'));
    $paymentId = (string) ($entity['id'] ?? 'N/A');
    $razorpayOrderId = (string) ($entity['order_id'] ?? 'N/A');
    $amount = isset($entity['amount']) ? ((float) $entity['amount'] / 100) : (float) (($initiation['amount'] ?? 0));

    $customerEmail = (string) (($initiation['customer_email'] ?? '') ?: ($entity['email'] ?? 'N/A'));
    $customerName = resolveTelegramCustomerName(
        (string) (($initiation['customer_name'] ?? '') ?: ($entity['name'] ?? '')),
        $customerEmail
    );
    $customerPhone = (string) (($initiation['customer_phone'] ?? '') ?: ($entity['contact'] ?? 'N/A'));
    $errorCode = (string) ($entity['error_code'] ?? 'N/A');
    $errorDescription = (string) ($entity['error_description'] ?? 'N/A');
    $errorReason = (string) ($entity['error_reason'] ?? 'N/A');

    $lines = [
        '<b>❌ Payment Failed (Webhook)</b>',
        '',
        '<b>Order Ref:</b> ' . htmlspecialchars($orderRef),
        '<b>Razorpay Order:</b> ' . htmlspecialchars($razorpayOrderId),
        '<b>Payment ID:</b> ' . htmlspecialchars($paymentId),
        '<b>Amount:</b> Rs. ' . number_format($amount, 2, '.', ''),
        '',
        '<b>Customer</b>',
        'Name: ' . htmlspecialchars($customerName),
        'Email: ' . htmlspecialchars($customerEmail),
        'Phone: ' . htmlspecialchars($customerPhone),
    ];
    appendTelegramAddressSectionToLines($lines, $entity, $initiation);
    appendTelegramProductsSectionToLines($lines, $entity, $initiation, $amount);
    $lines[] = '';
    $lines[] = '<b>Failure</b>';
    $lines[] = 'Code: ' . htmlspecialchars($errorCode);
    $lines[] = 'Reason: ' . htmlspecialchars($errorReason);
    $lines[] = 'Description: ' . htmlspecialchars($errorDescription);

    return implode("\n", $lines);
}

function parseAmountToPaise(float $amount): int
{
    return (int) round($amount * 100);
}

function logMagicShipping(string $stage, array $context = []): void
{
    $safeContext = $context;
    if (isset($safeContext['raw_body']) && is_string($safeContext['raw_body'])) {
        $safeContext['raw_body'] = substr($safeContext['raw_body'], 0, 2000);
    }

    $line = json_encode([
        'time' => date('c'),
        'stage' => $stage,
        'context' => $safeContext,
    ], JSON_UNESCAPED_SLASHES);

    if ($line === false) {
        $line = date('c') . ' | ' . $stage . ' | json_encode_failed';
    }

    file_put_contents(__DIR__ . '/magic-shipping.log', $line . PHP_EOL, FILE_APPEND);
}

function logRazorpayWebhook(string $stage, array $context = []): void
{
    $safe = $context;
    if (isset($safe['raw']) && is_string($safe['raw'])) {
        $safe['raw'] = substr($safe['raw'], 0, 5000);
    }
    if (isset($safe['body']) && is_array($safe['body'])) {
        // Avoid logging very large payload branches.
        $encoded = json_encode($safe['body'], JSON_UNESCAPED_SLASHES);
        $safe['body'] = $encoded === false ? '[json_encode_failed]' : substr($encoded, 0, 5000);
    }

    $line = json_encode([
        'time' => date('c'),
        'stage' => $stage,
        'context' => $safe,
    ], JSON_UNESCAPED_SLASHES);

    if ($line === false) {
        $line = date('c') . ' | ' . $stage . ' | json_encode_failed';
    }

    file_put_contents(__DIR__ . '/razorpay-webhook.log', $line . PHP_EOL, FILE_APPEND);
}

function logPaymentEvent(string $eventType, array $context = []): void
{
    $line = json_encode([
        'time' => date('c'),
        'event' => $eventType,
        'context' => $context,
    ], JSON_UNESCAPED_SLASHES);

    if ($line === false) {
        $line = date('c') . ' | ' . $eventType . ' | json_encode_failed';
    }

    file_put_contents(__DIR__ . '/payment-events.log', $line . PHP_EOL, FILE_APPEND);
}

function isMagicSafeImageUrl(string $url): bool
{
    if ($url === '') {
        return false;
    }
    $parts = parse_url($url);
    if (!is_array($parts)) {
        return false;
    }
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if ($scheme !== 'https') {
        return false;
    }
    $host = strtolower((string) ($parts['host'] ?? ''));
    if ($host === '' || $host === 'localhost' || $host === '127.0.0.1' || $host === '::1') {
        return false;
    }
    if (str_ends_with($host, '.localhost')) {
        return false;
    }
    if (preg_match('/^192\.168\./', $host) === 1) {
        return false;
    }
    if (preg_match('/^10\./', $host) === 1) {
        return false;
    }
    if (preg_match('/^172\.(1[6-9]|2\d|3[0-1])\./', $host) === 1) {
        return false;
    }
    return true;
}

function magicImageBaseUrl(): string
{
    $site = trim((string) Config::get('VITE_SITE_URL', ''));
    if ($site === '') {
        $site = trim((string) Config::get('APP_URL', ''));
    }
    if ($site === '') {
        return '';
    }

    // If APP_URL is configured like https://domain.com/api, strip /api.
    $site = rtrim($site, '/');
    if (str_ends_with(strtolower($site), '/api')) {
        $site = substr($site, 0, -4);
    }
    return rtrim($site, '/');
}

function normalizeMagicImageUrl(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }

    // protocol-relative URL (e.g. //cdn.example.com/image.webp)
    if (str_starts_with($url, '//')) {
        return 'https:' . $url;
    }

    // Convert root-relative and plain-relative paths to absolute URL.
    if (str_starts_with($url, '/')) {
        $base = magicImageBaseUrl();
        return $base !== '' ? ($base . $url) : $url;
    }

    if (!preg_match('#^https?://#i', $url)) {
        $base = magicImageBaseUrl();
        if ($base !== '') {
            return $base . '/' . ltrim($url, '/');
        }
    }

    // Razorpay Magic expects publicly accessible https URL.
    if (str_starts_with(strtolower($url), 'http://')) {
        $url = 'https://' . substr($url, 7);
    }

    return $url;
}

function buildMagicLineItems(array $cart, float $amount): array
{
    $placeholderImage = 'https://cdn.razorpay.com/static/assets/logo/rzp-logo.png';
    $toPaise = static fn(float $rupees): int => (int) round($rupees * 100);

    if (count($cart) === 0) {
        $paise = $toPaise($amount);
        return [
            'line_items' => [[
                'sku' => 'order',
                'variant_id' => 'default',
                'price' => $paise,
                'offer_price' => $paise,
                'quantity' => 1,
                'name' => 'Order',
                'description' => 'Online order payment',
                'image_url' => $placeholderImage,
            ]],
            'line_items_total' => $paise,
        ];
    }

    $lineItems = [];
    foreach ($cart as $idx => $item) {
        if (!is_array($item)) {
            continue;
        }
        $qty = max(1, (int) ($item['qty'] ?? 1));
        $pricePaise = $toPaise((float) ($item['price'] ?? 0));
        $sku = substr(preg_replace('/\s+/', '_', (string) ($item['sku'] ?? $item['productId'] ?? ('sku_' . $idx))) ?? ('sku_' . $idx), 0, 100);
        $variantId = substr(preg_replace('/\s+/', '_', (string) ($item['productId'] ?? $item['sku'] ?? ('var_' . $idx))) ?? ('var_' . $idx), 0, 100);
        $name = substr((string) ($item['title'] ?? $item['name'] ?? 'Product'), 0, 500);
        $description = strlen($name) > 250 ? substr($name, 0, 247) . '...' : $name;
        $imageUrl = (string) ($item['imageURL'] ?? $item['image_url'] ?? '');
        $imageUrl = normalizeMagicImageUrl($imageUrl);
        if (!isMagicSafeImageUrl($imageUrl)) {
            $imageUrl = $placeholderImage;
        }

        $lineItems[] = [
            'sku' => $sku,
            'variant_id' => $variantId,
            'price' => $pricePaise,
            'offer_price' => $pricePaise,
            'quantity' => $qty,
            'name' => $name,
            'description' => $description,
            'image_url' => $imageUrl,
        ];
    }

    if (count($lineItems) === 0) {
        $paise = $toPaise($amount);
        $lineItems[] = [
            'sku' => 'order',
            'variant_id' => 'default',
            'price' => $paise,
            'offer_price' => $paise,
            'quantity' => 1,
            'name' => 'Order',
            'description' => 'Online order payment',
            'image_url' => $placeholderImage,
        ];
    }

    $lineItemsTotal = 0;
    foreach ($lineItems as $lineItem) {
        $lineItemsTotal += ((int) $lineItem['offer_price']) * ((int) $lineItem['quantity']);
    }

    return [
        'line_items' => $lineItems,
        'line_items_total' => $lineItemsTotal,
    ];
}

function productsColumnExists(PDO $pdo, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = \'products\' AND COLUMN_NAME = :col'
    );
    $stmt->execute(['col' => $column]);

    return (int) $stmt->fetchColumn() > 0;
}

function ensureProductsDiscountSchema(PDO $pdo): void
{
    if (!productsColumnExists($pdo, 'original_price')) {
        $pdo->exec('ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER price');
    }
    if (!productsColumnExists($pdo, 'discount_percent')) {
        $pdo->exec('ALTER TABLE products ADD COLUMN discount_percent TINYINT UNSIGNED NULL DEFAULT NULL AFTER original_price');
    }
}

function resolveProductDiscountPercent(float $originalPrice, float $salePrice, $storedPercent): int
{
    $stored = $storedPercent !== null && $storedPercent !== '' ? (int) $storedPercent : 0;
    if ($stored > 0) {
        return min(99, $stored);
    }
    if ($originalPrice > 0 && $salePrice > 0 && $originalPrice > $salePrice) {
        return (int) round((1 - $salePrice / $originalPrice) * 100);
    }

    return 0;
}

function normalizeProductRow(array $row): array
{
    $images = [];
    if (!empty($row['images_json'])) {
        $decoded = json_decode((string) $row['images_json'], true);
        if (is_array($decoded)) {
            $images = array_values(array_filter($decoded, fn($x) => is_string($x) && $x !== ''));
        }
    }

    $imageURL = (string) ($row['image_url'] ?? '');
    if ($imageURL === '' && count($images) > 0) {
        $imageURL = (string) $images[0];
    }

    $price = isset($row['price']) ? (float) $row['price'] : 0.0;
    $originalPrice = isset($row['original_price']) ? (float) $row['original_price'] : 0.0;
    $discountPercent = resolveProductDiscountPercent(
        $originalPrice,
        $price,
        $row['discount_percent'] ?? null
    );

    return [
        'id' => (string) $row['id'],
        'firebase_id' => $row['firebase_id'] ?? null,
        'sku' => (string) ($row['sku'] ?? ''),
        'slug' => $row['slug'] ?? null,
        'title' => (string) ($row['title'] ?? ''),
        'subTitle' => (string) ($row['sub_title'] ?? ''),
        'description' => (string) ($row['description'] ?? ''),
        'price' => $price,
        'originalPrice' => $originalPrice,
        'delPrize' => $originalPrice,
        'discountPercent' => $discountPercent,
        'stock' => isset($row['stock']) ? (int) $row['stock'] : 0,
        'category' => (string) ($row['category'] ?? ''),
        'imageURL' => $imageURL,
        'images' => $images,
        'active' => isset($row['active']) ? ((int) $row['active'] === 1) : true,
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function productDiscountPayloadFromInput(array $input): array
{
    $price = (float) ($input['price'] ?? 0);
    $originalPrice = (float) ($input['originalPrice'] ?? $input['delPrize'] ?? $input['original_price'] ?? 0);
    $discountPercent = (int) ($input['discountPercent'] ?? $input['discount_percent'] ?? $input['offer_percentage'] ?? 0);

    if ($originalPrice > $price && $price > 0) {
        $discountPercent = resolveProductDiscountPercent($originalPrice, $price, $discountPercent);
    } elseif ($discountPercent > 0 && $discountPercent < 100 && $price > 0) {
        $originalPrice = (float) ceil($price / (1 - $discountPercent / 100));
    } else {
        $originalPrice = 0;
        $discountPercent = 0;
    }

    return [
        'original_price' => $originalPrice,
        'discount_percent' => $discountPercent > 0 ? $discountPercent : null,
    ];
}

function normalizeBlogRow(array $row): array
{
    $payload = [];
    if (!empty($row['data_json'])) {
        $decoded = json_decode((string) $row['data_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    $body = $payload['body'] ?? [];
    if (!is_array($body)) {
        $body = [];
    }
    $normalizedBody = array_map(function ($block) {
        if (!is_array($block)) {
            return ['type' => 'p', 'content' => ''];
        }
        return [
            'type' => (string) ($block['type'] ?? 'p'),
            'content' => (string) ($block['content'] ?? ''),
        ];
    }, $body);

    return [
        'id' => (string) $row['id'],
        'firebase_id' => $row['firebase_id'] ?? null,
        'title' => (string) ($payload['title'] ?? ''),
        'slug' => (string) ($payload['slug'] ?? ''),
        'category' => (string) ($payload['category'] ?? ''),
        'mainImage' => (string) ($payload['mainImage'] ?? ''),
        'body' => $normalizedBody,
        'active' => !array_key_exists('active', $payload) || !empty($payload['active']),
        'createdAt' => $row['created_at'] ?? ($payload['createdAt'] ?? null),
        'updatedAt' => $row['updated_at'] ?? ($payload['updatedAt'] ?? null),
    ];
}

function normalizeOrderRow(array $row): array
{
    $payload = [];
    if (!empty($row['data_json'])) {
        $decoded = json_decode((string) $row['data_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    return array_merge($payload, [
        'id' => (string) $row['id'],
        'firebase_id' => $row['firebase_id'] ?? null,
        'createdAt' => $row['created_at'] ?? ($payload['createdAt'] ?? null),
        'updatedAt' => $row['updated_at'] ?? ($payload['updatedAt'] ?? null),
    ]);
}

/** Customer-facing delivery steps (updated manually in admin). */
function fulfillmentStatusList(): array
{
    return ['placed', 'shipped', 'in_transit', 'delivered'];
}

function normalizeFulfillmentStatus(?string $status): string
{
    $s = strtolower(trim((string) $status));
    return in_array($s, fulfillmentStatusList(), true) ? $s : 'placed';
}

function normalizeAwbNumber(?string $awb): string
{
    return preg_replace('/\s+/', '', trim((string) $awb)) ?? '';
}

function normalizeTrackingUrl(?string $url): string
{
    $url = trim((string) $url);
    if ($url === '') {
        return '';
    }
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }

    return filter_var($url, FILTER_VALIDATE_URL) ? $url : '';
}

function orderStatusEmailLabel(string $status): string
{
    $status = normalizeFulfillmentStatus($status);
    if ($status === 'in_transit') {
        return 'Out for delivery';
    }
    if ($status === 'shipped') {
        return 'Shipped';
    }
    if ($status === 'delivered') {
        return 'Delivered';
    }

    return 'Order placed';
}

/**
 * Build order status email (HTML + plain text fallback).
 * Edit templates in backend-php/src/OrderEmailTemplates.php
 */
function buildOrderStatusEmailContent(array $order, string $status): array
{
    $status = normalizeFulfillmentStatus($status);

    return [
        'subject' => OrderEmailTemplates::buildSubject($status),
        'body' => OrderEmailTemplates::buildPlainText($order, $status),
        'htmlBody' => OrderEmailTemplates::buildHtml($order, $status),
    ];
}

function smtpReadResponse($socket): ?array
{
    $line = '';
    $all = '';
    while (!feof($socket)) {
        $line = (string) fgets($socket, 1024);
        if ($line === '') {
            break;
        }
        $all .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    $code = (int) substr(trim($line), 0, 3);
    if ($code <= 0) {
        return null;
    }
    return ['code' => $code, 'raw' => trim($all)];
}

function smtpCommand($socket, string $command, array $okCodes): bool
{
    fwrite($socket, $command . "\r\n");
    $resp = smtpReadResponse($socket);
    if (!$resp) {
        return false;
    }
    return in_array((int) $resp['code'], $okCodes, true);
}

function smtpSendPlainTextEmail(string $to, string $subject, string $body, ?string $htmlBody = null): bool
{
    $host = trim((string) Config::get('EMAIL_HOST', ''));
    $port = (int) Config::get('EMAIL_PORT', '587');
    $user = trim((string) Config::get('EMAIL_USER', ''));
    $pass = (string) Config::get('EMAIL_PASSWORD', '');
    if ($host === '' || $port <= 0 || $user === '' || $pass === '') {
        return false;
    }

    $encryption = strtolower(trim((string) Config::get('EMAIL_ENCRYPTION', 'tls')));
    $scheme = ($encryption === 'ssl' || $port === 465) ? 'ssl' : 'tcp';
    $socket = @stream_socket_client($scheme . '://' . $host . ':' . $port, $errno, $errstr, 15);
    if (!$socket) {
        return false;
    }
    stream_set_timeout($socket, 20);

    $greeting = smtpReadResponse($socket);
    if (!$greeting || (int) $greeting['code'] !== 220) {
        fclose($socket);
        return false;
    }

    if (!smtpCommand($socket, 'EHLO franchglobal.com', [250])) {
        fclose($socket);
        return false;
    }

    if ($encryption === 'tls' && $scheme !== 'ssl') {
        if (!smtpCommand($socket, 'STARTTLS', [220])) {
            fclose($socket);
            return false;
        }
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return false;
        }
        if (!smtpCommand($socket, 'EHLO franchglobal.com', [250])) {
            fclose($socket);
            return false;
        }
    }

    if (!smtpCommand($socket, 'AUTH LOGIN', [334])) {
        fclose($socket);
        return false;
    }
    if (!smtpCommand($socket, base64_encode($user), [334])) {
        fclose($socket);
        return false;
    }
    if (!smtpCommand($socket, base64_encode($pass), [235])) {
        fclose($socket);
        return false;
    }
    if (!smtpCommand($socket, 'MAIL FROM:<' . $user . '>', [250])) {
        fclose($socket);
        return false;
    }
    if (!smtpCommand($socket, 'RCPT TO:<' . $to . '>', [250, 251])) {
        fclose($socket);
        return false;
    }
    if (!smtpCommand($socket, 'DATA', [354])) {
        fclose($socket);
        return false;
    }

    $fromName = trim((string) Config::get('EMAIL_FROM_NAME', 'Franch Global'));
    $headers = [
        'From: ' . $fromName . ' <' . $user . '>',
        'Reply-To: ' . $user,
        'MIME-Version: 1.0',
        'Subject: ' . $subject,
        'To: <' . $to . '>',
    ];

    if ($htmlBody !== null && $htmlBody !== '') {
        $boundary = 'fg_' . bin2hex(random_bytes(8));
        $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
        $message = implode("\r\n", $headers) . "\r\n\r\n";
        $message .= '--' . $boundary . "\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $message .= $body . "\r\n";
        $message .= '--' . $boundary . "\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $message .= $htmlBody . "\r\n";
        $message .= '--' . $boundary . "--\r\n.";
    } else {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
    }

    fwrite($socket, $message . "\r\n");
    $dataResp = smtpReadResponse($socket);
    $ok = $dataResp && (int) $dataResp['code'] === 250;

    smtpCommand($socket, 'QUIT', [221]);
    fclose($socket);
    return $ok;
}

function sendOrderStatusEmail(array $order, string $status): bool
{
    $to = authSanitizeEmail((string) ($order['customerEmail'] ?? ($order['email'] ?? '')));
    if ($to === '') {
        return false;
    }

    $smtpUser = trim((string) Config::get('EMAIL_USER', ''));
    if ($smtpUser === '') {
        return false;
    }

    $status = normalizeFulfillmentStatus($status);
    $mail = buildOrderStatusEmailContent($order, $status);
    $subject = $mail['subject'];
    $body = $mail['body'];
    $htmlBody = $mail['htmlBody'] ?? null;

    $ok = smtpSendPlainTextEmail($to, $subject, $body, $htmlBody);
    logPaymentEvent('order_status_email', [
        'status' => $status,
        'to' => $to,
        'orderNo' => (string) ($order['orderNo'] ?? $order['id'] ?? ''),
        'sent' => $ok,
    ]);

    return $ok;
}

function authIsAdminSession(): bool
{
    return (int) ($_SESSION['auth_admin_login_id'] ?? 0) > 0;
}

function authGetCustomerSessionId(): int
{
    return (int) ($_SESSION['auth_customer_id'] ?? $_SESSION['auth_user_id'] ?? 0);
}

/** @return int customer id or exits with 401 */
function authRequireCustomerId(): int
{
    $customerId = authGetCustomerSessionId();
    if ($customerId <= 0 || authIsAdminSession()) {
        Http::json(['success' => false, 'error' => 'Customer login required'], 401);
    }

    return $customerId;
}

function authSetCustomerSessionId(int $customerId): void
{
    $_SESSION['auth_customer_id'] = $customerId;
    $_SESSION['auth_user_id'] = $customerId;
}

function authCustomerSessionUser(PDO $pdo): ?array
{
    if (authIsAdminSession()) {
        return null;
    }
    $customerId = authGetCustomerSessionId();
    if ($customerId <= 0) {
        return null;
    }
    $row = authFindCustomerById($pdo, $customerId);

    return $row ? customerLoginToNormalizedUser($row) : null;
}

function findOrderRowByRazorpayOrderId(PDO $pdo, string $razorpayOrderId): ?array
{
    $razorpayOrderId = trim($razorpayOrderId);
    if ($razorpayOrderId === '') {
        return null;
    }
    $stmt = $pdo->prepare(
        "SELECT id, firebase_id, data_json, created_at, updated_at FROM orders
         WHERE JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.razorpay_order_id')) = :oid
         LIMIT 1"
    );
    $stmt->execute(['oid' => $razorpayOrderId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function customerOrderMatchesUser(array $order, array $user): bool
{
    $userId = (string) ($user['id'] ?? '');
    $email = authSanitizeEmail((string) ($user['email'] ?? ''));
    $orderUserId = (string) ($order['userId'] ?? '');
    $orderEmail = authSanitizeEmail((string) ($order['customerEmail'] ?? ($order['email'] ?? '')));

    if ($userId !== '' && $orderUserId !== '' && $orderUserId === $userId) {
        return true;
    }

    return $email !== '' && $orderEmail !== '' && $orderEmail === $email;
}

function mapCartItemsForOrder(array $cart): array
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

function upsertCustomerOrderFromPayment(PDO $pdo, array $input, ?int $authUserId): ?string
{
    $razorpayOrderId = trim((string) ($input['razorpay_order_id'] ?? ''));
    if ($razorpayOrderId === '') {
        return null;
    }

    $existingRow = findOrderRowByRazorpayOrderId($pdo, $razorpayOrderId);
    $base = [];
    if ($existingRow) {
        $decoded = json_decode((string) ($existingRow['data_json'] ?? '{}'), true);
        if (is_array($decoded)) {
            $base = $decoded;
        }
    }

    $cart = $input['cart'] ?? [];
    if (!is_array($cart)) {
        $cart = [];
    }

    $amountRaw = (float) ($input['amount'] ?? 0);
    $amountRupees = $amountRaw >= 1000 ? ($amountRaw / 100.0) : $amountRaw;
    if ($amountRupees <= 0) {
        $amountRupees = (float) ($base['totalAmount'] ?? 0);
    }

    $profile = is_array($input['profile'] ?? null) ? $input['profile'] : [];
    $customerName = trim((string) ($input['customer_name'] ?? $input['name'] ?? $profile['name'] ?? $base['customerName'] ?? ''));
    $customerEmail = authSanitizeEmail((string) ($input['customer_email'] ?? $input['email'] ?? $profile['email'] ?? $base['customerEmail'] ?? ''));
    $customerPhone = trim((string) ($input['customer_phone'] ?? $input['phone'] ?? $profile['phone'] ?? $base['customerPhone'] ?? ''));
    $address = is_array($input['selectedAddress'] ?? null)
        ? $input['selectedAddress']
        : (is_array($base['address'] ?? null) ? $base['address'] : []);

    $items = mapCartItemsForOrder($cart);
    if (count($items) === 0 && is_array($base['items'] ?? null)) {
        $items = $base['items'];
    }

    $payload = array_merge($base, [
        'razorpay_order_id' => $razorpayOrderId,
        'razorpay_payment_id' => (string) ($input['razorpay_payment_id'] ?? ($base['razorpay_payment_id'] ?? '')),
        'orderRef' => (string) ($input['orderId'] ?? $input['order_ref'] ?? ($base['orderRef'] ?? '')),
        'userId' => $authUserId > 0 ? (string) $authUserId : (string) ($base['userId'] ?? ''),
        'customerName' => $customerName,
        'customerEmail' => $customerEmail,
        'customerPhone' => $customerPhone,
        'email' => $customerEmail,
        'phone' => $customerPhone,
        'name' => $customerName,
        'address' => $address,
        'items' => $items,
        'cart' => $cart,
        'totalAmount' => $amountRupees,
        'paymentStatus' => 'paid',
        'fulfillmentStatus' => normalizeFulfillmentStatus($base['fulfillmentStatus'] ?? 'placed'),
        'status' => 'success',
    ]);

    if (!$existingRow) {
        if (!isset($payload['orderNo'])) {
            $countStmt = $pdo->query('SELECT COUNT(*) AS cnt FROM orders');
            $cnt = (int) ($countStmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);
            $payload['orderNo'] = $cnt + 1;
        }
        $firebaseId = 'order_' . bin2hex(random_bytes(8));
        $stmt = $pdo->prepare('INSERT INTO orders (firebase_id, data_json, created_at, updated_at) VALUES (:firebase_id, :data_json, NOW(), NOW())');
        $stmt->execute([
            'firebase_id' => $firebaseId,
            'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
        ]);

        $newId = (string) $pdo->lastInsertId();
        $payload['id'] = $newId;
        sendOrderStatusEmail($payload, 'placed');

        return $newId;
    }

    $stmt = $pdo->prepare('UPDATE orders SET data_json = :data_json, updated_at = NOW() WHERE id = :id');
    $stmt->execute([
        'id' => (int) $existingRow['id'],
        'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);

    return (string) $existingRow['id'];
}

function normalizeEnquiryRow(array $row): array
{
    $payload = [];
    if (!empty($row['data_json'])) {
        $decoded = json_decode((string) $row['data_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    return array_merge($payload, [
        'id' => (string) ($row['id'] ?? ''),
        'firebase_id' => $row['firebase_id'] ?? null,
        'createdAt' => $row['created_at'] ?? ($payload['createdAt'] ?? null),
        'updatedAt' => $row['updated_at'] ?? ($payload['updatedAt'] ?? null),
    ]);
}

function normalizePublicUserRow(array $row): array
{
    $payload = [];
    if (!empty($row['data_json'])) {
        $decoded = json_decode((string) $row['data_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    return [
        'id' => (string) ($row['id'] ?? ''),
        'uid' => (string) ($row['firebase_id'] ?? ''),
        'firebase_id' => $row['firebase_id'] ?? null,
        'name' => (string) ($payload['name'] ?? ''),
        'email' => (string) ($payload['email'] ?? ''),
        'phone' => (string) ($payload['phone'] ?? ''),
        'photoURL' => (string) ($payload['photoURL'] ?? ''),
        'address' => is_array($payload['address'] ?? null) ? $payload['address'] : [],
        'blocked' => !empty($payload['blocked']),
        'lastLoginAt' => $payload['lastLoginAt'] ?? null,
        'createdAt' => $row['created_at'] ?? ($payload['createdAt'] ?? null),
        'updatedAt' => $row['updated_at'] ?? ($payload['updatedAt'] ?? null),
    ];
}

/**
 * @param list<string> $orderIds
 * @return array<string, array<string, mixed>>
 */
function loadOrderInitiationPayloadsByOrderIds(PDO $pdo, array $orderIds): array
{
    $orderIds = array_values(array_unique(array_filter(array_map('strval', $orderIds))));
    if (count($orderIds) === 0) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
    $stmt = $pdo->prepare(
        "SELECT razorpay_order_id, payload_json FROM order_initiations WHERE razorpay_order_id IN ($placeholders)"
    );
    $stmt->execute($orderIds);
    $out = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $oid = trim((string) ($row['razorpay_order_id'] ?? ''));
        if ($oid === '') {
            continue;
        }
        $decoded = json_decode((string) ($row['payload_json'] ?? '{}'), true);
        if (is_array($decoded)) {
            $out[$oid] = $decoded;
        }
    }

    return $out;
}

/**
 * @param list<string> $orderIds
 * @return array<string, array<string, mixed>>
 */
function loadRazorpaySnapshotPayloadsByOrderIds(PDO $pdo, array $orderIds): array
{
    $orderIds = array_values(array_unique(array_filter(array_map('strval', $orderIds))));
    if (count($orderIds) === 0) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
    $stmt = $pdo->prepare(
        "SELECT razorpay_order_id, payload_json FROM razorpay_order_snapshots WHERE razorpay_order_id IN ($placeholders)"
    );
    $stmt->execute($orderIds);
    $out = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $oid = trim((string) ($row['razorpay_order_id'] ?? ''));
        if ($oid === '') {
            continue;
        }
        $decoded = json_decode((string) ($row['payload_json'] ?? '{}'), true);
        if (is_array($decoded)) {
            $out[$oid] = $decoded;
        }
    }

    return $out;
}

function normalizePaymentRow(array $row): array
{
    return PaymentOrderHelper::normalizePaymentView($row);
}

function normalizeRazorpayWebhookRow(array $row): array
{
    $payload = [];
    if (!empty($row['payload_json'])) {
        $decoded = json_decode((string) $row['payload_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    return [
        'id' => (string) ($row['id'] ?? ''),
        'event_type' => (string) ($row['event_type'] ?? ''),
        'entity_id' => (string) ($row['entity_id'] ?? ''),
        'signature' => (string) ($row['signature'] ?? ''),
        'signature_valid' => isset($row['signature_valid']) ? ((int) $row['signature_valid'] === 1) : false,
        'payload_json' => $payload,
        'createdAt' => $row['created_at'] ?? null,
    ];
}

function normalizeOrderInitiationRow(array $row): array
{
    $payload = [];
    if (!empty($row['payload_json'])) {
        $decoded = json_decode((string) $row['payload_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    return [
        'id' => (string) ($row['id'] ?? ''),
        'razorpay_order_id' => (string) ($row['razorpay_order_id'] ?? ''),
        'order_ref' => (string) ($row['order_ref'] ?? ''),
        'amount' => isset($row['amount']) ? (float) $row['amount'] : (float) ($payload['amount'] ?? 0),
        'payload_json' => $payload,
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function normalizeRazorpayOrderSnapshotRow(array $row): array
{
    $payload = [];
    if (!empty($row['payload_json'])) {
        $decoded = json_decode((string) $row['payload_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    return [
        'id' => (string) ($row['id'] ?? ''),
        'razorpay_order_id' => (string) ($row['razorpay_order_id'] ?? ''),
        'payload_json' => $payload,
        'createdAt' => $row['fetched_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function isCustomerLoginRow(array $row): bool
{
    return isset($row['auth_provider']) && !isset($row['admin_id']);
}

function customerLoginUid(array $row): string
{
    $googleSub = trim((string) ($row['google_sub'] ?? ''));
    if ($googleSub !== '') {
        return $googleSub;
    }

    return 'customer_' . (string) ($row['id'] ?? '');
}

function customerLoginToNormalizedUser(array $row): array
{
    $book = CustomerAddressHelper::decodeBook($row['address_json'] ?? null);
    $address = CustomerAddressHelper::getSelectedAddress($book);

    return [
        'id' => (string) ($row['id'] ?? ''),
        'uid' => customerLoginUid($row),
        'email' => (string) ($row['email'] ?? ''),
        'clientId' => '',
        'displayName' => (string) ($row['name'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'photoURL' => (string) ($row['photo_url'] ?? ''),
        'phone' => (string) ($row['phone'] ?? ''),
        'address' => $address,
        'addresses' => $book['addresses'],
        'selectedAddressId' => $book['selectedId'],
        'isAnonymous' => false,
        'isAdmin' => false,
        'authProvider' => (string) ($row['auth_provider'] ?? ''),
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function normalizeAuthUser(array $row): array
{
    if (isCustomerLoginRow($row)) {
        return customerLoginToNormalizedUser($row);
    }

    $payload = [];
    if (!empty($row['data_json'])) {
        $decoded = json_decode((string) $row['data_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }
    $address = is_array($payload['address'] ?? null) ? $payload['address'] : [];

    $firebaseId = (string) ($row['firebase_id'] ?? ('user_' . ($row['id'] ?? '')));

    return [
        'id' => (string) ($row['id'] ?? ''),
        'uid' => $firebaseId,
        'email' => (string) ($payload['email'] ?? ''),
        'clientId' => (string) ($payload['client_id'] ?? ''),
        'displayName' => (string) ($payload['name'] ?? ''),
        'name' => (string) ($payload['name'] ?? ''),
        'photoURL' => (string) ($payload['photoURL'] ?? ''),
        'phone' => (string) ($payload['phone'] ?? ''),
        'address' => $address,
        'isAnonymous' => false,
        'isAdmin' => str_starts_with($firebaseId, 'admin_'),
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function authSanitizeEmail(string $email): string
{
    return strtolower(trim($email));
}

function authSanitizeClientId(string $clientId): string
{
    $clean = strtolower(trim($clientId));
    $clean = preg_replace('/[^a-z0-9_.@-]/', '', $clean) ?? '';
    return $clean;
}

function ensureCustomersLoginTable(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS customers_login (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            email VARCHAR(191) NOT NULL,
            password_hash VARCHAR(255) NULL,
            name VARCHAR(191) NOT NULL DEFAULT "",
            phone VARCHAR(32) NOT NULL DEFAULT "",
            photo_url VARCHAR(512) NOT NULL DEFAULT "",
            address_json LONGTEXT NULL,
            google_sub VARCHAR(128) NULL,
            auth_provider VARCHAR(32) NOT NULL DEFAULT "password",
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            last_login_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_customers_login_email (email),
            UNIQUE KEY uq_customers_login_google_sub (google_sub),
            KEY idx_customers_login_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function authFindCustomerById(PDO $pdo, int $id): ?array
{
    ensureCustomersLoginTable($pdo);
    if ($id <= 0) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT * FROM customers_login WHERE id = :id AND is_active = 1 LIMIT 1');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function authFindCustomerByEmail(PDO $pdo, string $email): ?array
{
    ensureCustomersLoginTable($pdo);
    $stmt = $pdo->prepare('SELECT * FROM customers_login WHERE LOWER(email) = :email LIMIT 1');
    $stmt->execute(['email' => authSanitizeEmail($email)]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function ensureAdminLoginTable(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admin_login (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            admin_id VARCHAR(100) NOT NULL,
            email VARCHAR(191) NOT NULL,
            name VARCHAR(191) NOT NULL DEFAULT "",
            password_hash VARCHAR(255) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_admin_login_admin_id (admin_id),
            UNIQUE KEY uq_admin_login_email (email),
            KEY idx_admin_login_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function normalizeAdminLoginToAuthRow(array $row): array
{
    $email = authSanitizeEmail((string) ($row['email'] ?? ''));
    $adminId = authSanitizeClientId((string) ($row['admin_id'] ?? ''));
    $name = trim((string) ($row['name'] ?? ''));
    $payload = [
        'email' => $email,
        'client_id' => $adminId,
        'name' => $name,
        'photoURL' => '',
        'phone' => '',
        'isAnonymous' => false,
        'auth_provider' => 'admin_login',
    ];
    return [
        'id' => (string) ($row['id'] ?? ''),
        'firebase_id' => 'admin_' . (string) ($row['id'] ?? ''),
        'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function authFindAdminLoginByIdentifier(PDO $pdo, string $identifier): ?array
{
    ensureAdminLoginTable($pdo);
    $normalized = trim($identifier);
    if ($normalized === '') {
        return null;
    }
    $stmt = $pdo->prepare(
        'SELECT * FROM admin_login
         WHERE is_active = 1
           AND (LOWER(email) = :email OR LOWER(admin_id) = :admin_id)
         LIMIT 1'
    );
    $stmt->execute([
        'email' => authSanitizeEmail($normalized),
        'admin_id' => authSanitizeClientId($normalized),
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function authCurrentUser(PDO $pdo): ?array
{
    $adminLoginId = (int) ($_SESSION['auth_admin_login_id'] ?? 0);
    if ($adminLoginId > 0) {
        ensureAdminLoginTable($pdo);
        $stmt = $pdo->prepare('SELECT * FROM admin_login WHERE id = :id AND is_active = 1 LIMIT 1');
        $stmt->execute(['id' => $adminLoginId]);
        $adminRow = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($adminRow) {
            return normalizeAdminLoginToAuthRow($adminRow);
        }
    }

    $customerId = authGetCustomerSessionId();
    if ($customerId <= 0) {
        return null;
    }

    return authFindCustomerById($pdo, $customerId);
}

function ensureAdminMenusTable(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admin_menus (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            menu_key VARCHAR(100) NOT NULL,
            label VARCHAR(120) NOT NULL,
            path VARCHAR(255) NOT NULL,
            icon VARCHAR(80) NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_admin_menu_key (menu_key),
            KEY idx_admin_menu_active_order (active, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function seedDefaultAdminMenus(PDO $pdo): void
{
    $count = (int) ($pdo->query('SELECT COUNT(*) AS cnt FROM admin_menus')->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);
    if ($count > 0) {
        return;
    }
    $defaults = [
        ['dashboard', 'Dashboard', '/admin/panel/dashboard', 'LayoutDashboard', 10],
        ['enquiry', 'Enquiry', '/admin/panel/enquiry', 'MessageSquare', 20],
        ['products', 'Manage Products', '/admin/panel/products', 'Package', 30],
        ['users', 'User Management', '/admin/panel/users', 'Users', 40],
        ['blogs', 'Manage Blogs', '/admin/panel/blogs', 'FileText', 50],
        ['orders', 'View Orders', '/admin/panel/orders', 'ShoppingCart', 60],
        ['visit_statistics', 'Visit Statistics', '/admin/panel/visit-statistics', 'BarChart3', 70],
    ];
    $stmt = $pdo->prepare('INSERT INTO admin_menus (menu_key, label, path, icon, sort_order, active) VALUES (:menu_key, :label, :path, :icon, :sort_order, 1)');
    foreach ($defaults as $menu) {
        $stmt->execute([
            'menu_key' => $menu[0],
            'label' => $menu[1],
            'path' => $menu[2],
            'icon' => $menu[3],
            'sort_order' => $menu[4],
        ]);
    }
}

function reviewsTableExists(PDO $pdo): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
    );
    $stmt->execute(['reviews']);
    return (int) $stmt->fetchColumn() > 0;
}

function reviewsColumnExists(PDO $pdo, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $stmt->execute(['reviews', $column]);
    return (int) $stmt->fetchColumn() > 0;
}

function normalizeReviewRow(array $row, ?string $displayProductId = null): array
{
    return [
        'id' => (string) ($row['id'] ?? ''),
        'productId' => $displayProductId ?? (string) ($row['product_id'] ?? ''),
        'rating' => (int) ($row['rating'] ?? 0),
        'message' => (string) ($row['message'] ?? ''),
        'authorName' => trim((string) ($row['author_display'] ?? '')),
        'profilePhoto' => (string) ($row['profile_photo'] ?? ''),
        'userId' => isset($row['user_id']) && $row['user_id'] !== null && $row['user_id'] !== ''
            ? (string) $row['user_id']
            : '',
        'createdAt' => $row['created_at'] ?? null,
    ];
}

/**
 * Route param is usually sku/slug (e.g. franch-oil-nh-plus); legacy reviews often used Firestore product doc id.
 * Resolve all matching identifiers from products so both formats match.
 *
 * @return list<string>
 */
function reviewFranchOilSharedSkus(): array
{
    return ['franch-oil-nh-plus', 'landing-franch-oil-nh-plus-pack-of-2'];
}

function reviewResolveProductIds(PDO $pdo, string $productId): array
{
    $productId = trim($productId);
    if ($productId === '') {
        return [];
    }

    $keys = [$productId];
    $pidLower = strtolower($productId);
    if (in_array($pidLower, reviewFranchOilSharedSkus(), true)) {
        $keys = array_merge($keys, reviewFranchOilSharedSkus());
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT firebase_id, sku, slug FROM products
             WHERE firebase_id = :p OR sku = :p OR slug = :p OR CAST(id AS CHAR) = :p
             LIMIT 10'
        );
        $stmt->execute(['p' => $productId]);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!is_array($row)) {
                break;
            }
            foreach (['firebase_id', 'sku', 'slug'] as $col) {
                $v = trim((string) ($row[$col] ?? ''));
                if ($v !== '') {
                    $keys[] = $v;
                }
            }
        }
    } catch (\Throwable $e) {
        // Fall back to exact productId only
    }

    return array_values(array_unique(array_filter($keys)));
}

/**
 * Preferred product_id for new reviews: store sku when known so URLs and DB stay aligned.
 */
function reviewCanonicalProductIdForWrite(PDO $pdo, string $productId): string
{
    $productId = trim($productId);
    if ($productId === '') {
        return '';
    }

    if (strtolower($productId) === 'landing-franch-oil-nh-plus-pack-of-2') {
        $productId = 'franch-oil-nh-plus';
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT sku, slug, firebase_id FROM products
             WHERE firebase_id = :p OR sku = :p OR slug = :p OR CAST(id AS CHAR) = :p
             LIMIT 1'
        );
        $stmt->execute(['p' => $productId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (is_array($row)) {
            $sku = trim((string) ($row['sku'] ?? ''));
            if ($sku !== '') {
                return $sku;
            }
            $slug = trim((string) ($row['slug'] ?? ''));
            if ($slug !== '') {
                return $slug;
            }
        }
    } catch (\Throwable $e) {
    }

    return $productId;
}

/**
 * Creates `reviews` or migrates legacy rows (firebase_id + data_json) to normalized columns (no Firebase fields stored).
 */
function ensureReviewsSchema(PDO $pdo): void
{
    if (!reviewsTableExists($pdo)) {
        $pdo->exec(
            'CREATE TABLE reviews (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                product_id VARCHAR(191) NOT NULL,
                rating TINYINT UNSIGNED NOT NULL,
                message TEXT NULL,
                user_id INT UNSIGNED NULL,
                author_display VARCHAR(255) NULL,
                profile_photo VARCHAR(512) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_reviews_product_created (product_id, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );

        return;
    }

    if (!reviewsColumnExists($pdo, 'data_json')) {
        if (!reviewsColumnExists($pdo, 'product_id')) {
            throw new \RuntimeException('reviews table has unexpected schema (missing product_id)');
        }

        return;
    }

    if (!reviewsColumnExists($pdo, 'product_id')) {
        $pdo->exec('ALTER TABLE reviews ADD COLUMN product_id VARCHAR(191) NULL AFTER id');
    }
    if (!reviewsColumnExists($pdo, 'rating')) {
        $pdo->exec('ALTER TABLE reviews ADD COLUMN rating TINYINT UNSIGNED NULL');
    }
    if (!reviewsColumnExists($pdo, 'message')) {
        $pdo->exec('ALTER TABLE reviews ADD COLUMN message TEXT NULL');
    }
    if (!reviewsColumnExists($pdo, 'user_id')) {
        $pdo->exec('ALTER TABLE reviews ADD COLUMN user_id INT UNSIGNED NULL');
    }
    if (!reviewsColumnExists($pdo, 'author_display')) {
        $pdo->exec('ALTER TABLE reviews ADD COLUMN author_display VARCHAR(255) NULL');
    }
    if (!reviewsColumnExists($pdo, 'profile_photo')) {
        $pdo->exec('ALTER TABLE reviews ADD COLUMN profile_photo VARCHAR(512) NULL');
    }

    $pdo->exec(
        'UPDATE reviews SET
            product_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(data_json, \'$.productId\')), \'\'),
            rating = CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(data_json, \'$.rating\')), \'\') AS UNSIGNED),
            message = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(data_json, \'$.message\')), \'\'),
            profile_photo = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(data_json, \'$.profilePhoto\')), \'\')
        WHERE data_json IS NOT NULL AND JSON_VALID(data_json)
          AND JSON_EXTRACT(data_json, \'$.productId\') IS NOT NULL'
    );

    $pdo->exec(
        'DELETE FROM reviews WHERE product_id IS NULL OR TRIM(product_id) = \'\' OR rating IS NULL OR rating < 1 OR rating > 5'
    );

    $pdo->exec('ALTER TABLE reviews DROP COLUMN data_json');
    if (reviewsColumnExists($pdo, 'firebase_id')) {
        $pdo->exec('ALTER TABLE reviews DROP COLUMN firebase_id');
    }

    $pdo->exec('ALTER TABLE reviews MODIFY COLUMN product_id VARCHAR(191) NOT NULL');
    $pdo->exec('ALTER TABLE reviews MODIFY COLUMN rating TINYINT UNSIGNED NOT NULL');
}

function authDecodePayload(array $row): array
{
    $payload = json_decode((string) ($row['data_json'] ?? '{}'), true);
    return is_array($payload) ? $payload : [];
}

function authUpsertCustomerByEmail(PDO $pdo, string $email, array $patch, ?string $googleSub = null): array
{
    ensureCustomersLoginTable($pdo);
    $email = authSanitizeEmail($email);
    $row = authFindCustomerByEmail($pdo, $email);

    $name = trim((string) ($patch['name'] ?? ($row['name'] ?? '')));
    $phone = trim((string) ($patch['phone'] ?? ($row['phone'] ?? '')));
    $photoUrl = trim((string) ($patch['photoURL'] ?? $patch['photo_url'] ?? ($row['photo_url'] ?? '')));
    $provider = trim((string) ($patch['auth_provider'] ?? ($row['auth_provider'] ?? 'password')));
    $passwordHash = $patch['password_hash'] ?? ($row['password_hash'] ?? null);
    $sub = $googleSub !== null ? trim($googleSub) : trim((string) ($row['google_sub'] ?? ''));
    if ($sub === '') {
        $sub = null;
    }

    if ($row) {
        $stmt = $pdo->prepare(
            'UPDATE customers_login SET
                name = :name,
                phone = :phone,
                photo_url = :photo_url,
                google_sub = COALESCE(:google_sub, google_sub),
                auth_provider = :auth_provider,
                password_hash = COALESCE(:password_hash, password_hash),
                last_login_at = NOW(),
                updated_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([
            'name' => $name,
            'phone' => $phone,
            'photo_url' => $photoUrl,
            'google_sub' => $sub,
            'auth_provider' => $provider !== '' ? $provider : 'password',
            'password_hash' => $passwordHash,
            'id' => (int) $row['id'],
        ]);

        return authFindCustomerById($pdo, (int) $row['id']) ?: $row;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO customers_login (
            email, password_hash, name, phone, photo_url, google_sub, auth_provider, last_login_at, created_at, updated_at
        ) VALUES (
            :email, :password_hash, :name, :phone, :photo_url, :google_sub, :auth_provider, NOW(), NOW(), NOW()
        )'
    );
    $stmt->execute([
        'email' => $email,
        'password_hash' => $passwordHash,
        'name' => $name,
        'phone' => $phone,
        'photo_url' => $photoUrl,
        'google_sub' => $sub,
        'auth_provider' => $provider !== '' ? $provider : 'password',
    ]);

    $id = (int) $pdo->lastInsertId();

    return authFindCustomerById($pdo, $id) ?: [];
}

if ($method === 'POST' && $path === '/api/auth/register') {
    $email = authSanitizeEmail((string) ($input['email'] ?? ''));
    $password = (string) ($input['password'] ?? '');
    $name = trim((string) ($input['name'] ?? ''));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Http::json(['success' => false, 'error' => 'Valid email is required'], 400);
    }
    if (strlen($password) < 6) {
        Http::json(['success' => false, 'error' => 'Password must be at least 6 characters'], 400);
    }

    $existing = authFindCustomerByEmail($pdo, $email);
    if ($existing && !empty($existing['password_hash'])) {
        Http::json(['success' => false, 'error' => 'Email already exists'], 409);
    }

    $saved = authUpsertCustomerByEmail($pdo, $email, [
        'name' => $name,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'auth_provider' => 'password',
    ]);

    authSetCustomerSessionId((int) ($saved['id'] ?? 0));
    unset($_SESSION['auth_admin_login_id']);
    Http::json(['success' => true, 'user' => normalizeAuthUser($saved)]);
}

if ($method === 'POST' && $path === '/api/auth/login') {
    $identifier = trim((string) ($input['identifier'] ?? $input['loginId'] ?? $input['email'] ?? ''));
    $password = (string) ($input['password'] ?? '');

    if ($identifier === '' || $password === '') {
        Http::json(['success' => false, 'error' => 'Client ID/email and password are required'], 400);
    }

    $adminRow = authFindAdminLoginByIdentifier($pdo, $identifier);
    if ($adminRow) {
        $adminHash = (string) ($adminRow['password_hash'] ?? '');
        $adminLoginOk = false;
        if ($adminHash !== '' && password_verify($password, $adminHash)) {
            $adminLoginOk = true;
        } elseif ($adminHash !== '' && hash_equals($adminHash, $password)) {
            // Backward-compatible migration: plain-text DB value -> bcrypt hash.
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $migrateStmt = $pdo->prepare('UPDATE admin_login SET password_hash = :password_hash, updated_at = NOW() WHERE id = :id');
            $migrateStmt->execute([
                'password_hash' => $newHash,
                'id' => (int) $adminRow['id'],
            ]);
            $adminLoginOk = true;
        }

        if ($adminLoginOk) {
            $_SESSION['auth_admin_login_id'] = (int) $adminRow['id'];
            unset($_SESSION['auth_customer_id'], $_SESSION['auth_user_id']);
            Http::json(['success' => true, 'user' => normalizeAuthUser(normalizeAdminLoginToAuthRow($adminRow))]);
        }
        Http::json(['success' => false, 'error' => 'Invalid credentials'], 401);
    }

    if (!filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
        Http::json(['success' => false, 'error' => 'Use your email address to sign in'], 400);
    }

    $row = authFindCustomerByEmail($pdo, $identifier);
    if (!$row || (int) ($row['is_active'] ?? 0) !== 1) {
        Http::json(['success' => false, 'error' => 'Invalid credentials'], 401);
    }

    $hash = (string) ($row['password_hash'] ?? '');
    if ($hash === '') {
        Http::json([
            'success' => false,
            'error' => 'This account uses Google sign-in, or set a password via Sign Up with the same email.',
            'code' => 'PASSWORD_NOT_SET',
        ], 401);
    }
    if (!password_verify($password, $hash)) {
        Http::json(['success' => false, 'error' => 'Invalid credentials'], 401);
    }

    $touch = $pdo->prepare('UPDATE customers_login SET last_login_at = NOW(), updated_at = NOW() WHERE id = :id');
    $touch->execute(['id' => (int) $row['id']]);

    authSetCustomerSessionId((int) $row['id']);
    unset($_SESSION['auth_admin_login_id']);
    Http::json(['success' => true, 'user' => normalizeAuthUser($row)]);
}

if ($method === 'POST' && $path === '/api/auth/logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
    }
    session_destroy();
    Http::json(['success' => true]);
}

if ($method === 'GET' && $path === '/api/auth/me') {
    $row = authCurrentUser($pdo);
    if (!$row) {
        Http::json(['success' => true, 'user' => null]);
    }
    Http::json(['success' => true, 'user' => normalizeAuthUser($row)]);
}

if ($method === 'PUT' && $path === '/api/auth/me') {
    if ((int) ($_SESSION['auth_admin_login_id'] ?? 0) > 0) {
        Http::json(['success' => false, 'error' => 'Profile update is disabled for admin_login accounts'], 403);
    }

    $row = authCurrentUser($pdo);
    if (!$row || !isCustomerLoginRow($row)) {
        Http::json(['success' => false, 'error' => 'Unauthorized'], 401);
    }

    $name = trim((string) ($input['name'] ?? ($row['name'] ?? '')));
    $phone = preg_replace('/\D/', '', trim((string) ($input['phone'] ?? ($row['phone'] ?? ''))));
    $photoUrl = trim((string) ($input['photoURL'] ?? ($row['photo_url'] ?? '')));
    $emailInput = authSanitizeEmail((string) ($input['email'] ?? ''));
    $email = $emailInput !== '' ? $emailInput : authSanitizeEmail((string) ($row['email'] ?? ''));

    $existingBook = CustomerAddressHelper::decodeBook($row['address_json'] ?? null);
    $mergedBook = CustomerAddressHelper::mergeProfileAddressInput($input, $existingBook);
    $addressJson = CustomerAddressHelper::encodeBook($mergedBook);

    $stmt = $pdo->prepare(
        'UPDATE customers_login SET name = :name, phone = :phone, email = :email, photo_url = :photo_url, address_json = :address_json, updated_at = NOW() WHERE id = :id'
    );
    $stmt->execute([
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'photo_url' => $photoUrl,
        'address_json' => $addressJson,
        'id' => (int) $row['id'],
    ]);

    $updated = authFindCustomerById($pdo, (int) $row['id']);
    Http::json(['success' => true, 'user' => normalizeAuthUser($updated ?: [])]);
}

if ($method === 'GET' && $path === '/api/customer/cart') {
    $customerId = authRequireCustomerId();
    $items = CustomerDataRepository::listCart($pdo, $customerId);
    Http::json(['success' => true, 'items' => $items]);
}

if ($method === 'PUT' && $path === '/api/customer/cart') {
    $customerId = authRequireCustomerId();
    $items = is_array($input['items'] ?? null) ? $input['items'] : [];
    $saved = CustomerDataRepository::replaceCart($pdo, $customerId, $items);
    Http::json(['success' => true, 'items' => $saved]);
}

if ($method === 'POST' && $path === '/api/customer/cart') {
    $customerId = authRequireCustomerId();
    $saved = CustomerDataRepository::upsertCartItem($pdo, $customerId, $input);
    Http::json(['success' => true, 'items' => $saved]);
}

if ($method === 'DELETE' && $path === '/api/customer/cart') {
    $customerId = authRequireCustomerId();
    $productId = trim((string) ($_GET['productId'] ?? $input['productId'] ?? ''));
    $lineId = (int) ($_GET['lineId'] ?? $input['lineId'] ?? 0);
    $saved = CustomerDataRepository::deleteCartItem(
        $pdo,
        $customerId,
        $productId,
        $lineId > 0 ? $lineId : null
    );
    Http::json(['success' => true, 'items' => $saved]);
}

if ($method === 'GET' && $path === '/api/customer/favorites') {
    $customerId = authRequireCustomerId();
    $items = CustomerDataRepository::listFavorites($pdo, $customerId);
    Http::json(['success' => true, 'items' => $items]);
}

if ($method === 'POST' && $path === '/api/customer/favorites') {
    $customerId = authRequireCustomerId();
    $saved = CustomerDataRepository::addFavorite($pdo, $customerId, $input);
    Http::json(['success' => true, 'items' => $saved]);
}

if ($method === 'DELETE' && $path === '/api/customer/favorites') {
    $customerId = authRequireCustomerId();
    $productId = trim((string) ($_GET['productId'] ?? $input['productId'] ?? ''));
    $lineId = (int) ($_GET['lineId'] ?? $input['lineId'] ?? 0);
    $saved = CustomerDataRepository::removeFavorite(
        $pdo,
        $customerId,
        $productId,
        $lineId > 0 ? $lineId : null
    );
    Http::json(['success' => true, 'items' => $saved]);
}

if ($method === 'POST' && $path === '/api/auth/reset-password') {
    // Placeholder endpoint to preserve current UX.
    // Real email reset can be added later with SMTP token flow.
    Http::json(['success' => true, 'message' => 'If the email exists, reset instructions were sent.']);
}

if ($method === 'POST' && $path === '/api/auth/google') {
    $credential = trim((string) ($input['credential'] ?? ''));
    if ($credential === '') {
        Http::json(['success' => false, 'error' => 'Google credential is required'], 400);
    }

    $tokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($credential);
    $tokenResp = httpJsonRequest($tokenInfoUrl, ['method' => 'GET', 'headers' => ['Accept: application/json']]);
    if (!$tokenResp['ok'] || !is_array($tokenResp['json'])) {
        Http::json(['success' => false, 'error' => 'Google token verification failed'], 401);
    }

    $token = $tokenResp['json'];
    $aud = (string) ($token['aud'] ?? '');
    $email = authSanitizeEmail((string) ($token['email'] ?? ''));
    $emailVerified = (string) ($token['email_verified'] ?? '') === 'true';
    $expectedAud = (string) Config::get('GOOGLE_CLIENT_ID', '');
    if ($expectedAud !== '' && $aud !== $expectedAud) {
        Http::json(['success' => false, 'error' => 'Google audience mismatch'], 401);
    }
    if ($email === '' || !$emailVerified) {
        Http::json(['success' => false, 'error' => 'Google email is not verified'], 401);
    }

    $googleSub = (string) ($token['sub'] ?? '');
    $saved = authUpsertCustomerByEmail($pdo, $email, [
        'name' => (string) ($token['name'] ?? ''),
        'photoURL' => (string) ($token['picture'] ?? ''),
        'auth_provider' => 'google',
    ], $googleSub);

    authSetCustomerSessionId((int) ($saved['id'] ?? 0));
    unset($_SESSION['auth_admin_login_id']);
    Http::json(['success' => true, 'user' => normalizeAuthUser($saved)]);
}

if ($method === 'GET' && $path === '/api/admin/menus') {
    ensureAdminMenusTable($pdo);
    seedDefaultAdminMenus($pdo);
    $stmt = $pdo->query('SELECT id, menu_key, label, path, icon, sort_order, active FROM admin_menus WHERE active = 1 ORDER BY sort_order ASC, id ASC');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $menus = array_map(static function (array $row): array {
        return [
            'id' => (string) ($row['id'] ?? ''),
            'key' => (string) ($row['menu_key'] ?? ''),
            'label' => (string) ($row['label'] ?? ''),
            'path' => (string) ($row['path'] ?? ''),
            'icon' => (string) ($row['icon'] ?? ''),
            'sortOrder' => (int) ($row['sort_order'] ?? 0),
            'active' => (int) ($row['active'] ?? 0) === 1,
        ];
    }, $rows);
    Http::json(['success' => true, 'menus' => $menus]);
}

if (preg_match('#^/api/pincode/(\d{6})$#', $path, $pincodeMatch) && $method === 'GET') {
    $pin = $pincodeMatch[1];
    $apiUrl = 'https://api.postalpincode.in/pincode/' . $pin;
    $resp = httpJsonRequest($apiUrl, [
        'method' => 'GET',
        'headers' => ['Accept: application/json'],
        // Public India Post mirror; some Windows PHP builds lack CA bundle for this host.
        'ssl_verify' => false,
    ]);

    if (!$resp['ok'] || !is_array($resp['json'])) {
        Http::json(['success' => false, 'error' => 'Pincode lookup failed'], 502);
    }

    $block = $resp['json'][0] ?? null;
    if (!is_array($block) || ($block['Status'] ?? '') !== 'Success') {
        Http::json(['success' => false, 'error' => 'Invalid or unknown pincode'], 404);
    }

    $offices = $block['PostOffice'] ?? [];
    if (!is_array($offices) || count($offices) === 0) {
        Http::json(['success' => false, 'error' => 'No location found for this pincode'], 404);
    }

    $first = $offices[0];
    $district = trim((string) ($first['District'] ?? ''));
    $state = trim((string) ($first['State'] ?? ''));
    $city = $district !== '' ? $district : trim((string) ($first['Region'] ?? $first['Division'] ?? ''));

    Http::json([
        'success' => true,
        'pincode' => $pin,
        'city' => $city,
        'state' => $state,
        'district' => $district,
        'postOffices' => count($offices),
    ]);
}

if ($method === 'GET' && $path === '/api/products') {
    try {
        ensureProductsDiscountSchema($pdo);
    } catch (\Throwable $e) {
        error_log('ensureProductsDiscountSchema: ' . $e->getMessage());
    }

    $onlyActive = isset($_GET['onlyActive']) ? filter_var((string) $_GET['onlyActive'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;
    $category = isset($_GET['category']) ? trim((string) $_GET['category']) : '';
    $search = isset($_GET['search']) ? trim((string) $_GET['search']) : '';
    $dir = strtolower((string) ($_GET['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';
    $sort = (string) ($_GET['sort'] ?? 'createdAt');
    $limit = max(1, min(500, (int) ($_GET['pageSize'] ?? 100)));

    $sortMap = [
        'createdAt' => 'created_at',
        'updatedAt' => 'updated_at',
        'price' => 'price',
        'title' => 'title',
        'stock' => 'stock',
        'category' => 'category',
    ];
    $sortColumn = $sortMap[$sort] ?? 'created_at';

    $where = [];
    $params = [];

    if ($onlyActive === true) {
        $where[] = 'active = 1';
    } elseif ($onlyActive === false) {
        $where[] = 'active IN (0,1)';
    }

    if ($category !== '') {
        $where[] = 'category = :category';
        $params['category'] = $category;
    }
    if ($search !== '') {
        $where[] = '(title LIKE :search OR description LIKE :search OR sku LIKE :search)';
        $params['search'] = '%' . $search . '%';
    }

    $sql = 'SELECT * FROM products';
    if (count($where) > 0) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortColumn} {$dir} LIMIT {$limit}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $products = array_map('normalizeProductRow', $rows);

    Http::json(['success' => true, 'products' => $products]);
}

if ($method === 'GET' && $path === '/api/reviews') {
    try {
        ensureReviewsSchema($pdo);
    } catch (\Throwable $e) {
        error_log('ensureReviewsSchema: ' . $e->getMessage());
        Http::json(['success' => false, 'error' => 'Reviews database setup failed'], 500);
    }

    $productId = trim((string) ($_GET['productId'] ?? ''));
    if ($productId === '') {
        Http::json(['success' => false, 'error' => 'productId is required'], 400);
    }

    $matchIds = reviewResolveProductIds($pdo, $productId);
    if (count($matchIds) === 0) {
        Http::json(['success' => true, 'reviews' => []]);
    }

    $placeholders = implode(',', array_fill(0, count($matchIds), '?'));
    $sql =
        'SELECT id, product_id, rating, message, user_id, author_display, profile_photo, created_at, updated_at
         FROM reviews WHERE product_id IN (' . $placeholders . ') ORDER BY created_at DESC LIMIT 200';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($matchIds));
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $displayPid = reviewCanonicalProductIdForWrite($pdo, $productId) ?: $productId;
    $reviews = array_map(static function (array $r) use ($displayPid): array {
        return normalizeReviewRow($r, $displayPid);
    }, $rows);

    Http::json(['success' => true, 'reviews' => $reviews]);
}

if ($method === 'POST' && $path === '/api/reviews') {
    try {
        ensureReviewsSchema($pdo);
    } catch (\Throwable $e) {
        error_log('ensureReviewsSchema: ' . $e->getMessage());
        Http::json(['success' => false, 'error' => 'Reviews database setup failed'], 500);
    }

    $productId = trim((string) ($input['productId'] ?? ''));
    $rating = (int) ($input['rating'] ?? 0);
    $message = trim((string) ($input['message'] ?? ''));
    $authorNameInput = trim((string) ($input['authorName'] ?? ($input['name'] ?? '')));

    if ($productId === '' || strlen($productId) > 191) {
        Http::json(['success' => false, 'error' => 'Invalid productId'], 400);
    }
    if ($rating < 1 || $rating > 5) {
        Http::json(['success' => false, 'error' => 'Rating must be between 1 and 5'], 400);
    }
    $msgLen = function_exists('mb_strlen') ? mb_strlen($message, 'UTF-8') : strlen($message);
    if ($msgLen > 5000) {
        Http::json(['success' => false, 'error' => 'Message is too long'], 400);
    }
    $nameLen = function_exists('mb_strlen') ? mb_strlen($authorNameInput, 'UTF-8') : strlen($authorNameInput);
    if ($nameLen > 80) {
        Http::json(['success' => false, 'error' => 'Name is too long'], 400);
    }

    $canonicalProductId = reviewCanonicalProductIdForWrite($pdo, $productId);
    if ($canonicalProductId === '') {
        Http::json(['success' => false, 'error' => 'Invalid productId'], 400);
    }

    $sessionRow = authCurrentUser($pdo);
    $uid = null;
    $authorDisplay = null;
    $profilePhoto = null;

    if (is_array($sessionRow)) {
        $u = normalizeAuthUser($sessionRow);
        $candidateUid = (int) ($u['id'] ?? 0);
        if ($candidateUid > 0) {
            $uid = $candidateUid;
            $authorDisplay = trim((string) ($u['displayName'] ?? ''));
            if ($authorDisplay === '') {
                $authorDisplay = trim((string) ($u['email'] ?? ''));
            }
            if ($authorDisplay === '') {
                $authorDisplay = null;
            }
            $profilePhoto = (string) ($u['photoURL'] ?? '') !== '' ? (string) $u['photoURL'] : null;
        }
    }

    if ($uid === null) {
        $authorDisplay = $authorNameInput !== '' ? $authorNameInput : 'Anonymous';
        $profilePhoto = null;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO reviews (product_id, rating, message, user_id, author_display, profile_photo, created_at, updated_at)
         VALUES (:product_id, :rating, :message, :user_id, :author_display, :profile_photo, NOW(), NOW())'
    );
    $stmt->execute([
        'product_id' => $canonicalProductId,
        'rating' => $rating,
        'message' => $message,
        'user_id' => $uid,
        'author_display' => $authorDisplay,
        'profile_photo' => $profilePhoto,
    ]);

    $id = (int) $pdo->lastInsertId();
    $sel = $pdo->prepare(
        'SELECT id, product_id, rating, message, user_id, author_display, profile_photo, created_at, updated_at FROM reviews WHERE id = :id LIMIT 1'
    );
    $sel->execute(['id' => $id]);
    $created = $sel->fetch(PDO::FETCH_ASSOC);

    Http::json([
        'success' => true,
        'review' => $created ? normalizeReviewRow($created, $canonicalProductId) : null,
    ]);
}

if ($method === 'GET' && $path === '/api/blogs') {
    $onlyActive = isset($_GET['onlyActive']) ? filter_var((string) $_GET['onlyActive'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;
    $category = isset($_GET['category']) ? trim((string) $_GET['category']) : '';
    $search = isset($_GET['search']) ? trim((string) $_GET['search']) : '';
    $limit = max(1, min(1000, (int) ($_GET['pageSize'] ?? 200)));

    $stmt = $pdo->prepare('SELECT id, firebase_id, data_json, created_at, updated_at FROM blogs ORDER BY created_at DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $blogs = array_map('normalizeBlogRow', $rows);

    if ($onlyActive === true) {
        $blogs = array_values(array_filter($blogs, fn($b) => !array_key_exists('active', $b) || $b['active'] !== false));
    }
    if ($category !== '') {
        $blogs = array_values(array_filter($blogs, fn($b) => (string) ($b['category'] ?? '') === $category));
    }
    if ($search !== '') {
        $s = strtolower($search);
        $blogs = array_values(array_filter($blogs, function ($b) use ($s) {
            $title = strtolower((string) ($b['title'] ?? ''));
            $slug = strtolower((string) ($b['slug'] ?? ''));
            $bodyText = strtolower(implode(' ', array_map(
                fn($blk) => isset($blk['type']) && $blk['type'] !== 'image' ? ((string) ($blk['content'] ?? '')) : '',
                is_array($b['body'] ?? null) ? $b['body'] : []
            )));
            return str_contains($title, $s) || str_contains($slug, $s) || str_contains($bodyText, $s);
        }));
    }

    Http::json(['success' => true, 'blogs' => $blogs]);
}

if ($method === 'GET' && $path === '/api/enquiries') {
    $limit = max(1, min(5000, (int) ($_GET['pageSize'] ?? 1000)));
    $stmt = $pdo->prepare('SELECT id, firebase_id, data_json, created_at, updated_at FROM enquiries ORDER BY created_at DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $enquiries = array_map('normalizeEnquiryRow', $rows);
    Http::json(['success' => true, 'enquiries' => $enquiries]);
}

if ($method === 'POST' && $path === '/api/enquiries') {
    $name = trim((string) ($input['name'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $phone = trim((string) ($input['phone'] ?? ''));
    $message = trim((string) ($input['message'] ?? ''));
    if ($name === '' || $email === '' || $phone === '' || $message === '') {
        Http::json(['success' => false, 'error' => 'All fields are required'], 400);
    }

    $firebaseId = 'local_' . bin2hex(random_bytes(8));
    $payload = [
        'firebase_id' => $firebaseId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'message' => $message,
        'createdAt' => date('c'),
    ];

    $stmt = $pdo->prepare('INSERT INTO enquiries (firebase_id, data_json, created_at, updated_at) VALUES (:firebase_id, :data_json, NOW(), NOW())');
    $stmt->execute([
        'firebase_id' => $firebaseId,
        'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);
    Http::json(['success' => true, 'id' => (string) $pdo->lastInsertId()]);
}

if ($method === 'GET' && $path === '/api/users') {
    $limit = max(1, min(5000, (int) ($_GET['pageSize'] ?? 2000)));
    $stmt = $pdo->prepare('SELECT id, firebase_id, data_json, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $users = array_map('normalizePublicUserRow', $rows);
    Http::json(['success' => true, 'users' => $users]);
}

$userIdForBlock = null;
if (preg_match('#^/api/users/(\d+)/block$#', $path, $m)) {
    $userIdForBlock = (int) $m[1];
}
if ($userIdForBlock !== null && in_array($method, ['PUT', 'PATCH'], true)) {
    $existingStmt = $pdo->prepare('SELECT firebase_id, data_json FROM users WHERE id = :id LIMIT 1');
    $existingStmt->execute(['id' => $userIdForBlock]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        Http::json(['success' => false, 'error' => 'User not found'], 404);
    }

    $payload = json_decode((string) ($existing['data_json'] ?? '{}'), true);
    if (!is_array($payload)) {
        $payload = [];
    }
    $blocked = !empty($input['blocked']);
    $payload['blocked'] = $blocked;
    $payload['updatedAt'] = date('c');

    $stmt = $pdo->prepare('UPDATE users SET data_json = :data_json, updated_at = NOW() WHERE id = :id');
    $stmt->execute([
        'id' => $userIdForBlock,
        'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);

    Http::json(['success' => true, 'blocked' => $blocked]);
}

if ($method === 'GET' && $path === '/api/orders/mine') {
    $customer = authCustomerSessionUser($pdo);
    if (!$customer) {
        Http::json(['success' => false, 'error' => 'Login required'], 401);
    }

    $limit = max(1, min(500, (int) ($_GET['pageSize'] ?? 200)));
    $cutoffSql = PaymentOrderHelper::trackingFeatureStartAtSql();
    $hasCutoff = $cutoffSql !== null;

    if ($hasCutoff) {
        $stmt = $pdo->prepare(
            'SELECT id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at, updated_at
             FROM payments WHERE is_valid = 1 AND created_at >= :cutoff ORDER BY created_at DESC LIMIT :limit'
        );
        $stmt->bindValue(':cutoff', $cutoffSql, PDO::PARAM_STR);
    } else {
        $stmt = $pdo->prepare(
            'SELECT id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at, updated_at
             FROM payments WHERE is_valid = 1 ORDER BY created_at DESC LIMIT :limit'
        );
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orders = [];
    foreach ($rows as $row) {
        $order = PaymentOrderHelper::normalizePaymentView($row);
        if (!PaymentOrderHelper::paymentMatchesCustomer($order, $customer)) {
            continue;
        }
        $orders[] = $order;
    }

    Http::json(['success' => true, 'orders' => $orders]);
}

$mineOrderId = null;
if (preg_match('#^/api/orders/mine/(\d+)$#', $path, $mineMatch) && $method === 'GET') {
    $mineOrderId = (int) $mineMatch[1];
}

if ($mineOrderId !== null) {
    $customer = authCustomerSessionUser($pdo);
    if (!$customer) {
        Http::json(['success' => false, 'error' => 'Login required'], 401);
    }

    $row = PaymentOrderHelper::fetchPaymentRowById($pdo, $mineOrderId);
    if (!$row || (int) ($row['is_valid'] ?? 0) !== 1) {
        Http::json(['success' => false, 'error' => 'Order not found'], 404);
    }

    $order = PaymentOrderHelper::normalizePaymentView($row);
    if (!PaymentOrderHelper::paymentMatchesCustomer($order, $customer)) {
        Http::json(['success' => false, 'error' => 'Order not found'], 404);
    }
    if (!($order['trackingEligible'] ?? true)) {
        Http::json(['success' => false, 'error' => 'Tracking is not available for this order'], 404);
    }

    Http::json(['success' => true, 'order' => $order]);
}

if ($method === 'GET' && $path === '/api/orders') {
    Http::json(['success' => true, 'orders' => []]);
}

if ($method === 'GET' && $path === '/api/payments') {
    $limit = max(1, min(5000, (int) ($_GET['pageSize'] ?? 2000)));
    $stmt = $pdo->prepare('SELECT id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at, updated_at FROM payments ORDER BY created_at DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $orderIds = array_values(array_filter(array_map(
        static fn (array $r): string => trim((string) ($r['razorpay_order_id'] ?? '')),
        $rows
    )));
    $initiationByOrderId = loadOrderInitiationPayloadsByOrderIds($pdo, $orderIds);
    $snapshotByOrderId = loadRazorpaySnapshotPayloadsByOrderIds($pdo, $orderIds);
    $payments = array_map(static function (array $row) use ($initiationByOrderId, $snapshotByOrderId): array {
        $view = PaymentOrderHelper::normalizePaymentView($row);
        $oid = trim((string) ($view['razorpay_order_id'] ?? ''));
        if ($oid !== '') {
            if (isset($initiationByOrderId[$oid])) {
                $view = PaymentOrderHelper::enrichWithOrderInitiation($view, $initiationByOrderId[$oid]);
            }
            if (isset($snapshotByOrderId[$oid])) {
                $view = PaymentOrderHelper::enrichWithRazorpaySnapshot($view, $snapshotByOrderId[$oid]);
            }
        }

        return $view;
    }, $rows);
    $trackingStartAt = trim((string) Config::get('TRACKING_FEATURE_START_AT', ''));
    Http::json([
        'success' => true,
        'payments' => $payments,
        'trackingFeatureStartAt' => $trackingStartAt !== '' ? $trackingStartAt : null,
    ]);
}

if ($method === 'GET' && $path === '/api/razorpay-webhooks') {
    $limit = max(1, min(5000, (int) ($_GET['pageSize'] ?? 2000)));
    $stmt = $pdo->prepare('SELECT id, event_type, entity_id, signature, signature_valid, payload_json, created_at FROM razorpay_webhooks ORDER BY created_at DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $webhooks = array_map('normalizeRazorpayWebhookRow', $rows);
    Http::json(['success' => true, 'webhooks' => $webhooks]);
}

if ($method === 'GET' && $path === '/api/order-initiations') {
    $limit = max(1, min(5000, (int) ($_GET['pageSize'] ?? 2000)));
    $stmt = $pdo->prepare(
        'SELECT id, razorpay_order_id, order_ref, amount, payload_json, created_at, updated_at
         FROM order_initiations ORDER BY created_at DESC LIMIT :limit'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $initiations = array_map('normalizeOrderInitiationRow', $rows);
    Http::json(['success' => true, 'initiations' => $initiations]);
}

if ($method === 'GET' && $path === '/api/razorpay-order-snapshots') {
    $limit = max(1, min(5000, (int) ($_GET['pageSize'] ?? 2000)));
    $stmt = $pdo->prepare('SELECT id, razorpay_order_id, payload_json, fetched_at, updated_at FROM razorpay_order_snapshots ORDER BY fetched_at DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $snapshots = array_map('normalizeRazorpayOrderSnapshotRow', $rows);
    Http::json(['success' => true, 'snapshots' => $snapshots]);
}

if ($method === 'POST' && $path === '/api/orders') {
    Http::json([
        'success' => false,
        'error' => 'Manual order create is disabled. Orders are created from Razorpay payments.',
    ], 410);
}

$paymentFulfillmentId = null;
if (preg_match('#^/api/(?:orders|payments)/(\d+)$#', $path, $m) && in_array($method, ['PUT', 'PATCH'], true)) {
    $paymentFulfillmentId = (int) $m[1];
}

if ($paymentFulfillmentId !== null) {
    $existing = PaymentOrderHelper::fetchPaymentRowById($pdo, $paymentFulfillmentId);
    if (!$existing || (int) ($existing['is_valid'] ?? 0) !== 1) {
        Http::json(['success' => false, 'error' => 'Payment order not found'], 404);
    }

    $baseView = PaymentOrderHelper::normalizePaymentView($existing);
    if (!($baseView['trackingEligible'] ?? true)) {
        $cutoffLabel = trim((string) ($baseView['trackingCutoffAt'] ?? Config::get('TRACKING_FEATURE_START_AT', '')));
        Http::json([
            'success' => false,
            'error' => $cutoffLabel !== ''
                ? 'Delivery tracking updates apply only to orders on or after ' . $cutoffLabel . '.'
                : 'Delivery tracking is not available for this order.',
        ], 400);
    }
    $oldFulfillmentStatus = normalizeFulfillmentStatus((string) ($baseView['fulfillmentStatus'] ?? 'placed'));

    if (array_key_exists('fulfillmentStatus', $input)) {
        if (!authIsAdminSession()) {
            Http::json(['success' => false, 'error' => 'Admin login required'], 403);
        }
        $input['fulfillmentStatus'] = normalizeFulfillmentStatus((string) $input['fulfillmentStatus']);
    }

    if (array_key_exists('awbNumber', $input) || array_key_exists('trackingUrl', $input)) {
        if (!authIsAdminSession()) {
            Http::json(['success' => false, 'error' => 'Admin login required'], 403);
        }
        if (array_key_exists('awbNumber', $input)) {
            $input['awbNumber'] = normalizeAwbNumber((string) $input['awbNumber']);
        }
        if (array_key_exists('trackingUrl', $input)) {
            $input['trackingUrl'] = normalizeTrackingUrl((string) $input['trackingUrl']);
        }
    }

    $nextStatus = array_key_exists('fulfillmentStatus', $input)
        ? normalizeFulfillmentStatus((string) $input['fulfillmentStatus'])
        : $oldFulfillmentStatus;
    if ($nextStatus === 'shipped' && $nextStatus !== $oldFulfillmentStatus) {
        $mergedPreview = array_merge($baseView, $input);
        $trackUrl = normalizeTrackingUrl((string) ($mergedPreview['trackingUrl'] ?? ''));
        if ($trackUrl === '') {
            Http::json([
                'success' => false,
                'error' => 'Add the Shiprocket/Delhivery tracking link before marking the order as Shipped. The customer will receive it by email.',
            ], 400);
        }
    }

    $patch = [];
    foreach (['fulfillmentStatus', 'awbNumber', 'trackingUrl'] as $key) {
        if (array_key_exists($key, $input)) {
            $patch[$key] = $input[$key];
        }
    }
    PaymentOrderHelper::updatePaymentPayload($pdo, $paymentFulfillmentId, $patch);

    $updatedRow = PaymentOrderHelper::fetchPaymentRowById($pdo, $paymentFulfillmentId);
    $view = PaymentOrderHelper::normalizePaymentView($updatedRow ?: []);
    $newFulfillmentStatus = normalizeFulfillmentStatus((string) ($view['fulfillmentStatus'] ?? 'placed'));
    if ($newFulfillmentStatus !== $oldFulfillmentStatus && in_array($newFulfillmentStatus, ['shipped', 'in_transit', 'delivered'], true)) {
        sendOrderStatusEmail(PaymentOrderHelper::buildEmailOrder($view), $newFulfillmentStatus);
    }

    Http::json(['success' => true]);
}

if ($method === 'POST' && $path === '/api/blogs') {
    $slug = (string) ($input['slug'] ?? '');
    $title = (string) ($input['title'] ?? '');
    if ($slug === '' && $title !== '') {
        $slug = strtolower(trim(preg_replace('/[^\w\s-]+/', '', $title) ?? ''));
        $slug = preg_replace('/[\s_-]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');
    }

    $payload = [
        'firebase_id' => $input['firebase_id'] ?? null,
        'title' => $title,
        'slug' => $slug,
        'mainImage' => (string) ($input['mainImage'] ?? ''),
        'body' => is_array($input['body'] ?? null) ? $input['body'] : [],
        'category' => (string) ($input['category'] ?? ''),
        'active' => !array_key_exists('active', $input) || !empty($input['active']),
    ];

    $firebaseId = (string) ($input['firebase_id'] ?? '');
    if ($firebaseId === '') {
        $firebaseId = 'local_' . bin2hex(random_bytes(8));
    }

    $stmt = $pdo->prepare('INSERT INTO blogs (firebase_id, data_json, created_at, updated_at) VALUES (:firebase_id, :data_json, NOW(), NOW())');
    $stmt->execute([
        'firebase_id' => $firebaseId,
        'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);

    Http::json(['success' => true, 'id' => (string) $pdo->lastInsertId()]);
}

$blogId = null;
if (preg_match('#^/api/blogs/(\d+)$#', $path, $m)) {
    $blogId = (int) $m[1];
}

if ($blogId !== null && $method === 'PUT') {
    $slug = (string) ($input['slug'] ?? '');
    $title = (string) ($input['title'] ?? '');
    if ($slug === '' && $title !== '') {
        $slug = strtolower(trim(preg_replace('/[^\w\s-]+/', '', $title) ?? ''));
        $slug = preg_replace('/[\s_-]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');
    }

    $existingStmt = $pdo->prepare('SELECT firebase_id, data_json FROM blogs WHERE id = :id LIMIT 1');
    $existingStmt->execute(['id' => $blogId]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        Http::json(['success' => false, 'error' => 'Blog not found'], 404);
    }

    $basePayload = [];
    $decoded = json_decode((string) ($existing['data_json'] ?? '{}'), true);
    if (is_array($decoded)) {
        $basePayload = $decoded;
    }

    $payload = array_merge($basePayload, [
        'title' => $title,
        'slug' => $slug,
        'mainImage' => (string) ($input['mainImage'] ?? ''),
        'body' => is_array($input['body'] ?? null) ? $input['body'] : [],
        'category' => (string) ($input['category'] ?? ''),
        'active' => !array_key_exists('active', $input) || !empty($input['active']),
    ]);

    $firebaseId = (string) ($input['firebase_id'] ?? ($existing['firebase_id'] ?? ''));
    if ($firebaseId === '') {
        $firebaseId = 'local_' . bin2hex(random_bytes(8));
    }

    $stmt = $pdo->prepare('UPDATE blogs SET firebase_id = :firebase_id, data_json = :data_json, updated_at = NOW() WHERE id = :id');
    $stmt->execute([
        'id' => $blogId,
        'firebase_id' => $firebaseId,
        'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);

    Http::json(['success' => true]);
}

if ($blogId !== null && $method === 'DELETE') {
    $stmt = $pdo->prepare('DELETE FROM blogs WHERE id = :id');
    $stmt->execute(['id' => $blogId]);
    Http::json(['success' => true]);
}

if ($method === 'POST' && $path === '/api/products') {
    try {
        ensureProductsDiscountSchema($pdo);
    } catch (\Throwable $e) {
        error_log('ensureProductsDiscountSchema: ' . $e->getMessage());
        Http::json(['success' => false, 'error' => 'Products database setup failed'], 500);
    }

    $images = $input['images'] ?? [];
    if (!is_array($images)) {
        $images = [];
    }

    $imageURL = (string) ($input['imageURL'] ?? '');
    if ($imageURL === '' && count($images) > 0) {
        $imageURL = (string) $images[0];
    }

    $discountFields = productDiscountPayloadFromInput($input);

    $sql = 'INSERT INTO products (
                firebase_id, sku, slug, title, sub_title, description, price, original_price, discount_percent, stock, category, image_url, images_json, active, created_at, updated_at
            ) VALUES (
                :firebase_id, :sku, :slug, :title, :sub_title, :description, :price, :original_price, :discount_percent, :stock, :category, :image_url, :images_json, :active, NOW(), NOW()
            )';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'firebase_id' => $input['firebase_id'] ?? null,
        'sku' => (string) ($input['sku'] ?? ''),
        'slug' => $input['slug'] ?? strtolower((string) ($input['sku'] ?? '')),
        'title' => (string) ($input['title'] ?? ''),
        'sub_title' => (string) ($input['subTitle'] ?? ''),
        'description' => (string) ($input['description'] ?? ''),
        'price' => (float) ($input['price'] ?? 0),
        'original_price' => $discountFields['original_price'],
        'discount_percent' => $discountFields['discount_percent'],
        'stock' => (int) ($input['stock'] ?? 0),
        'category' => (string) ($input['category'] ?? ''),
        'image_url' => $imageURL,
        'images_json' => json_encode(array_values(array_filter($images, fn($x) => is_string($x))), JSON_UNESCAPED_SLASHES),
        'active' => !array_key_exists('active', $input) || $input['active'] ? 1 : 0,
    ]);

    Http::json(['success' => true, 'id' => (string) $pdo->lastInsertId()]);
}

$productId = null;
if (preg_match('#^/api/products/(\d+)$#', $path, $m)) {
    $productId = (int) $m[1];
}

if ($productId !== null && $method === 'PUT') {
    try {
        ensureProductsDiscountSchema($pdo);
    } catch (\Throwable $e) {
        error_log('ensureProductsDiscountSchema: ' . $e->getMessage());
        Http::json(['success' => false, 'error' => 'Products database setup failed'], 500);
    }

    $images = $input['images'] ?? [];
    if (!is_array($images)) {
        $images = [];
    }
    $imageURL = (string) ($input['imageURL'] ?? '');
    if ($imageURL === '' && count($images) > 0) {
        $imageURL = (string) $images[0];
    }

    $discountFields = productDiscountPayloadFromInput($input);

    $sql = 'UPDATE products SET
                sku = :sku,
                slug = :slug,
                title = :title,
                sub_title = :sub_title,
                description = :description,
                price = :price,
                original_price = :original_price,
                discount_percent = :discount_percent,
                stock = :stock,
                category = :category,
                image_url = :image_url,
                images_json = :images_json,
                active = :active,
                updated_at = NOW()
            WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'id' => $productId,
        'sku' => (string) ($input['sku'] ?? ''),
        'slug' => $input['slug'] ?? strtolower((string) ($input['sku'] ?? '')),
        'title' => (string) ($input['title'] ?? ''),
        'sub_title' => (string) ($input['subTitle'] ?? ''),
        'description' => (string) ($input['description'] ?? ''),
        'price' => (float) ($input['price'] ?? 0),
        'original_price' => $discountFields['original_price'],
        'discount_percent' => $discountFields['discount_percent'],
        'stock' => (int) ($input['stock'] ?? 0),
        'category' => (string) ($input['category'] ?? ''),
        'image_url' => $imageURL,
        'images_json' => json_encode(array_values(array_filter($images, fn($x) => is_string($x))), JSON_UNESCAPED_SLASHES),
        'active' => !array_key_exists('active', $input) || $input['active'] ? 1 : 0,
    ]);

    Http::json(['success' => true]);
}

if ($productId !== null && $method === 'DELETE') {
    $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
    $stmt->execute(['id' => $productId]);
    Http::json(['success' => true]);
}

if ($method === 'POST' && $path === '/api/payments/razorpay/create-order') {
    $keyId = Config::get('RAZORPAY_KEY_ID', '');
    $keySecret = Config::get('RAZORPAY_KEY_SECRET', '');
    $amount = (float) ($input['amount'] ?? 0);
    $cart = is_array($input['cart'] ?? null) ? $input['cart'] : [];
    $magicCheckout = !array_key_exists('magic_checkout', $input)
        ? false
        : filter_var((string) $input['magic_checkout'], FILTER_VALIDATE_BOOLEAN);
    $customerName = trim((string) ($input['customer_name'] ?? ''));
    $customerEmail = trim((string) ($input['customer_email'] ?? ''));
    $customerPhone = trim((string) ($input['customer_phone'] ?? ''));
    if (!$keyId || !$keySecret || $amount <= 0) {
        Http::json(['success' => false, 'error' => 'Invalid Razorpay config or amount'], 400);
    }

    $notes = ['source' => 'php-api'];
    $selectedAddress = is_array($input['selectedAddress'] ?? null) ? $input['selectedAddress'] : [];
    if (count($selectedAddress) > 0) {
        $notes['address_line1'] = substr((string) ($selectedAddress['line1'] ?? ''), 0, 120);
        $notes['address_line2'] = substr((string) ($selectedAddress['line2'] ?? $selectedAddress['street'] ?? ''), 0, 120);
        $notes['area'] = substr((string) ($selectedAddress['area'] ?? ''), 0, 80);
        $notes['city'] = substr((string) ($selectedAddress['city'] ?? ''), 0, 80);
        $notes['state'] = substr((string) ($selectedAddress['state'] ?? ''), 0, 80);
        $notes['country'] = substr((string) ($selectedAddress['country'] ?? ''), 0, 80);
        $notes['pincode'] = substr((string) ($selectedAddress['pincode'] ?? $selectedAddress['zipcode'] ?? ''), 0, 20);
    }
    if (count($cart) > 0) {
        $itemsSummary = implode('; ', array_map(static function ($item) {
            if (!is_array($item)) {
                return 'Item x 1';
            }
            $title = (string) ($item['title'] ?? $item['name'] ?? 'Item');
            $qty = (int) ($item['qty'] ?? 1);
            return $title . ' x ' . max(1, $qty);
        }, $cart));
        if ($itemsSummary !== '') {
            $notes['items'] = substr($itemsSummary, 0, 256);
        }
    }

    $amountPaise = parseAmountToPaise($amount);
    $payload = [
        'amount' => $amountPaise,
        'currency' => 'INR',
        'receipt' => substr((string) ($input['receipt'] ?? ('rcpt_' . time())), 0, 40),
        'payment' => ['capture' => 'automatic'],
        'notes' => $notes,
    ];
    if ($magicCheckout) {
        $magic = buildMagicLineItems($cart, $amount);
        $payload['amount'] = $magic['line_items_total'];
        $payload['line_items_total'] = $magic['line_items_total'];
        $payload['line_items'] = $magic['line_items'];
    }

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt_array($ch, [
        CURLOPT_USERPWD => $keyId . ':' . $keySecret,
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error || $status >= 400) {
        Http::json(['success' => false, 'error' => $error ?: 'Razorpay order create failed', 'raw' => $raw], 500);
    }

    $data = json_decode((string) $raw, true);
    // Persist checkout snapshot on payments row (pending) — used for verify, webhooks, emails, admin tracking.
    $createdOrderId = (string) ($data['id'] ?? '');
    if ($createdOrderId !== '') {
        try {
            $authUserId = authIsAdminSession() ? 0 : authGetCustomerSessionId();
            $repo->storePayment([
                'razorpay_order_id' => $createdOrderId,
                'razorpay_payment_id' => '',
                'razorpay_signature' => '',
                'amount' => $amount,
                'is_valid' => false,
                'orderId' => (string) ($input['receipt'] ?? ''),
                'name' => $customerName,
                'email' => $customerEmail,
                'phone' => $customerPhone,
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
                'selectedAddress' => $selectedAddress,
                'cart' => $cart,
                'fulfillmentStatus' => 'placed',
                'userId' => $authUserId > 0 ? (string) $authUserId : '',
                'status' => 'initiated',
            ]);
        } catch (Throwable $e) {
            logRazorpayWebhook('payment_checkout_snapshot_failed', [
                'order_id' => $createdOrderId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    Http::json([
        'success' => true,
        'order_id' => $data['id'] ?? null,
        'amount' => $data['amount'] ?? parseAmountToPaise($amount),
        'currency' => $data['currency'] ?? 'INR',
    ]);
}

if ($method === 'POST' && $path === '/api/payments/razorpay/magic/shipping-info') {
    $rawBody = file_get_contents('php://input') ?: '';
    $parsedBody = json_decode($rawBody, true);
    if (!is_array($parsedBody)) {
        $parsedBody = [];
    }
    logMagicShipping('request_received', [
        'method' => $method,
        'path' => $path,
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
        'raw_body' => $rawBody,
        'json_parse_ok' => $rawBody === '' ? true : (json_last_error() === JSON_ERROR_NONE),
        'json_error' => $rawBody === '' ? '' : json_last_error_msg(),
        'input_keys' => array_keys($input),
        'parsed_body_keys' => array_keys($parsedBody),
    ]);

    $stateCodeMap = [
        'andhra pradesh' => 'AP',
        'arunachal pradesh' => 'AR',
        'assam' => 'AS',
        'bihar' => 'BR',
        'chhattisgarh' => 'CG',
        'goa' => 'GA',
        'gujarat' => 'GJ',
        'haryana' => 'HR',
        'himachal pradesh' => 'HP',
        'jharkhand' => 'JH',
        'karnataka' => 'KA',
        'kerala' => 'KL',
        'madhya pradesh' => 'MP',
        'maharashtra' => 'MH',
        'manipur' => 'MN',
        'meghalaya' => 'ML',
        'mizoram' => 'MZ',
        'nagaland' => 'NL',
        'odisha' => 'OD',
        'punjab' => 'PB',
        'rajasthan' => 'RJ',
        'sikkim' => 'SK',
        'tamil nadu' => 'TN',
        'telangana' => 'TS',
        'tripura' => 'TR',
        'uttar pradesh' => 'UP',
        'uttarakhand' => 'UK',
        'west bengal' => 'WB',
        'andaman and nicobar islands' => 'AN',
        'chandigarh' => 'CH',
        'dadra and nagar haveli and daman and diu' => 'DN',
        'delhi' => 'DL',
        'jammu and kashmir' => 'JK',
        'ladakh' => 'LA',
        'lakshadweep' => 'LD',
        'puducherry' => 'PY',
    ];

    $addressesIn = is_array($input['addresses'] ?? null) ? $input['addresses'] : [];
    // Be tolerant to alternate payload shapes from Magic Checkout.
    if (count($addressesIn) === 0 && isset($input['shipping_address']) && is_array($input['shipping_address'])) {
        $addressesIn[] = $input['shipping_address'];
    }
    if (count($addressesIn) === 0 && (
        isset($input['zipcode']) || isset($input['pincode']) || isset($input['postal_code'])
    )) {
        $addressesIn[] = $input;
    }
    logMagicShipping('addresses_in_detected', [
        'addresses_in_count' => count($addressesIn),
        'has_shipping_address' => isset($input['shipping_address']),
        'has_zip_fields' => isset($input['zipcode']) || isset($input['pincode']) || isset($input['postal_code']),
    ]);

    $addresses = [];
    foreach ($addressesIn as $idx => $a) {
        if (!is_array($a)) {
            logMagicShipping('address_skipped_non_array', ['index' => $idx, 'type' => gettype($a)]);
            continue;
        }

        // Razorpay sends numeric id in some flows; preserve incoming type.
        $id = $a['id'] ?? $idx;
        $zip = preg_replace('/\D/', '', (string) ($a['zipcode'] ?? $a['pincode'] ?? $a['postal_code'] ?? '')) ?? '';
        $zip = substr($zip, 0, 6);
        if (strlen($zip) !== 6) {
            $zip = '600005';
        }

        // Keep country shape aligned with request payload when valid.
        $country = trim((string) ($a['country'] ?? 'in'));
        if (strlen($country) !== 2) {
            $country = 'in';
        }

        $stateCode = strtoupper(trim((string) ($a['state_code'] ?? '')));
        if (strlen($stateCode) !== 2) {
            $stateName = strtolower(trim((string) ($a['state'] ?? $a['state_name'] ?? '')));
            $stateCode = $stateCodeMap[$stateName] ?? 'TN';
        }
        $city = trim((string) ($a['city'] ?? 'Chennai'));
        if ($city === '') {
            $city = 'Chennai';
        }
        $state = trim((string) ($a['state'] ?? $a['state_name'] ?? 'Tamil Nadu'));
        if ($state === '') {
            $state = 'Tamil Nadu';
        }
        logMagicShipping('address_normalized', [
            'index' => $idx,
            'id' => $id,
            'incoming_zip' => (string) ($a['zipcode'] ?? $a['pincode'] ?? $a['postal_code'] ?? ''),
            'normalized_zip' => $zip,
            'country' => $country,
            'city' => $city,
            'state' => $state,
            'state_code' => $stateCode,
        ]);

        $addresses[] = [
            'id' => $id,
            'zipcode' => $zip,
            'pincode' => $zip,
            'postal_code' => $zip,
            'country' => $country,
            'city' => $city,
            'state' => $state,
            'state_code' => $stateCode,
            'shipping_methods' => [[
                'id' => '1',
                'name' => 'Standard Delivery',
                'description' => 'Free Delivery',
                'serviceable' => true,
                'shipping_fee' => 0,
                'cod' => false,
                'cod_fee' => 0,
            ]],
        ];
    }

    if (count($addresses) === 0) {
        logMagicShipping('fallback_address_used', ['reason' => 'no_valid_addresses']);
        $addresses = [[
            'id' => 0,
            'zipcode' => '600005',
            'pincode' => '600005',
            'postal_code' => '600005',
            'country' => 'in',
            'city' => 'Chennai',
            'state' => 'Tamil Nadu',
            'state_code' => 'TN',
            'shipping_methods' => [[
                'id' => '1',
                'name' => 'Standard Delivery',
                'description' => 'Free Delivery',
                'serviceable' => true,
                'shipping_fee' => 0,
                'cod' => false,
                'cod_fee' => 0,
            ]],
        ]];
    }

    logMagicShipping('response_ready', [
        'address_count' => count($addresses),
        'first_address_zip' => (string) (($addresses[0]['zipcode'] ?? '') ?: ''),
        'first_address_country' => (string) (($addresses[0]['country'] ?? '') ?: ''),
        'first_shipping_serviceable' => (bool) ($addresses[0]['shipping_methods'][0]['serviceable'] ?? false),
    ]);

    Http::json(['addresses' => $addresses]);
}

if ($method === 'POST' && $path === '/api/payments/razorpay/magic/get-promotions') {
    Http::json(['promotions' => []]);
}

if ($method === 'POST' && $path === '/api/payments/razorpay/magic/apply-promotion') {
    $code = trim((string) ($input['code'] ?? ''));
    if ($code === '') {
        Http::json([
            'error' => [
                'code' => 'BAD_REQUEST',
                'description' => 'code is required',
            ],
        ], 400);
    }

    Http::json([
        'promotion' => [
            'reference_id' => 'stub_' . $code,
            'code' => $code,
            'value' => 0,
            'value_type' => 'fixed_amount',
            'description' => 'No merchant-side discount',
        ],
    ]);
}

if ($method === 'POST' && $path === '/api/payments/razorpay/verify') {
    $orderId = (string) ($input['razorpay_order_id'] ?? '');
    $paymentId = (string) ($input['razorpay_payment_id'] ?? '');
    $signature = (string) ($input['razorpay_signature'] ?? '');
    $isValid = verifyRazorpaySignature($orderId, $paymentId, $signature);
    $amountInput = (float) ($input['amount'] ?? 0);
    // Frontend verify call sends Razorpay order amount in paise.
    $amountRupees = $amountInput > 0 ? ($amountInput / 100.0) : 0.0;

    $repo->storePayment([
        ...$input,
        'amount' => $amountRupees,
        'is_valid' => $isValid,
    ]);

    $authUserId = authIsAdminSession() ? 0 : authGetCustomerSessionId();
    $repo->storePayment([
        ...$input,
        'razorpay_order_id' => $orderId,
        'amount' => $amountRupees,
        'is_valid' => $isValid,
        'userId' => $authUserId > 0 ? (string) $authUserId : ($input['userId'] ?? ''),
        'fulfillmentStatus' => 'placed',
    ]);

    $paymentId = null;
    if ($isValid && $orderId !== '') {
        try {
            $paymentId = PaymentOrderHelper::afterSuccessfulPayment(
                $pdo,
                $repo,
                $orderId,
                static fn (array $emailOrder): bool => sendOrderStatusEmail($emailOrder, 'placed'),
                $authUserId > 0 ? $authUserId : null
            );
        } catch (Throwable $e) {
            logRazorpayWebhook('payment_placed_email_failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    Http::json([
        'success' => $isValid,
        'isValid' => $isValid,
        'phpOrderId' => $paymentId,
        'paymentId' => $paymentId,
        'orderNo' => $paymentId,
    ]);
}

if ($method === 'POST' && $path === '/api/orders/initiation') {
    Http::json(['success' => true, 'deprecated' => true]);
}

if ($method === 'POST' && $path === '/api/webhooks/razorpay') {
    $raw = file_get_contents('php://input') ?: '{}';
    $body = json_decode($raw, true) ?: [];
    $signature = (string) ($_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '');
    $secret = Config::get('RAZORPAY_WEBHOOK_SECRET', Config::get('RAZORPAY_KEY_SECRET', ''));
    $expected = hash_hmac('sha256', $raw, (string) $secret);
    $valid = $signature && hash_equals($expected, $signature);

    $eventType = (string) ($body['event'] ?? '');
    $entity = $body['payload']['payment']['entity'] ?? [];
    $entityId = (string) ($entity['id'] ?? $body['id'] ?? 'unknown');
    $alreadySeen = $eventType !== '' && $entityId !== ''
        ? $repo->hasWebhookEventEntity($eventType, $entityId)
        : false;

    $repo->storeWebhook($body, $signature, $valid);
    logRazorpayWebhook('received', [
        'event_type' => $eventType,
        'entity_id' => $entityId,
        'signature_present' => $signature !== '',
        'signature_valid' => (bool) $valid,
        'order_id' => (string) ($entity['order_id'] ?? ''),
        'payment_id' => (string) ($entity['id'] ?? ''),
        'raw' => $raw,
        'body' => $body,
    ]);

    // Handle successful capture webhook
    if ($eventType === 'payment.captured') {
        $orderId = (string) ($entity['order_id'] ?? '');
        $amount = isset($entity['amount']) ? ((float) $entity['amount'] / 100) : 0.0;

        // Persist payment from webhook so backend has a reliable source of truth.
        $repo->storePayment([
            'razorpay_order_id' => $orderId,
            'razorpay_payment_id' => (string) ($entity['id'] ?? ''),
            'razorpay_signature' => $signature,
            'amount' => $amount,
            'is_valid' => $valid && strtolower((string) ($entity['status'] ?? '')) === 'captured',
            'payload_json' => $body,
        ]);
        logRazorpayWebhook('payment_stored', [
            'order_id' => $orderId,
            'payment_id' => (string) ($entity['id'] ?? ''),
            'amount' => $amount,
            'signature_valid' => (bool) $valid,
            'already_seen' => (bool) $alreadySeen,
        ]);
        logPaymentEvent('payment.captured', [
            'order_id' => $orderId,
            'payment_id' => (string) ($entity['id'] ?? ''),
            'amount' => $amount,
            'status' => (string) ($entity['status'] ?? ''),
            'signature_valid' => (bool) $valid,
        ]);

        $orderApiJson = null;
        if ($orderId !== '') {
            $orderApiJson = fetchRazorpayOrderFromApi($orderId);
            if ($orderApiJson !== null) {
                try {
                    $repo->upsertRazorpayOrderSnapshot($orderId, $orderApiJson);
                    logRazorpayWebhook('razorpay_order_snapshot_saved', [
                        'order_id' => $orderId,
                        'has_customer_details' => isset($orderApiJson['customer_details']),
                    ]);
                } catch (Throwable $e) {
                    logRazorpayWebhook('razorpay_order_snapshot_db_error', [
                        'order_id' => $orderId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        $sku = (string) ($input['sku'] ?? '');
        $contentId = MetaCapiService::productCatalogId($sku);

        $event = [
            'event_name' => 'Purchase',
            'event_time' => time(),
            'event_id' => 'purchase_' . $orderId,
            'action_source' => 'website',
            'event_source_url' => Config::get('APP_URL', 'https://franchglobal.com') . '/thank-you',
            'user_data' => MetaCapiService::buildUserData([
                'email' => $entity['email'] ?? null,
                'phone' => $entity['contact'] ?? null,
                'client_ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'client_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            ]),
            'custom_data' => [
                'currency' => 'INR',
                'value' => $amount,
                'content_ids' => $contentId ? [$contentId] : [],
                'content_type' => 'product',
                'order_id' => $orderId,
            ],
        ];

        MetaCapiService::track($event);
        logRazorpayWebhook('meta_capi_tracked', [
            'event_id' => (string) ($event['event_id'] ?? ''),
            'order_id' => $orderId,
            'amount' => $amount,
        ]);

        if ($orderId !== '' && $valid) {
            try {
                PaymentOrderHelper::afterSuccessfulPayment(
                    $pdo,
                    $repo,
                    $orderId,
                    static fn (array $emailOrder): bool => sendOrderStatusEmail($emailOrder, 'placed')
                );
            } catch (Throwable $e) {
                logRazorpayWebhook('payment_webhook_fulfillment_failed', [
                    'order_id' => $orderId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Send Telegram paid message only once per payment entity.
        if (!$alreadySeen) {
            $paymentRow = $orderId !== '' ? PaymentOrderHelper::fetchPaymentRowByRazorpayOrderId($pdo, $orderId) : null;
            $paymentView = $paymentRow ? PaymentOrderHelper::normalizePaymentView($paymentRow) : [];
            $orderForMerge = $orderApiJson ?? ($orderId !== '' ? $repo->getRazorpayOrderSnapshotByRazorpayOrderId($orderId) : null);
            $paymentView = PaymentOrderHelper::enrichWithRazorpaySnapshot($paymentView, $orderForMerge);
            $telegramContext = PaymentOrderHelper::paymentViewToTelegramContext($paymentView);
            logPaymentEvent('address.capture_status', [
                'event' => 'payment.captured',
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
                'has_address' => hasNonEmptyAddress($telegramContext),
                'has_order_customer_details' => is_array($orderForMerge) && isset($orderForMerge['customer_details']),
            ]);
            $telegramMsg = formatTelegramPaidMessage($entity, $telegramContext);
            $telegramResult = sendTelegramHtmlMessage($telegramMsg);
            logRazorpayWebhook('telegram_sent', [
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
                'success' => (bool) ($telegramResult['success'] ?? false),
                'details' => $telegramResult,
            ]);
        } else {
            logRazorpayWebhook('telegram_skipped_duplicate', [
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
            ]);
        }
    }

    // Handle failed payment webhook: persist + notify Telegram.
    if ($eventType === 'payment.failed') {
        $orderId = (string) ($entity['order_id'] ?? '');
        $amount = isset($entity['amount']) ? ((float) $entity['amount'] / 100) : 0.0;

        $orderApiJsonFailed = $orderId !== '' ? fetchRazorpayOrderFromApi($orderId) : null;

        // Late failure webhooks for an earlier attempt are common when the customer retries and pays.
        // Do not treat as a failed order when Razorpay shows the order already fully paid.
        $skipFailedPersistence = false;
        if (is_array($orderApiJsonFailed)) {
            $amountOrder = (int) ($orderApiJsonFailed['amount'] ?? 0);
            $amountPaid = (int) ($orderApiJsonFailed['amount_paid'] ?? 0);
            $orderStatus = strtolower((string) ($orderApiJsonFailed['status'] ?? ''));
            if ($amountOrder > 0 && $amountPaid >= $amountOrder && ($orderStatus === 'paid' || $amountPaid >= $amountOrder)) {
                $skipFailedPersistence = true;
                logRazorpayWebhook('payment_failed_skipped_order_already_paid', [
                    'order_id' => $orderId,
                    'payment_id' => (string) ($entity['id'] ?? ''),
                    'amount_order_paise' => $amountOrder,
                    'amount_paid_paise' => $amountPaid,
                    'razorpay_order_status' => (string) ($orderApiJsonFailed['status'] ?? ''),
                ]);
            }
        }

        if (!$skipFailedPersistence) {
            $repo->storePayment([
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => (string) ($entity['id'] ?? ''),
                'razorpay_signature' => $signature,
                'amount' => $amount,
                'is_valid' => $valid,
                'payload_json' => $body,
            ]);
            logRazorpayWebhook('payment_failed_stored', [
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
                'amount' => $amount,
                'signature_valid' => (bool) $valid,
                'error_code' => (string) ($entity['error_code'] ?? ''),
                'error_reason' => (string) ($entity['error_reason'] ?? ''),
                'already_seen' => (bool) $alreadySeen,
            ]);
            logPaymentEvent('payment.failed', [
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
                'amount' => $amount,
                'status' => (string) ($entity['status'] ?? ''),
                'error_code' => (string) ($entity['error_code'] ?? ''),
                'error_reason' => (string) ($entity['error_reason'] ?? ''),
                'signature_valid' => (bool) $valid,
            ]);
        }

        if ($orderApiJsonFailed !== null) {
            try {
                $repo->upsertRazorpayOrderSnapshot($orderId, $orderApiJsonFailed);
                logRazorpayWebhook('razorpay_order_snapshot_saved', [
                    'order_id' => $orderId,
                    'has_customer_details' => isset($orderApiJsonFailed['customer_details']),
                    'context' => $skipFailedPersistence ? 'payment.failed_ignored_paid' : 'payment.failed',
                ]);
            } catch (Throwable $e) {
                logRazorpayWebhook('razorpay_order_snapshot_db_error', [
                    'order_id' => $orderId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!$skipFailedPersistence && !$alreadySeen) {
            $paymentRow = $orderId !== '' ? PaymentOrderHelper::fetchPaymentRowByRazorpayOrderId($pdo, $orderId) : null;
            $paymentView = $paymentRow ? PaymentOrderHelper::normalizePaymentView($paymentRow) : [];
            $orderForMerge = $orderApiJsonFailed ?? ($orderId !== '' ? $repo->getRazorpayOrderSnapshotByRazorpayOrderId($orderId) : null);
            $paymentView = PaymentOrderHelper::enrichWithRazorpaySnapshot($paymentView, $orderForMerge);
            $telegramContext = PaymentOrderHelper::paymentViewToTelegramContext($paymentView);
            logPaymentEvent('address.capture_status', [
                'event' => 'payment.failed',
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
                'has_address' => hasNonEmptyAddress($telegramContext),
                'has_order_customer_details' => is_array($orderForMerge) && isset($orderForMerge['customer_details']),
            ]);
            $telegramMsg = formatTelegramFailedMessage($entity, $telegramContext);
            $telegramResult = sendTelegramHtmlMessage($telegramMsg);
            logRazorpayWebhook('telegram_failed_sent', [
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
                'success' => (bool) ($telegramResult['success'] ?? false),
                'details' => $telegramResult,
            ]);
        } elseif (!$skipFailedPersistence) {
            logRazorpayWebhook('telegram_failed_skipped_duplicate', [
                'order_id' => $orderId,
                'payment_id' => (string) ($entity['id'] ?? ''),
            ]);
        }
    }

    Http::json(['success' => true, 'signature_valid' => $valid]);
}

if ($method === 'POST' && $path === '/api/meta/track') {
    $eventName = (string) ($input['event_name'] ?? '');
    if ($eventName === '') {
        Http::json(['success' => false, 'error' => 'event_name is required'], 400);
    }

    $event = [
        'event_name' => $eventName,
        'event_time' => (int) ($input['event_time'] ?? time()),
        'event_id' => (string) ($input['event_id'] ?? ($eventName . '_' . time())),
        'action_source' => 'website',
        'event_source_url' => (string) ($input['event_source_url'] ?? (Config::get('APP_URL', 'https://franchglobal.com'))),
        'user_data' => MetaCapiService::buildUserData($input['user_data'] ?? []),
        'custom_data' => $input['custom_data'] ?? [],
    ];

    $result = MetaCapiService::track($event);
    Http::json($result, !empty($result['success']) ? 200 : 500);
}

if ($method === 'POST' && $path === '/api/shipping/shiprocket/create-order') {
    $email = trim((string) Config::get('SHIPROCKET_EMAIL', ''));
    $password = trim((string) Config::get('SHIPROCKET_PASSWORD', ''));
    if ($email === '' || $password === '') {
        Http::json(['success' => false, 'error' => 'Shiprocket credentials missing in backend-php/.env'], 400);
    }

    $loginResp = httpJsonRequest(
        'https://apiv2.shiprocket.in/v1/external/auth/login',
        ['json' => ['email' => $email, 'password' => $password]]
    );
    if (!$loginResp['ok'] || empty($loginResp['json']['token'])) {
        $srMessage = is_array($loginResp['json']) ? (string) ($loginResp['json']['message'] ?? '') : '';
        $srStatus = (int) ($loginResp['status'] ?? 0);
        $hint = 'Use API user credentials from Shiprocket → Settings → API → Create API User (not your main app.shiprocket.in login). The API email must be different from your registered Shiprocket account email.';
        if ($srStatus === 403 || stripos($srMessage, 'forbidden') !== false) {
            $error = 'Shiprocket access denied (403). ' . $hint;
        } else {
            $error = 'Shiprocket auth failed. Check API user email/password in .env. ' . $hint;
        }
        Http::json([
            'success' => false,
            'error' => $error,
            'details' => $loginResp['json'] ?: $loginResp['raw'],
        ], 502);
    }

    $token = (string) $loginResp['json']['token'];
    $shiprocketPayload = normalizeShiprocketCreateOrderPayload(is_array($input) ? $input : []);

    $orderResp = httpJsonRequest(
        'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
        [
            'headers' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $token,
            ],
            'json' => $shiprocketPayload,
        ]
    );

    if (!$orderResp['ok']) {
        $srDetails = is_array($orderResp['json']) ? $orderResp['json'] : [];
        Http::json([
            'success' => false,
            'error' => shiprocketFormatValidationError($srDetails),
            'details' => $srDetails ?: $orderResp['raw'],
        ], 502);
    }

    $payload = is_array($orderResp['json']) ? $orderResp['json'] : [];
    Http::json([
        'success' => true,
        'data' => $payload,
        'shiprocket_order_id' => $payload['order_id'] ?? $payload['orderId'] ?? null,
        'message' => 'Order created in Shiprocket',
    ]);
}

if ($method === 'POST' && $path === '/api/payments/razorpay/capture') {
    $keyId = Config::get('RAZORPAY_KEY_ID', '');
    $keySecret = Config::get('RAZORPAY_KEY_SECRET', '');
    if (!$keyId || !$keySecret) {
        Http::json(['success' => false, 'error' => 'Razorpay credentials missing'], 400);
    }

    $paymentId = (string) ($input['payment_id'] ?? '');
    if (!$paymentId) {
        Http::json(['success' => false, 'error' => 'payment_id is required'], 400);
    }

    $amount = isset($input['amount']) ? (int) $input['amount'] : null;
    $currency = (string) ($input['currency'] ?? 'INR');

    if ($amount === null) {
        $fetchResp = httpJsonRequest(
            'https://api.razorpay.com/v1/payments/' . rawurlencode($paymentId),
            [
                'method' => 'GET',
                'headers' => ['Content-Type: application/json'],
                'basic_auth' => [$keyId, $keySecret],
            ]
        );

        if (!$fetchResp['ok']) {
            Http::json([
                'success' => false,
                'error' => 'Failed to fetch Razorpay payment',
                'details' => $fetchResp['json'] ?: $fetchResp['raw'],
            ], 502);
        }

        $amount = (int) ($fetchResp['json']['amount'] ?? 0);
        $status = (string) ($fetchResp['json']['status'] ?? '');
        if ($status !== 'authorized') {
            Http::json([
                'success' => false,
                'error' => "Payment is not authorized (status: {$status})",
            ], 400);
        }
    }

    $captureResp = httpJsonRequest(
        'https://api.razorpay.com/v1/payments/' . rawurlencode($paymentId) . '/capture',
        [
            'headers' => ['Content-Type: application/json'],
            'basic_auth' => [$keyId, $keySecret],
            'json' => ['amount' => $amount, 'currency' => $currency],
        ]
    );

    if (!$captureResp['ok']) {
        Http::json([
            'success' => false,
            'error' => 'Razorpay capture failed',
            'details' => $captureResp['json'] ?: $captureResp['raw'],
        ], 502);
    }

    Http::json([
        'success' => true,
        'message' => 'Payment captured successfully',
        'data' => $captureResp['json'] ?: [],
    ]);
}

if ($method === 'POST' && str_starts_with($path, '/api/functions/')) {
    $name = trim(str_replace('/api/functions/', '', $path));
    if ($name === 'ping') {
        Http::json(['ok' => true, 'message' => 'pong', 'ts' => time()]);
    }

    if ($name === 'telegramSend') {
        $token = Config::get('TELEGRAM_BOT_TOKEN', '');
        $chatId = Config::get('TELEGRAM_GROUP_ID', '');
        if (!$token || !$chatId) {
            Http::json(['success' => false, 'error' => 'Telegram env vars missing'], 400);
        }

        $message = (string) ($input['message'] ?? '');
        if ($message === '') {
            Http::json(['success' => false, 'error' => 'message is required'], 400);
        }

        // Telegram has practical message size limits; keep a safe buffer.
        if (mb_strlen($message) > 3500) {
            $message = mb_substr($message, 0, 3500) . "\n\n[truncated]";
        }

        $requestPayload = [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => (string) ($input['parse_mode'] ?? 'HTML'),
            'disable_web_page_preview' => !empty($input['disable_web_page_preview']),
        ];

        $telegramResp = httpJsonRequest(
            'https://api.telegram.org/bot' . $token . '/sendMessage',
            ['headers' => ['Content-Type: application/json'], 'json' => $requestPayload]
        );

        // Fallback: if HTML parse/message formatting fails, retry as plain text.
        if (!$telegramResp['ok'] || empty($telegramResp['json']['ok'])) {
            $plainMessage = strip_tags($message);
            if (mb_strlen($plainMessage) > 3500) {
                $plainMessage = mb_substr($plainMessage, 0, 3500) . "\n\n[truncated]";
            }
            $fallbackPayload = [
                'chat_id' => $chatId,
                'text' => $plainMessage,
                'disable_web_page_preview' => !empty($input['disable_web_page_preview']),
            ];
            $retryResp = httpJsonRequest(
                'https://api.telegram.org/bot' . $token . '/sendMessage',
                ['headers' => ['Content-Type: application/json'], 'json' => $fallbackPayload]
            );

            if ($retryResp['ok'] && !empty($retryResp['json']['ok'])) {
                Http::json([
                    'success' => true,
                    'data' => $retryResp['json'],
                    'fallback' => 'plain_text',
                ]);
            }
        }

        if (!$telegramResp['ok'] || empty($telegramResp['json']['ok'])) {
            Http::json([
                'success' => false,
                'error' => 'Telegram send failed',
                'details' => $telegramResp['json'] ?: $telegramResp['raw'],
            ], 502);
        }

        Http::json(['success' => true, 'data' => $telegramResp['json']]);
    }

    Http::json([
        'success' => false,
        'error' => "Function '{$name}' not found.",
    ], 404);
}

$previewStatus = null;
if (preg_match('#^/api/email/preview(?:/([a-z_]+))?$#', $path, $previewMatch) && $method === 'GET') {
    $previewStatus = $previewMatch[1] ?? null;
}

if ($previewStatus !== null || ($method === 'GET' && $path === '/api/email/preview')) {
    $isDev = strtolower((string) Config::get('APP_ENV', 'production')) === 'development';
    if (!$isDev && !authIsAdminSession()) {
        Http::json(['success' => false, 'error' => 'Unauthorized'], 403);
    }

    $sampleOrder = [
        'id' => '10001',
        'orderNo' => '185',
        'customerName' => 'Usha Usha',
        'customerEmail' => 'customer@example.com',
        'email' => 'customer@example.com',
        'paymentStatus' => 'paid',
        'totalAmount' => 220,
        'createdAt' => date('Y-m-d H:i:s'),
        'items' => [
            [
                'title' => 'Franch Oil NH* Plus',
                'qty' => 1,
                'price' => 220,
                'total' => 220,
            ],
        ],
        'address' => [
            'line1' => '42, Anna Nagar Main Road',
            'line2' => 'Near Park',
            'city' => 'Chennai',
            'state' => 'Tamil Nadu',
            'pincode' => '600078',
        ],
    ];

    if ($previewStatus === null || $previewStatus === '') {
        header('Content-Type: text/html; charset=utf-8');
        $base = rtrim((string) Config::get('APP_URL', 'http://localhost:8000'), '/');
        if (str_contains($base, '5173')) {
            $base = 'http://localhost:8000';
        }
        $statuses = [
            'placed' => 'Order placed',
            'shipped' => 'Shipped',
            'in_transit' => 'Out for delivery',
            'delivered' => 'Delivered',
        ];
        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Email previews</title>';
        echo '<style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#111}';
        echo 'a{display:block;padding:14px 16px;margin:8px 0;background:#0F6B3A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600}';
        echo 'a:hover{background:#0a5230}h1{color:#0F6B3A}</style></head><body>';
        echo '<h1>Order email previews</h1><p>Open each template in a new tab:</p>';
        foreach ($statuses as $key => $label) {
            echo '<a href="' . htmlspecialchars($base . '/api/email/preview/' . $key, ENT_QUOTES) . '" target="_blank">' . htmlspecialchars($label) . '</a>';
        }
        echo '</body></html>';
        exit;
    }

    $allowed = ['placed', 'shipped', 'in_transit', 'delivered'];
    if (!in_array($previewStatus, $allowed, true)) {
        Http::json(['success' => false, 'error' => 'Invalid status. Use: placed, shipped, in_transit, delivered'], 400);
    }

    header('Content-Type: text/html; charset=utf-8');
    echo OrderEmailTemplates::buildHtml($sampleOrder, $previewStatus);
    exit;
}

Http::json(['success' => false, 'error' => 'Route not found: ' . $path], 404);

