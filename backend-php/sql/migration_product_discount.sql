-- MRP (original) and discount % for product cards and PDP
-- Special Discount Offer: is_discount_enabled, discount_tag, discount_badge_label, discount_price, discount_strike_price
-- Run once, or rely on ensureProductsDiscountSchema() in index.php on first product API call.
ALTER TABLE products
  ADD COLUMN original_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER price;

ALTER TABLE products
  ADD COLUMN discount_percent TINYINT UNSIGNED NULL DEFAULT NULL AFTER original_price;

ALTER TABLE products
  ADD COLUMN is_discount_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER discount_percent;

ALTER TABLE products
  ADD COLUMN discount_tag VARCHAR(100) NULL DEFAULT NULL AFTER is_discount_enabled;

ALTER TABLE products
  ADD COLUMN discount_badge_label VARCHAR(100) NULL DEFAULT 'SPECIAL OFFER' AFTER discount_tag;

ALTER TABLE products
  ADD COLUMN discount_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_badge_label;

ALTER TABLE products
  ADD COLUMN discount_strike_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_price;
