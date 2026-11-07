import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const ROOT = process.cwd();
const OUT_SQL_PATH = path.join(ROOT, "firestore-all-data.sql");
const EXCLUDED_COLLECTIONS = new Set(["visits", "pageVisits", "counters"]);

const fail = (msg) => {
  console.error(`\n[export-firestore-all-to-sql] ${msg}\n`);
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

const esc = (val) => {
  if (val === null || val === undefined) return "NULL";
  const str = String(val).replace(/\\/g, "\\\\").replace(/'/g, "''");
  return `'${str}'`;
};

const toDateObj = (v) => {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return Number.isNaN(d?.getTime?.()) ? null : d;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toDateTime = (v) => {
  const d = toDateObj(v);
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

const toDecimal = (n) => {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
};

const toInt = (n, fallback = 0) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.trunc(v) : fallback;
};

const toJson = (v) => {
  try {
    return JSON.stringify(v ?? null);
  } catch {
    return JSON.stringify(null);
  }
};

const sanitizeTableName = (name) => name.replace(/[^a-zA-Z0-9_]/g, "_");

const buildProductsSql = (docs) => {
  let sql = `CREATE TABLE IF NOT EXISTS products (
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
  data_json JSON NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  KEY idx_products_category (category),
  KEY idx_products_active (active),
  KEY idx_products_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  for (const p of docs) {
    const sku =
      p.sku || p.itemCode || p.code || p.slug || p.productId || p.firebase_id;
    const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const imageURL = p.imageURL || p.image_url || images[0] || "";
    const slug = p.slug || String(sku).toLowerCase();

    sql += `INSERT INTO products (
  firebase_id, sku, slug, title, sub_title, description, price, stock, category, image_url, images_json, active, data_json, created_at, updated_at
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
  ${esc(toJson(images))},
  ${p.active === false ? 0 : 1},
  ${esc(toJson(p))},
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
  data_json = VALUES(data_json),
  updated_at = VALUES(updated_at);

`;
  }

  return sql;
};

const buildOrderInitiationsSql = (docs) => {
  let sql = `CREATE TABLE IF NOT EXISTS order_initiations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razorpay_order_id VARCHAR(100) NOT NULL,
  order_ref VARCHAR(100) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payload_json JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_order_initiation_rz_order (razorpay_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  for (const d of docs) {
    const rz = d.razorpay_order_id || d.firebase_id;
    sql += `INSERT INTO order_initiations
(razorpay_order_id, order_ref, amount, payload_json, created_at, updated_at)
VALUES
(${esc(rz)}, ${esc(d.orderId || d.order_ref || null)}, ${toDecimal(d.amount)}, ${esc(toJson(d))}, ${esc(toDateTime(d.createdAt) || toDateTime(new Date()))}, ${esc(toDateTime(d.updatedAt))})
ON DUPLICATE KEY UPDATE
  order_ref = VALUES(order_ref),
  amount = VALUES(amount),
  payload_json = VALUES(payload_json),
  updated_at = VALUES(updated_at);

`;
  }
  return sql;
};

const buildPaymentsSql = (docs) => {
  let sql = `CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razorpay_order_id VARCHAR(100) NOT NULL,
  razorpay_payment_id VARCHAR(100) DEFAULT NULL,
  razorpay_signature VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_valid TINYINT(1) NOT NULL DEFAULT 0,
  payload_json JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_payment_rz_order (razorpay_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  for (const d of docs) {
    const rz = d.razorpay_order_id || d.firebase_id;
    sql += `INSERT INTO payments
(razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, is_valid, payload_json, created_at, updated_at)
VALUES
(${esc(rz)}, ${esc(d.razorpay_payment_id || null)}, ${esc(d.razorpay_signature || null)}, ${toDecimal(d.amount)}, ${d.isValid || d.is_valid ? 1 : 0}, ${esc(toJson(d))}, ${esc(toDateTime(d.createdAt) || toDateTime(new Date()))}, ${esc(toDateTime(d.updatedAt))})
ON DUPLICATE KEY UPDATE
  razorpay_payment_id = VALUES(razorpay_payment_id),
  razorpay_signature = VALUES(razorpay_signature),
  amount = VALUES(amount),
  is_valid = VALUES(is_valid),
  payload_json = VALUES(payload_json),
  updated_at = VALUES(updated_at);

`;
  }
  return sql;
};

const buildRazorpayWebhooksSql = (docs) => {
  let sql = `CREATE TABLE IF NOT EXISTS razorpay_webhooks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) DEFAULT NULL,
  signature VARCHAR(255) DEFAULT NULL,
  signature_valid TINYINT(1) NOT NULL DEFAULT 0,
  payload_json JSON NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_webhook_event_type (event_type),
  KEY idx_webhook_entity_id (entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  for (const d of docs) {
    const eventType = d.event_type || d.event || "unknown";
    const entityId = d.entity_id || d.id || d.firebase_id || null;
    sql += `INSERT INTO razorpay_webhooks
(event_type, entity_id, signature, signature_valid, payload_json, created_at)
VALUES
(${esc(eventType)}, ${esc(entityId)}, ${esc(d.signature || null)}, ${d.signature_valid ? 1 : 0}, ${esc(toJson(d))}, ${esc(toDateTime(d.received_at || d.createdAt) || toDateTime(new Date()))});

`;
  }
  return sql;
};

const buildGenericCollectionSql = (collectionName, docs) => {
  const table = sanitizeTableName(collectionName);
  let sql = `CREATE TABLE IF NOT EXISTS \`${table}\` (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firebase_id VARCHAR(128) NOT NULL UNIQUE,
  data_json JSON NOT NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  for (const d of docs) {
    sql += `INSERT INTO \`${table}\` (firebase_id, data_json, created_at, updated_at)
VALUES (${esc(d.firebase_id)}, ${esc(toJson(d))}, ${esc(toDateTime(d.createdAt))}, ${esc(toDateTime(d.updatedAt))})
ON DUPLICATE KEY UPDATE
  data_json = VALUES(data_json),
  created_at = VALUES(created_at),
  updated_at = VALUES(updated_at);

`;
  }
  return sql;
};

const buildCollectionSql = (collectionName, docs) => {
  switch (collectionName) {
    case "products":
      return buildProductsSql(docs);
    case "order_initiations":
      return buildOrderInitiationsSql(docs);
    case "payments":
      return buildPaymentsSql(docs);
    case "razorpay_webhooks":
      return buildRazorpayWebhooksSql(docs);
    default:
      return buildGenericCollectionSql(collectionName, docs);
  }
};

const main = async () => {
  const serviceAccountPath = resolveServiceAccountPath();
  if (!serviceAccountPath) {
    fail(
      "Missing service account file. Use ./serviceAccount.json or ./firebase-private-key/*.json or FIREBASE_SERVICE_ACCOUNT_PATH."
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  const collections = await db.listCollections();
  const selected = collections.filter((c) => !EXCLUDED_COLLECTIONS.has(c.id));

  let sql = "-- Firestore full export (excluding visits, pageVisits, counters)\n";
  sql += "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n";

  for (const col of selected) {
    const snap = await col.get();
    const docs = snap.docs.map((d) => ({ firebase_id: d.id, ...d.data() }));
    sql += `-- Collection: ${col.id} (${docs.length} docs)\n`;
    sql += buildCollectionSql(col.id, docs);
    sql += "\n";
    console.log(`[export-firestore-all-to-sql] ${col.id}: ${docs.length} docs`);
  }

  sql += "SET FOREIGN_KEY_CHECKS=1;\n";
  fs.writeFileSync(OUT_SQL_PATH, sql, "utf8");
  console.log(
    `[export-firestore-all-to-sql] Done. SQL written to ${OUT_SQL_PATH}`
  );
};

main().catch((err) => {
  fail(err?.stack || err?.message || String(err));
});

