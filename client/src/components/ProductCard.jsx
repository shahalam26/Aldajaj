
import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [imageError, setImageError] = useState(false);

  const image =
    typeof product?.image === "string" && product.image.trim()
      ? product.image.trim()
      : Array.isArray(product?.images)
        ? product.images.find(
            (item) => typeof item === "string" && item.trim()
          )?.trim() || ""
        : "";

  const productName = product?.name?.trim() || "Fresh Meat";
  const productDescription =
    product?.description?.trim() || "Quality cuts, prepared with care.";

  const imageAlt = `${productName} - fresh chicken and meat from Dilli Cuts`;

  const isAvailable = product?.isAvailable !== false;
  const price = Number(product?.price);
  const hasPrice = Number.isFinite(price) && price >= 0;

  const productUrl = product?._id
    ? `/product/${encodeURIComponent(product._id)}`
    : "/";

  const openProduct = (event) => {
    if (!product?._id) {
      event.preventDefault();
      return;
    }

    // Keep native link behaviour for new tabs, external tools and modified clicks.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", productUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdd = (event) => {
    event.stopPropagation();

    if (!isAvailable || !product?._id) return;

    add(product, 1);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E9E1D8] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D7B7B8] hover:shadow-xl hover:shadow-[#4B171B]/10">
      <a
        href={productUrl}
        onClick={openProduct}
        aria-label={`View ${productName} details`}
        className="relative block w-full overflow-hidden bg-[#F6F2ED] text-left"
      >
        <div className="aspect-[4/3] overflow-hidden">
          {image && !imageError ? (
            <img
              src={image}
              alt={imageAlt}
              width="800"
              height="600"
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#F7F2EB] to-[#EAE0D5]">
              <span className="font-serif text-5xl font-bold tracking-widest text-[#751F2B]">
                DC
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#75685D]">
                Dilli Cuts
              </span>
            </div>
          )}
        </div>

        <div className="absolute left-3 top-3">
          <span className="inline-flex rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#751F2B] shadow-sm">
            {product?.category || "Fresh Cut"}
          </span>
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#211B19]/50">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#751F2B]">
              Currently unavailable
            </span>
          </div>
        )}
      </a>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <a href={productUrl} onClick={openProduct} className="block text-left">
          <h3 className="line-clamp-2 min-h-[3.5rem] font-serif text-lg font-bold leading-7 text-[#282321] transition-colors group-hover:text-[#751F2B] sm:text-xl">
            {productName}
          </h3>

          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-[#82766D]">
            {productDescription}
          </p>
        </a>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#EEE8E1] pt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#95877C]">
              Price
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-[#751F2B]">
              {hasPrice
                ? `₹${price.toLocaleString("en-IN")}`
                : "Price unavailable"}
            </p>

            {product?.weight != null && (
              <p className="mt-1 text-xs text-[#82766D]">
                {product.weight}g
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable || !product?._id || !hasPrice}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#751F2B] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#5D1721] focus:outline-none focus:ring-2 focus:ring-[#751F2B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#C9BDB7] disabled:text-white/90 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>

            <span>
              {!isAvailable
                ? "Unavailable"
                : !hasPrice
                  ? "Price N/A"
                  : "Add"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
