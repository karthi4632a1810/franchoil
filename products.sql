CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firebase_id VARCHAR(128) NULL,
  sku VARCHAR(191) NOT NULL UNIQUE,
  slug VARCHAR(191) NULL,
  title VARCHAR(255) NOT NULL,
  sub_title VARCHAR(255) NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_percent TINYINT UNSIGNED NULL DEFAULT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(120) NULL,
  image_url VARCHAR(500) NULL,
  images_json JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  KEY idx_products_category (category),
  KEY idx_products_active (active),
  KEY idx_products_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO products (
  firebase_id, sku, slug, title, sub_title, description, price, stock, category, image_url, images_json, active, created_at, updated_at
) VALUES (
  '60TbIHdbSiArXkExKiUJ',
  'franch-oil-nh-plus',
  'franch-oil-nh-plus',
  'Franch Oil NH* Plus',
  'Ayurvedic Product - 100 ML',
  'Our very first product, "Franch Oil NH* Plus", was invented in the year 1998, after rigorous bouts of research and testing, and was perfected over time. Thanks to our undying desire in creating products that are versatile and effective.

Franch Oil NH* Plus, is in essence, brewed with the natural Ayurvedic ingredients and rare herb extracts, making it a one-of-a-kind bottle of goodness. It primarily serves as a solution to negate pain and protect your skin.

The unique Ayurvedic formula of Franch Oil NH* Plus is formulated with the goodness Ricinus Cummunis Seed and Root, Krishna Tulsi, Almonds, Kumari Aloe Vera and Flax Seed, and is fortified with all medicinal properties.


Right from joint pain to cracked heels, the versatile and fortified formula of Franch Oil NH* Plus, helps in the treatment of 20+ ailments.',
  210.00,
  0,
  'Wellness',
  'https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291120340-81jNprNajBL._SL1500_.webp?alt=media&token=b0c7078c-795f-45f5-bb36-c99a59a46599',
  '["https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291102262-81CHQKVHJiL._SL1500_.webp?alt=media&token=9b21dc9e-7d5c-4d4b-bdb5-949f011df4f9","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291111942-61Gj%2B%2BfUHJL._SL1080_.webp?alt=media&token=0c53e63d-1e68-4641-a083-5d57973b9efe","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291118005-610ueVSjlpL._SL1500_.webp?alt=media&token=f9e35d14-b20e-4c59-be05-d2fc5e603dbf","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291118665-81-uLyaQ5kL._SL1500_.webp?alt=media&token=6da05a58-24ad-413e-9e7c-ee79b0d0a88c","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291119513-81SagYMjVZL._SL1500_.webp?alt=media&token=6325058d-0bcf-4c69-b303-29876b4b1769","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291120340-81jNprNajBL._SL1500_.webp?alt=media&token=b0c7078c-795f-45f5-bb36-c99a59a46599"]',
  1,
  '2025-08-17 15:47:52',
  '2025-10-12 23:15:25'
)
ON DUPLICATE KEY UPDATE
  firebase_id = VALUES(firebase_id),
  slug = VALUES(slug),
  title = VALUES(title),
  sub_title = VALUES(sub_title),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  category = VALUES(category),
  image_url = VALUES(image_url),
  images_json = VALUES(images_json),
  active = VALUES(active),
  updated_at = VALUES(updated_at);

