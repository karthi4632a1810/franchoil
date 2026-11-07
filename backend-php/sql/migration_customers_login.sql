-- Customer website login (separate from legacy `users` / Firebase rows)
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
