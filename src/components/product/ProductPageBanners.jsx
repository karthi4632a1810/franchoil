export default function ProductPageBanners({ banners = [], productName = "Product" }) {
  if (!banners.length) return null;

  return (
    <section className="product-page-banners" aria-label={`${productName} highlights`}>
      <div className="product-page-banners__stack">
        {banners.map((src, index) => (
          <figure key={src} className="product-page-banners__item">
            <img
              src={src}
              alt={`${productName} banner ${index + 1}`}
              className="product-page-banners__img"
              loading="lazy"
              decoding="async"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
