-- Cart & favorites for logged-in customers (sync across browsers/devices)
USE `franchglobal`;

CREATE TABLE IF NOT EXISTS `customer_cart` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `product_id` VARCHAR(128) NOT NULL,
  `sku` VARCHAR(128) NOT NULL DEFAULT '',
  `title` VARCHAR(255) NOT NULL DEFAULT '',
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image_url` VARCHAR(512) NOT NULL DEFAULT '',
  `qty` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_cart_product` (`customer_id`, `product_id`),
  KEY `idx_customer_cart_customer` (`customer_id`),
  CONSTRAINT `fk_customer_cart_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers_login` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `product_id` VARCHAR(128) NOT NULL,
  `sku` VARCHAR(128) NOT NULL DEFAULT '',
  `title` VARCHAR(255) NOT NULL DEFAULT '',
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image_url` VARCHAR(512) NOT NULL DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_favorites_product` (`customer_id`, `product_id`),
  KEY `idx_customer_favorites_customer` (`customer_id`),
  CONSTRAINT `fk_customer_favorites_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers_login` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
