-- =============================================================================
-- Franch Global — Live database update (run once on production MySQL)
-- Safe to re-run: uses IF NOT EXISTS and checks before ALTER.
--
-- HOSTINGER / phpMyAdmin — IMPORTANT:
--   1. Do NOT use "USE franchglobal" — your DB is often u157995270_franchglobal
--   2. In phpMyAdmin, click YOUR database in the left sidebar first
--      (e.g. u157995270_franchglobal — same name as in backend-php .env DB_NAME)
--   3. Open the SQL tab, paste this file, then click Go
--
-- Error #1044 "Access denied to database franchglobal" = wrong DB selected
--   or this file tried USE franchglobal. Select your real DB in the left menu.
--
-- What this does NOT change:
--   • `orders` table — tracking/email fields live inside `data_json` (no new columns)
-- =============================================================================

-- (No USE statement — run while your Hostinger database is already selected)

-- -----------------------------------------------------------------------------
-- 1) Customer login (website accounts + saved addresses)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers_login` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `phone` VARCHAR(32) NOT NULL DEFAULT '',
  `photo_url` VARCHAR(512) NOT NULL DEFAULT '',
  `address_json` LONGTEXT NULL,
  `google_sub` VARCHAR(128) NULL,
  `auth_provider` VARCHAR(32) NOT NULL DEFAULT 'password',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customers_login_email` (`email`),
  UNIQUE KEY `uq_customers_login_google_sub` (`google_sub`),
  KEY `idx_customers_login_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add columns if `customers_login` already existed from an older schema
SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customers_login' AND COLUMN_NAME = 'address_json') = 0,
  'ALTER TABLE `customers_login` ADD COLUMN `address_json` LONGTEXT NULL AFTER `photo_url`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customers_login' AND COLUMN_NAME = 'google_sub') = 0,
  'ALTER TABLE `customers_login` ADD COLUMN `google_sub` VARCHAR(128) NULL AFTER `address_json`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customers_login' AND COLUMN_NAME = 'auth_provider') = 0,
  'ALTER TABLE `customers_login` ADD COLUMN `auth_provider` VARCHAR(32) NOT NULL DEFAULT ''password'' AFTER `google_sub`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customers_login' AND COLUMN_NAME = 'last_login_at') = 0,
  'ALTER TABLE `customers_login` ADD COLUMN `last_login_at` DATETIME NULL AFTER `is_active`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 2) Logged-in customer cart & favorites (sync across devices)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3) Product MRP / discount % (product cards & PDP)
-- -----------------------------------------------------------------------------
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products') > 0
  AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'original_price') = 0,
  'ALTER TABLE `products` ADD COLUMN `original_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `price`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products') > 0
  AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'discount_percent') = 0,
  'ALTER TABLE `products` ADD COLUMN `discount_percent` TINYINT UNSIGNED NULL DEFAULT NULL AFTER `original_price`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 4) Razorpay order snapshots (admin orders sync — skip if you already have it)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `razorpay_order_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `razorpay_order_id` VARCHAR(100) NOT NULL,
  `payload_json` JSON NOT NULL,
  `fetched_at` DATETIME NOT NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rzp_order_snapshot` (`razorpay_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Done. Order tracking + placed/shipped emails use `payments.payload_json` keys:
-- fulfillmentStatus, awbNumber, trackingUrl, placedEmailSent (no `orders` table).
--
-- Optional in server .env (not SQL):
-- TRACKING_FEATURE_START_AT=2026-06-02 00:00:00
-- → tracking + status emails in admin only for payments created_at >= that time.
-- Customer "My orders" list uses the same cutoff. Leave empty = all paid orders.
-- =============================================================================