INSERT INTO products (
  firebase_id, sku, slug, title, sub_title, description, price, stock, category, image_url, images_json, active, created_at, updated_at
) VALUES (
  'RNd3gdknYlM4r6moZJbN',
  'franch-ayurveda-skin-soap',
  'franch-ayurveda-skin-soap',
  'Franch Ayurveda Clear Skin Soap',
  'Soap 100 GM',
  'GLOWING AND HEALTHY SKIN: Our Franch Ayurveda Clear Skin Soap goes beyond the ordinary, offering a unique formulation that specifically targets the attainment of glowing and healthy skin. The term "glowing" encapsulates the idea of skin radiance and luminosity, and this soap is designed to impart a natural, litfrom-within glow to your complexion.

NATURAL INGREDIENTS: Immerse yourself in the goodness of nature with a soap enriched with a blend of natural ingredients. These ingredients are carefully chosen for their skin-loving properties, ensuring a gentle and nourishing cleanse.

SUITABLE FOR MEN AND WOMEN: The Franch Ayurveda Clear Skin Soap has been meticulously crafted to be suitable for both men and women, catering to the diverse skincare needs of individuals across genders. This inclusivity is a testament to the thoughtfulness behind the formulation, ensuring that everyone can experience the rejuvenating benefits of this soap.

SUITABLE FOR ALL SKIN TYPES: This soap is crafted to suit the needs of all skin types. Experience the harmonious balance of Ayurveda for skin that feels cared for and rejuvenated.

PREMIUM QUALITY: Made using 100% plant based and all natural ingredients.',
  60.00,
  10,
  'Soaps',
  'https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-ayurveda-skin-soap%2F1760291343196-71GJbBW7REL._SL1500_.webp?alt=media&token=4431a577-68e5-458a-a9cc-79fae137917f',
  '["https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-ayurveda-skin-soap%2F1760005459476-p-5.jpg?alt=media&token=5d2737cf-0fe7-4907-b4ed-fe432d61418c","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-ayurveda-skin-soap%2F1760291220704-71YdHdR8fWL._SL1500_.webp?alt=media&token=839f0e56-9406-446f-a944-51c0ec184315","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-ayurveda-skin-soap%2F1760291221345-81eZPpBgO6L._SL1500_.webp?alt=media&token=5e2da463-171e-49cb-af91-c78994a47914","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-ayurveda-skin-soap%2F1760291222085-718jfU2SBdL._SL1500_.webp?alt=media&token=2871913e-a45f-4f00-ab8b-fa934780d4e4","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-ayurveda-skin-soap%2F1760291222908-813Ajk2TBlL._SL1500_.webp?alt=media&token=ffe47ff5-68b4-45c2-90dc-ebfecbf84f6d","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-ayurveda-skin-soap%2F1760291343196-71GJbBW7REL._SL1500_.webp?alt=media&token=4431a577-68e5-458a-a9cc-79fae137917f"]',
  1,
  '2025-08-17 15:47:51',
  '2025-10-12 23:19:09'
)
ON DUPLICATE KEY UPDATE
  firebase_id = VALUES(firebase_id),
  slug = VALUES(slug),
  title = VALUES(title),
  sub_title = VALUES(sub_title),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  category = VALUES(category),
  image_url = VALUES(image_url),
  images_json = VALUES(images_json),
  active = VALUES(active),
  updated_at = VALUES(updated_at);

