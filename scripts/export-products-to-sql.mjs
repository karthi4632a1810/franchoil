import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const ROOT = process.cwd();
const OUT_SQL_PATH = path.join(ROOT, "products.sql");

const fail = (msg) => {
  console.error(`\n[export-products-to-sql] ${msg}\n`);
  process.exit(1);
};

const resolveServiceAccountPath = () => {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (envPath) {
    const abs = path.isAbsolute(envPath) ? envPath : path.join(ROOT, envPath);
    if (fs.existsSync(abs)) return abs;
  }

  const rootDefault = path.join(ROOT, "serviceAccount.json");
  if (fs.existsSync(rootDefault)) return rootDefault;

  const keyDir = path.join(ROOT, "firebase-private-key");
  if (fs.existsSync(keyDir)) {
    const firstJson = fs
      .readdirSync(keyDir)
      .filter((f) => f.toLowerCase().endsWith(".json"))
      .sort()[0];
    if (firstJson) return path.join(keyDir, firstJson);
  }

  return null;
};

const SERVICE_ACCOUNT_PATH = resolveServiceAccountPath();
if (!SERVICE_ACCOUNT_PATH) {
  fail(
    `Missing service account file. Provide one of these:\n` +
      `1) ./serviceAccount.json\n` +
      `2) ./firebase-private-key/*.json\n` +
      `3) FIREBASE_SERVICE_ACCOUNT_PATH env var`
  );
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const esc = (val) => {
  if (val === null || val === undefined) return "NULL";
  const str = String(val).replace(/\\/g, "\\\\").replace(/'/g, "''");
  return `'${str}'`;
};

const toDecimal = (n) => {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
};

const toInt = (n, fallback = 0) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.trunc(v) : fallback;
};

const toDateTime = (v) => {
  if (!v) return null;
  let d = null;
  if (typeof v?.toDate === "function") d = v.toDate();
  else d = new Date(v);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

const getSku = (p, id) =>
  p.sku || p.itemCode || p.code || p.slug || p.productId || id;

const getImages = (p) => {
  if (Array.isArray(p.images)) return p.images.filter(Boolean);
  if (typeof p.images === "string" && p.images.trim()) {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return [p.images];
    }
  }
  return [];
};

const main = async () => {
  const snap = await db.collection("products").get();
  const docs = snap.docs.map((d) => ({ firebase_id: d.id, ...d.data() }));

  let sql = "";
  sql += `CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firebase_id VARCHAR(128) NULL,
  sku VARCHAR(191) NOT NULL UNIQUE,
  slug VARCHAR(191) NULL,
  title VARCHAR(255) NOT NULL,
  sub_title VARCHAR(255) NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
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

`;

  for (const p of docs) {
    const sku = getSku(p, p.firebase_id);
    const images = getImages(p);
    const imageURL = p.imageURL || p.image_url || images[0] || "";
    const slug = p.slug || String(sku).toLowerCase();

    sql += `INSERT INTO products (
  firebase_id, sku, slug, title, sub_title, description, price, stock, category, image_url, images_json, active, created_at, updated_at
) VALUES (
  ${esc(p.firebase_id)},
  ${esc(sku)},
  ${esc(slug)},
  ${esc(p.title || "")},
  ${esc(p.subTitle || p.sub_title || "")},
  ${esc(p.description || "")},
  ${toDecimal(p.price)},
  ${toInt(p.stock, 0)},
  ${esc(p.category || "")},
  ${esc(imageURL)},
  ${esc(JSON.stringify(images))},
  ${p.active === false ? 0 : 1},
  ${esc(toDateTime(p.createdAt))},
  ${esc(toDateTime(p.updatedAt))}
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

`;
  }

  fs.writeFileSync(OUT_SQL_PATH, sql, "utf8");
  console.log(
    `[export-products-to-sql] Exported ${docs.length} products to ${OUT_SQL_PATH}`
  );
};

main().catch((err) => {
  fail(err?.stack || err?.message || String(err));
});

