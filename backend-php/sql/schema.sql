CREATE DATABASE IF NOT EXISTS `franchglobal` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `franchglobal`;

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

CREATE TABLE IF NOT EXISTS `admin_login` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `password_hash` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_login_admin_id` (`admin_id`),
  UNIQUE KEY `uq_admin_login_email` (`email`),
  KEY `idx_admin_login_active` (`is_active`)
);

CREATE TABLE IF NOT EXISTS `order_initiations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `razorpay_order_id` VARCHAR(100) NOT NULL,
  `order_ref` VARCHAR(100) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payload_json` JSON NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_initiation_rz_order` (`razorpay_order_id`)
);

CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `razorpay_order_id` VARCHAR(100) NOT NULL,
  `razorpay_payment_id` VARCHAR(100) DEFAULT NULL,
  `razorpay_signature` VARCHAR(255) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `is_valid` TINYINT(1) NOT NULL DEFAULT 0,
  `payload_json` JSON NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_rz_order` (`razorpay_order_id`)
);

CREATE TABLE IF NOT EXISTS `razorpay_webhooks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(80) NOT NULL,
  `entity_id` VARCHAR(120) DEFAULT NULL,
  `signature` VARCHAR(255) DEFAULT NULL,
  `signature_valid` TINYINT(1) NOT NULL DEFAULT 0,
  `payload_json` JSON NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_webhook_event_type` (`event_type`),
  KEY `idx_webhook_entity_id` (`entity_id`)
);

CREATE TABLE IF NOT EXISTS `razorpay_order_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `razorpay_order_id` VARCHAR(100) NOT NULL,
  `payload_json` JSON NOT NULL,
  `fetched_at` DATETIME NOT NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rzp_order_snapshot` (`razorpay_order_id`)
);

