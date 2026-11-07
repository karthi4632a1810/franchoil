<?php

declare(strict_types=1);

namespace Franchglobal;

use PDO;

final class CustomerDataRepository
{
    public static function ensureTables(PDO $pdo): void
    {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `customer_cart` (
              `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              `customer_id` BIGINT UNSIGNED NOT NULL,
              `product_id` VARCHAR(128) NOT NULL,
              `sku` VARCHAR(128) NOT NULL DEFAULT \'\',
              `title` VARCHAR(255) NOT NULL DEFAULT \'\',
              `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
              `image_url` VARCHAR(512) NOT NULL DEFAULT \'\',
              `qty` INT UNSIGNED NOT NULL DEFAULT 1,
              `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              UNIQUE KEY `uq_customer_cart_product` (`customer_id`, `product_id`),
              KEY `idx_customer_cart_customer` (`customer_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `customer_favorites` (
              `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              `customer_id` BIGINT UNSIGNED NOT NULL,
              `product_id` VARCHAR(128) NOT NULL,
              `sku` VARCHAR(128) NOT NULL DEFAULT \'\',
              `title` VARCHAR(255) NOT NULL DEFAULT \'\',
              `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
              `image_url` VARCHAR(512) NOT NULL DEFAULT \'\',
              `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              UNIQUE KEY `uq_customer_favorites_product` (`customer_id`, `product_id`),
              KEY `idx_customer_favorites_customer` (`customer_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    public static function listCart(PDO $pdo, int $customerId): array
    {
        self::ensureTables($pdo);
        $stmt = $pdo->prepare(
            'SELECT id, product_id, sku, title, price, image_url, qty, created_at, updated_at
             FROM customer_cart WHERE customer_id = :cid ORDER BY updated_at DESC'
        );
        $stmt->execute(['cid' => $customerId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map([self::class, 'mapCartRow'], $rows);
    }

    public static function replaceCart(PDO $pdo, int $customerId, array $items): array
    {
        self::ensureTables($pdo);
        $pdo->beginTransaction();
        try {
            $del = $pdo->prepare('DELETE FROM customer_cart WHERE customer_id = :cid');
            $del->execute(['cid' => $customerId]);

            $ins = $pdo->prepare(
                'INSERT INTO customer_cart (customer_id, product_id, sku, title, price, image_url, qty)
                 VALUES (:cid, :product_id, :sku, :title, :price, :image_url, :qty)'
            );

            foreach ($items as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $productId = trim((string) ($item['productId'] ?? ''));
                if ($productId === '') {
                    continue;
                }
                $ins->execute([
                    'cid' => $customerId,
                    'product_id' => $productId,
                    'sku' => trim((string) ($item['sku'] ?? '')),
                    'title' => trim((string) ($item['title'] ?? '')),
                    'price' => (float) ($item['price'] ?? 0),
                    'image_url' => trim((string) ($item['imageURL'] ?? $item['image_url'] ?? '')),
                    'qty' => max(1, (int) ($item['qty'] ?? 1)),
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return self::listCart($pdo, $customerId);
    }

    public static function upsertCartItem(PDO $pdo, int $customerId, array $item): array
    {
        self::ensureTables($pdo);
        $productId = trim((string) ($item['productId'] ?? ''));
        if ($productId === '') {
            return self::listCart($pdo, $customerId);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO customer_cart (customer_id, product_id, sku, title, price, image_url, qty)
             VALUES (:cid, :product_id, :sku, :title, :price, :image_url, :qty)
             ON DUPLICATE KEY UPDATE
               sku = VALUES(sku),
               title = VALUES(title),
               price = VALUES(price),
               image_url = VALUES(image_url),
               qty = VALUES(qty),
               updated_at = NOW()'
        );
        $stmt->execute([
            'cid' => $customerId,
            'product_id' => $productId,
            'sku' => trim((string) ($item['sku'] ?? '')),
            'title' => trim((string) ($item['title'] ?? '')),
            'price' => (float) ($item['price'] ?? 0),
            'image_url' => trim((string) ($item['imageURL'] ?? $item['image_url'] ?? '')),
            'qty' => max(1, (int) ($item['qty'] ?? 1)),
        ]);

        return self::listCart($pdo, $customerId);
    }

    public static function deleteCartItem(PDO $pdo, int $customerId, string $productId, ?int $lineId = null): array
    {
        self::ensureTables($pdo);
        if ($lineId !== null && $lineId > 0) {
            $stmt = $pdo->prepare('DELETE FROM customer_cart WHERE customer_id = :cid AND id = :id');
            $stmt->execute(['cid' => $customerId, 'id' => $lineId]);
        } elseif ($productId !== '') {
            $stmt = $pdo->prepare('DELETE FROM customer_cart WHERE customer_id = :cid AND product_id = :pid');
            $stmt->execute(['cid' => $customerId, 'pid' => $productId]);
        }

        return self::listCart($pdo, $customerId);
    }

    public static function listFavorites(PDO $pdo, int $customerId): array
    {
        self::ensureTables($pdo);
        $stmt = $pdo->prepare(
            'SELECT id, product_id, sku, title, price, image_url, created_at, updated_at
             FROM customer_favorites WHERE customer_id = :cid ORDER BY updated_at DESC'
        );
        $stmt->execute(['cid' => $customerId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map([self::class, 'mapFavoriteRow'], $rows);
    }

    public static function addFavorite(PDO $pdo, int $customerId, array $item): array
    {
        self::ensureTables($pdo);
        $productId = trim((string) ($item['productId'] ?? ''));
        if ($productId === '') {
            return self::listFavorites($pdo, $customerId);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO customer_favorites (customer_id, product_id, sku, title, price, image_url)
             VALUES (:cid, :product_id, :sku, :title, :price, :image_url)
             ON DUPLICATE KEY UPDATE
               sku = VALUES(sku),
               title = VALUES(title),
               price = VALUES(price),
               image_url = VALUES(image_url),
               updated_at = NOW()'
        );
        $stmt->execute([
            'cid' => $customerId,
            'product_id' => $productId,
            'sku' => trim((string) ($item['sku'] ?? '')),
            'title' => trim((string) ($item['title'] ?? '')),
            'price' => (float) ($item['price'] ?? 0),
            'image_url' => trim((string) ($item['imageURL'] ?? $item['image_url'] ?? '')),
        ]);

        return self::listFavorites($pdo, $customerId);
    }

    public static function removeFavorite(PDO $pdo, int $customerId, string $productId, ?int $lineId = null): array
    {
        self::ensureTables($pdo);
        if ($lineId !== null && $lineId > 0) {
            $stmt = $pdo->prepare('DELETE FROM customer_favorites WHERE customer_id = :cid AND id = :id');
            $stmt->execute(['cid' => $customerId, 'id' => $lineId]);
        } elseif ($productId !== '') {
            $stmt = $pdo->prepare('DELETE FROM customer_favorites WHERE customer_id = :cid AND product_id = :pid');
            $stmt->execute(['cid' => $customerId, 'pid' => $productId]);
        }

        return self::listFavorites($pdo, $customerId);
    }

    private static function mapCartRow(array $row): array
    {
        return [
            'id' => (string) ($row['id'] ?? ''),
            'productId' => (string) ($row['product_id'] ?? ''),
            'sku' => (string) ($row['sku'] ?? ''),
            'title' => (string) ($row['title'] ?? ''),
            'price' => (float) ($row['price'] ?? 0),
            'imageURL' => (string) ($row['image_url'] ?? ''),
            'qty' => (int) ($row['qty'] ?? 1),
            'createdAt' => $row['created_at'] ?? null,
        ];
    }

    private static function mapFavoriteRow(array $row): array
    {
        return [
            'id' => (string) ($row['id'] ?? ''),
            'productId' => (string) ($row['product_id'] ?? ''),
            'sku' => (string) ($row['sku'] ?? ''),
            'title' => (string) ($row['title'] ?? ''),
            'price' => (float) ($row['price'] ?? 0),
            'imageURL' => (string) ($row['image_url'] ?? ''),
            'createdAt' => $row['created_at'] ?? null,
        ];
    }
}
