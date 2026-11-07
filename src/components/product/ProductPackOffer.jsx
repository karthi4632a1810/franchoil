import { Link } from "react-router-dom";

/** Pack-of-2 promo — full-width banner image */
export default function ProductPackOffer({
  href = "/landing/landing-franch-oil-nh-plus-pack-of-2",
  imageSrc,
  alt = "Pack of 2 special offer",
}) {
  if (!imageSrc) return null;

  return (
    <Link to={href} className="product-pack-offer product-pack-offer--full">
      <img src={imageSrc} alt={alt} className="product-pack-offer__img" loading="lazy" />
    </Link>
  );
}
