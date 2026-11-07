import { phpApi, phpRoutes } from "../lib/phpApi";
import { getMetaAttributionPayload } from "../utils/metaAttribution";
import { getMetaContentId } from "../utils/metaPixel";

export const sendPurchaseToPhpCapi = async ({
  cartItems = [],
  totalValue = 0,
  orderId,
  eventId,
  customer = {},
}) => {
  const contentIds = cartItems
    .map((item) => getMetaContentId(item.sku))
    .filter(Boolean);

  const attribution = getMetaAttributionPayload();

  return phpApi.post(phpRoutes.trackMeta, {
    event_name: "Purchase",
    event_id: eventId,
    event_source_url: attribution.event_source_url,
    user_data: {
      email: customer.email || "",
      phone: customer.phone || "",
      name: customer.name || "",
      ...attribution,
    },
    custom_data: {
      currency: "INR",
      value: Number(totalValue) || 0,
      content_ids: contentIds,
      content_type: "product",
      num_items: cartItems.length || 1,
      order_id: orderId || "",
    },
  });
};

