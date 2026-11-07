<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/Config.php';

use Franchglobal\Config;

$pdo = new PDO(
    'mysql:host=' . (Config::get('DB_HOST', '127.0.0.1') ?: '127.0.0.1')
        . ';port=' . (Config::get('DB_PORT', '3306') ?: '3306')
        . ';dbname=' . (Config::get('DB_NAME', 'franchglobal') ?: 'franchglobal')
        . ';charset=utf8mb4',
    Config::get('DB_USER', 'root') ?: 'root',
    Config::get('DB_PASS', '') ?? ''
);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$email = 'sanjaypbiz15@gmail.com';
$stmt = $pdo->prepare('SELECT id, email, name, phone FROM customers_login WHERE email = :email LIMIT 1');
$stmt->execute(['email' => $email]);
$customer = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$customer) {
    fwrite(STDERR, "Customer not found: {$email}\n");
    exit(1);
}

$userId = (string) $customer['id'];
$countStmt = $pdo->query('SELECT COUNT(*) AS cnt FROM orders');
$orderNo = (int) ($countStmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0) + 1;

$razorpayOrderId = 'order_TEST_' . date('YmdHis');
$razorpayPaymentId = 'pay_TEST_' . date('YmdHis');

$payload = [
    'razorpay_order_id' => $razorpayOrderId,
    'razorpay_payment_id' => $razorpayPaymentId,
    'orderNo' => $orderNo,
    'userId' => $userId,
    'customerName' => $customer['name'] ?: 'Sanjay',
    'customerEmail' => $email,
    'customerPhone' => '9176164417',
    'email' => $email,
    'phone' => '9176164417',
    'name' => $customer['name'] ?: 'Sanjay',
    'address' => [
        'line1' => '12, Anna Nagar West',
        'line2' => 'Near Tower Park',
        'city' => 'Chennai',
        'state' => 'Tamil Nadu',
        'pincode' => '600040',
        'country' => 'India',
    ],
    'selectedAddress' => [
        'line1' => '12, Anna Nagar West',
        'line2' => 'Near Tower Park',
        'city' => 'Chennai',
        'state' => 'Tamil Nadu',
        'pincode' => '600040',
        'country' => 'India',
    ],
    'items' => [
        [
            'sku' => 'franch-oil-nh-plus',
            'title' => 'Franch Oil NH* Plus',
            'qty' => 1,
            'price' => 220,
            'total' => 220,
            'imageURL' => '/product-images/product-images/franch-oil-nh-plus/1.jpg',
        ],
    ],
    'cart' => [
        [
            'sku' => 'franch-oil-nh-plus',
            'title' => 'Franch Oil NH* Plus',
            'qty' => 1,
            'price' => 220,
        ],
    ],
    'totalAmount' => 220,
    'paymentStatus' => 'paid',
    'status' => 'success',
    'fulfillmentStatus' => 'placed',
    'awbNumber' => '',
    'trackingUrl' => '',
];

$firebaseId = 'order_test_' . bin2hex(random_bytes(6));
$now = date('Y-m-d H:i:s');

$insert = $pdo->prepare(
    'INSERT INTO orders (firebase_id, data_json, created_at, updated_at) VALUES (:firebase_id, :data_json, :created_at, :updated_at)'
);
$insert->execute([
    'firebase_id' => $firebaseId,
    'data_json' => json_encode($payload, JSON_UNESCAPED_SLASHES),
    'created_at' => $now,
    'updated_at' => $now,
]);

$orderId = (string) $pdo->lastInsertId();

// Optional payment row so admin Razorpay orders list shows it too
$payInsert = $pdo->prepare(
    'INSERT INTO payments (razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at, updated_at)
     VALUES (:oid, :pid, :sig, :amount, 1, :payload, :created_at, :updated_at)
     ON DUPLICATE KEY UPDATE razorpay_payment_id = VALUES(razorpay_payment_id), is_valid = 1, updated_at = VALUES(updated_at)'
);
$payPayload = [
    'name' => $payload['customerName'],
    'email' => $email,
    'phone' => '9176164417',
    'cart' => $payload['cart'],
    'selectedAddress' => $payload['selectedAddress'],
    'payment_status' => 'captured',
    'status' => 'success',
];
$payInsert->execute([
    'oid' => $razorpayOrderId,
    'pid' => $razorpayPaymentId,
    'sig' => 'test_signature_local',
    'amount' => 220,
    'payload' => json_encode($payPayload, JSON_UNESCAPED_SLASHES),
    'created_at' => $now,
    'updated_at' => $now,
]);

echo json_encode([
    'success' => true,
    'orderId' => $orderId,
    'orderNo' => $orderNo,
    'customerEmail' => $email,
    'customerId' => $userId,
    'razorpay_order_id' => $razorpayOrderId,
    'trackUrl' => 'http://localhost:5173/my-orders/' . $orderId,
    'loginEmail' => $email,
], JSON_PRETTY_PRINT) . PHP_EOL;
