import { isFranchOilSku } from "./franchOilCart";

export const FRANCH_OIL_PAGE_BANNERS = [
  "/product-page-banners/franch-oil/1.png",
  "/product-page-banners/franch-oil/2.png",
  "/product-page-banners/franch-oil/3.png",
  "/product-page-banners/franch-oil/4.png",
  "/product-page-banners/franch-oil/5.png",
];

export const OMEGA_3_PAGE_BANNERS = [
  "/product-page-banners/omega-3/1.png",
  "/product-page-banners/omega-3/2.png",
  "/product-page-banners/omega-3/3.png",
  "/product-page-banners/omega-3/4.png",
];

export const ORTHOVIN_PAGE_BANNERS = [
  "/product-page-banners/orthovin/1.png",
  "/product-page-banners/orthovin/2.png",
  "/product-page-banners/orthovin/3.png",
];

export const SKIN_SOAP_PAGE_BANNERS = [
  "/product-page-banners/franch-soap/1.png",
  "/product-page-banners/franch-soap/2.png",
  "/product-page-banners/franch-soap/3.png",
  "/product-page-banners/franch-soap/4.png",
];

const PRODUCT_PAGE_BANNERS_BY_SKU = {
  "omega-3": OMEGA_3_PAGE_BANNERS,
  "franch-orthovin-thailam": ORTHOVIN_PAGE_BANNERS,
  "franch-ayurveda-skin-soap": SKIN_SOAP_PAGE_BANNERS,
};

export function getProductPageBanners(sku) {
  const key = (sku || "").toLowerCase();
  if (isFranchOilSku(key)) return FRANCH_OIL_PAGE_BANNERS;
  return PRODUCT_PAGE_BANNERS_BY_SKU[key] || [];
}