INSERT INTO products (
  firebase_id, sku, slug, title, sub_title, description, price, stock, category, image_url, images_json, active, created_at, updated_at
) VALUES (
  'asnVTJUiAq9H8xilOFHu',
  'omega-3',
  'omega-3',
  'OG-3 Veg',
  'Ayurvedic Proprietary',
  'Now more than ever, the importance of boosting your immune system is of prime importance, and OG-3 Veg is specifically engineered to do just that!

OG-3 Veg is an Omega-3 nutritional supplement, that consists of Alpha Linolenic Acid, Oleic Acid, Linolenic Acid, Beta Carotene and Natural Mixed Tocopherol.

Through extensive research, we can proudly conclude that, this product contains the essential components of unsaturated fatty acids that are vital in the dietary and tissue biosynthesis mechanisms.

The OG-3 Veg serve as a remedy against:

Immune Disorders
Cardiovascular Problems
Headaches
Diabetes
Asthma
Joint and Muscle Problems
Premenstrual Syndrome
Allergies
Inflammation
Irritable Bowel Syndrome
Skin Problems
Urinary-tract Problems. ',
  360.00,
  10,
  'Wellness',
  'https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760005663897-p-4.jpg?alt=media&token=0d3b82df-1aa8-4cb6-9f5f-e6ec1a40abcf',
  '["https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760005663897-p-4.jpg?alt=media&token=0d3b82df-1aa8-4cb6-9f5f-e6ec1a40abcf","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760291461321-71QtcbkgnZL._SL1500_.webp?alt=media&token=25c2314d-cdab-400e-a163-b48a43a51a69","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760291472801-7176zM3fWFL._SL1500_.webp?alt=media&token=11ec17cd-da79-4ad1-a4bd-0a005cf4492f","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760291473660-71YOGguxxBL._SL1280_.webp?alt=media&token=e35bbbfc-ef85-433b-bb69-28a9f0c201e9","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760291474403-61vYoub1azL._SL1280_.webp?alt=media&token=a452ffe3-f57e-4dd5-8ed7-43a0695da443","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760291475075-61VEEAdvikL._SL1080_.webp?alt=media&token=bcefce2a-4d73-4d98-8e95-0656f29446d4","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Fomege-3%2F1760291475686-61V0yOs37aL._SL1500_.webp?alt=media&token=23865e03-96d3-4ace-9c74-ea1a1ba316dd"]',
  1,
  '2025-08-17 15:47:51',
  '2025-10-13 21:16:02'
)
ON DUPLICATE KEY UPDATE
  firebase_id = VALUES(firebase_id),
  slug = VALUES(slug),
  title = VALUES(title),
  sub_title = VALUES(sub_title),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  category = VALUES(category),
  image_url = VALUES(image_url),
  images_json = VALUES(images_json),
  active = VALUES(active),
  updated_at = VALUES(updated_at);

INSERT INTO products (
  firebase_id, sku, slug, title, sub_title, description, price, stock, category, image_url, images_json, active, created_at, updated_at
) VALUES (
  'fcrb3N0Lt7YPjK7UTX39',
  'franch-orthovin-thailam',
  'franch-orthovin-thailam',
  'Franch Orthovin Thailam',
  '60 ML - Ayurvedic Product',
  'QUICK RELIEF FROM ARTHRITIC PAIN: Orthovin Thailam enhances blood circulation by stimulating the nerves of the affected area resulting in faster healing.
NATURAL PAIN RELIEF: Packed with the goodness of Ayurvedic herbal Extract is a 100% natural pain relief oil for arthritis  knee pain, arthritis  joint pain, arthritis back pain, arthritis  upper back pain, arthritis  neck pain, arthritis  frozen shoulder, tennis elbow, musculoskeletal stiffness and pain, sprains and spasms.
100% NATURAL AUTHENTIC AYURVEDIC HERBS: Our Orthovin Thailam is enriched with herbs like Withania somnifera, Vitex negundo, Acorus calamus, Saussurea lappa, Vitis quadrangularis, Devadaru, Camphora officinarum and Eucalyptus globulus that work together to help alleviate arthritis knee pain and arthritis  joint discomfort.
RELIEVE PAIN EFFORTLESSLY: Orthovin offers a non-greasy, fastabsorbing formula that leaves no sticky residue. Easy to apply with no heating needed. Simply massage the oil onto the affected area for quick and effective relief.
SAFE AND EFFECTIVE FOR ALL AGES: Our Orthovin Thailam is safe and effective for people of all ages, including adults, children and pregnant women.',
  180.00,
  10,
  'Wellness',
  'https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-orthovin-thailam%2F1760005682556-p-2.jpg?alt=media&token=98651a2f-fcbb-4791-bcb3-02de857fd395',
  '["https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-orthovin-thailam%2F1760005682556-p-2.jpg?alt=media&token=98651a2f-fcbb-4791-bcb3-02de857fd395","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-orthovin-thailam%2F1760291667822-61CEOxfnx4L._SL1000_.webp?alt=media&token=218889a2-74cf-499c-9da7-5349a2416baa","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-orthovin-thailam%2F1760291677326-51W%2BSg158nL._SL1248_.webp?alt=media&token=06fe41d4-05d5-43cb-ac7e-4e38268bce12","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-orthovin-thailam%2F1760291677881-51KLtnGzDyL._SL1241_.webp?alt=media&token=42fdfd91-7783-40d7-8a25-2bf98c3cc919","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-orthovin-thailam%2F1760291678496-61tSJNDo6eL._SL1244_.webp?alt=media&token=dea3e3d1-2d79-48c2-9a1e-1961c4dc0529"]',
  1,
  '2025-08-17 15:47:51',
  '2025-10-12 23:28:31'
)
ON DUPLICATE KEY UPDATE
  firebase_id = VALUES(firebase_id),
  slug = VALUES(slug),
  title = VALUES(title),
  sub_title = VALUES(sub_title),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  category = VALUES(category),
  image_url = VALUES(image_url),
  images_json = VALUES(images_json),
  active = VALUES(active),
  updated_at = VALUES(updated_at);

