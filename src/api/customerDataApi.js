import { phpApi } from "../lib/phpApi";

function apiError(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}

export async function fetchCustomerCart() {
  const { data } = await phpApi.get("/api/customer/cart");
  return data?.items || [];
}

export async function replaceCustomerCart(items) {
  const { data } = await phpApi.put("/api/customer/cart", { items });
  return data?.items || [];
}

export async function upsertCustomerCartItem(item) {
  const { data } = await phpApi.post("/api/customer/cart", item);
  return data?.items || [];
}

export async function deleteCustomerCartLine({ productId, lineId } = {}) {
  const params = {};
  if (productId) params.productId = productId;
  if (lineId) params.lineId = lineId;
  const { data } = await phpApi.delete("/api/customer/cart", { params });
  return data?.items || [];
}

export async function fetchCustomerFavorites() {
  const { data } = await phpApi.get("/api/customer/favorites");
  return data?.items || [];
}

export async function addCustomerFavorite(item) {
  const { data } = await phpApi.post("/api/customer/favorites", item);
  return data?.items || [];
}

export async function removeCustomerFavorite({ productId, lineId } = {}) {
  const params = {};
  if (productId) params.productId = productId;
  if (lineId) params.lineId = lineId;
  const { data } = await phpApi.delete("/api/customer/favorites", { params });
  return data?.items || [];
}

export { apiError };
