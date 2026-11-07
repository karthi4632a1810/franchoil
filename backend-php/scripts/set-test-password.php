<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/Config.php';

use Franchglobal\Config;

$email = $argv[1] ?? 'sanjaypbiz15@gmail.com';
$password = $argv[2] ?? 'Test@1234';

$pdo = new PDO(
    'mysql:host=' . (Config::get('DB_HOST', '127.0.0.1') ?: '127.0.0.1') . ';dbname=' . (Config::get('DB_NAME', 'franchglobal') ?: 'franchglobal'),
    Config::get('DB_USER', 'root') ?: 'root',
    Config::get('DB_PASS', '') ?? ''
);

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE customers_login SET password_hash = :h WHERE email = :e');
$stmt->execute(['h' => $hash, 'e' => $email]);
echo "Updated {$stmt->rowCount()} row(s) for {$email}\n";