INSERT INTO products (
  firebase_id, sku, slug, title, sub_title, description, price, stock, category, image_url, images_json, active, created_at, updated_at
) VALUES (
  'ohVpHawuqQk38BENvo2o',
  'landing-franch-oil-nh-plus-pack-of-2',
  'landing-franch-oil-nh-plus-pack-of-2',
  'Franch Oil NH* Plus | Multipurpose Healing Oil - Stretch Marks, Small Burns, Scars, Aches & Pains - 100 ML (Pack of 2)',
  '₹190 + ₹190 = ₹380',
  'Our very first product, "Franch Oil NH* Plus", was invented in the year 1998, after rigorous bouts of research and testing, and was perfected over time. Thanks to our undying desire in creating products that are versatile and effective.

Franch Oil NH* Plus, is in essence, brewed with the natural Ayurvedic ingredients and rare herb extracts, making it a one-of-a-kind bottle of goodness. It primarily serves as a solution to negate pain and protect your skin.

The unique Ayurvedic formula of Franch Oil NH* Plus is formulated with the goodness Ricinus Cummunis Seed and Root, Krishna Tulsi, Almonds, Kumari Aloe Vera and Flax Seed, and is fortified with all medicinal properties.


Right from joint pain to cracked heels, the versatile and fortified formula of Franch Oil NH* Plus, helps in the treatment of 20+ ailments.',
  190.00,
  0,
  'Wellness',
  '/images/product/landing/fnh-plus-pack-of-2.jpg',
  '["/images/product/landing/fnh-plus-pack-of-2.jpg","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291111942-61Gj%2B%2BfUHJL._SL1080_.webp?alt=media&token=0c53e63d-1e68-4641-a083-5d57973b9efe","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291118005-610ueVSjlpL._SL1500_.webp?alt=media&token=f9e35d14-b20e-4c59-be05-d2fc5e603dbf","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291118665-81-uLyaQ5kL._SL1500_.webp?alt=media&token=6da05a58-24ad-413e-9e7c-ee79b0d0a88c","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291119513-81SagYMjVZL._SL1500_.webp?alt=media&token=6325058d-0bcf-4c69-b303-29876b4b1769","https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291120340-81jNprNajBL._SL1500_.webp?alt=media&token=b0c7078c-795f-45f5-bb36-c99a59a46599"]',
  0,
  '2025-11-07 19:18:04',
  '2026-03-08 11:20:16'
)
ON DUPLICATE KEY UPDATE
  firebase_id = VALUES(firebase_id),
  slug = VALUES(slug),
  title = VALUES(title),
  sub_title = VALUES(sub_title),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  category = VALUES(category),
  image_url = VALUES(image_url),
  images_json = VALUES(images_json),
  active = VALUES(active),
  updated_at = VALUES(updated_at);

