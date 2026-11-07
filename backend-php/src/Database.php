<?php

declare(strict_types=1);

namespace Franchglobal;

use PDO;
use PDOException;

final class Database
{
    public static function pdo(): PDO
    {
        $host = Config::get('DB_HOST', '127.0.0.1');
        $port = Config::get('DB_PORT', '3306');
        $name = Config::get('DB_NAME', 'franchglobal');
        $user = Config::get('DB_USER', 'root');
        $pass = Config::get('DB_PASS', '');
        $dbTimeZone = Config::get('DB_TIMEZONE', '+05:30');

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

        try {
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            // Force DB session timezone to IST by default for NOW()/CURRENT_TIMESTAMP writes.
            $pdo->exec("SET time_zone = " . $pdo->quote((string) $dbTimeZone));
            return $pdo;
        } catch (PDOException $e) {
            throw new PDOException('Database connection failed: ' . $e->getMessage(), (int) $e->getCode());
        }
    }
}

