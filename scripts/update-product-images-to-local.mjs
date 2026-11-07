import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const imagesRoot = path.join(repoRoot, "product-images", "product-images");
const mysqlExe = "C:\\xampp\\mysql\\bin\\mysql.exe";

const folderBySlug = {
  "franch-oil-nh-plus": "franch-oil-nh-plus",
  "franch-ayurveda-skin-soap": "franch-ayurveda-skin-soap",
  "omega-3": "omege-3",
  "franch-orthovin-thailam": "franch-orthovin-thailam",
  "landing-franch-oil-nh-plus-pack-of-2": "franch-oil-nh-plus",
};

function sqlEscape(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function sortImageNames(a, b) {
  const rx = /^(\d+)\.(jpg|jpeg|png|webp)$/i;
  const ma = a.match(rx);
  const mb = b.match(rx);
  if (ma && mb) {
    const na = Number(ma[1]);
    const nb = Number(mb[1]);
    if (na !== nb) return na - nb;
    // Prefer webp after the same index only if both exist
    if (ma[2].toLowerCase() === mb[2].toLowerCase()) return 0;
    if (ma[2].toLowerCase() === "webp") return 1;
    if (mb[2].toLowerCase() === "webp") return -1;
  }
  return a.localeCompare(b);
}

function loadImages(folderName) {
  const abs = path.join(imagesRoot, folderName);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => /\.(jpg|jpeg|png|webp)$/i.test(name))
    .sort(sortImageNames)
    .map((name) => `/product-images/product-images/${folderName}/${name}`);
}

const rowsRaw = execFileSync(
  mysqlExe,
  ["-u", "root", "-D", "franchglobal", "-N", "-e", "SELECT id,slug FROM products ORDER BY id;"],
  { encoding: "utf8" }
).trim();

const rows = rowsRaw
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [id, slug] = line.split("\t");
    return { id, slug };
  });

let updated = 0;
for (const row of rows) {
  const folder = folderBySlug[row.slug];
  if (!folder) {
    console.log(`skip ${row.id} (${row.slug}): no folder mapping`);
    continue;
  }

  const images = loadImages(folder);
  if (images.length === 0) {
    console.log(`skip ${row.id} (${row.slug}): no local images`);
    continue;
  }

  const imageURL = images[0];
  const imagesJson = JSON.stringify(images);

  const updateSql = `UPDATE products SET image_url='${sqlEscape(imageURL)}', images_json='${sqlEscape(imagesJson)}', updated_at=NOW() WHERE id=${Number(row.id)};`;
  execFileSync(mysqlExe, ["-u", "root", "-D", "franchglobal", "-e", updateSql], { encoding: "utf8" });
  console.log(`updated ${row.id} (${row.slug}) -> ${images.length} local images`);
  updated += 1;
}

console.log(`done. updated rows: ${updated}`);
