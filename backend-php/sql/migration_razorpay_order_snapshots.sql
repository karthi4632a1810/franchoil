-- Run once if database already exists without this table.
CREATE TABLE IF NOT EXISTS `razorpay_order_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `razorpay_order_id` VARCHAR(100) NOT NULL,
  `payload_json` JSON NOT NULL,
  `fetched_at` DATETIME NOT NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rzp_order_snapshot` (`razorpay_order_id`)
);
