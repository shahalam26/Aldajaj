
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductDetails({ productId, navigate }) {
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setMessage("");
        setProduct(null);
        setSelectedImage("");
        setImageError(false);

        const data = await api(`/products/${productId}`);

        if (!active) return;

        if (!data?.product) {
          throw new Error("Product not found.");
        }

        const nextProduct = data.product;
        const firstImage =
          nextProduct.image ||
          (Array.isArray(nextProduct.images)
            ? nextProduct.images.find(
                (image) => typeof image === "string" && image.trim()
              )
            : "") ||
          "";

        setProduct(nextProduct);
        setSelectedImage(firstImage);
        setQuantity(1);
      } catch (error) {
        if (active) {
          setMessage(error.message || "Unable to load product.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const images = useMemo(() => {
    if (!product) return [];

    return Array.from(
      new Set(
        [
          product.image,
          ...(Array.isArray(product.images) ? product.images : []),
        ].filter(
          (image) => typeof image === "string" && image.trim()
        )
      )
    );
  }, [product]);

  const isAvailable = product?.isAvailable !== false;
  const price = Number(product?.price);
  const hasPrice = Number.isFinite(price) && price >= 0;

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const addToCart = () => {
    if (!product || !isAvailable || !hasPrice) return;

    add(product, quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-[#F7F4EF] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-4 w-32 rounded bg-[#E7DED5]" />

          <div className="mt-6 grid gap-7 lg:grid-cols-2">
            <div className="aspect-square max-h-[480px] rounded-2xl bg-[#EAE2D9]" />

            <div className="space-y-4 py-3">
              <div className="h-5 w-28 rounded bg-[#E7DED5]" />
              <div className="h-10 w-3/4 rounded bg-[#E7DED5]" />
              <div className="h-16 w-full rounded bg-[#E7DED5]" />
              <div className="h-10 w-36 rounded bg-[#E7DED5]" />
              <div className="h-12 w-full rounded bg-[#E7DED5]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="flex min-h-[65vh] items-center justify-center bg-[#F7F4EF] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#E9E1D8] bg-white p-8 text-center">
          <div className="font-serif text-5xl font-bold text-[#751F2B]">
            DC
          </div>

          <h1 className="mt-4 font-serif text-2xl font-bold text-[#282321]">
            Product unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#82766D]">
            {message || "This product could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-lg bg-[#751F2B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5D1721]"
          >
            Back to shop
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-[#F7F4EF] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-6xl">
        {/* Compact back navigation */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-5 inline-flex items-center gap-2 rounded-md py-1.5 text-xs font-semibold text-[#82766D] transition hover:text-[#751F2B] focus:outline-none focus:ring-2 focus:ring-[#751F2B]"
        >
          <span aria-hidden="true">←</span>
          Back to fresh cuts
        </button>

        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-9 lg:gap-12">
          {/* Product image and thumbnails */}
          <div className="min-w-0 md:sticky md:top-5">
            <div className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#E9E1D8] bg-[#EFE7DE]">
              <div className="aspect-square">
                {selectedImage && !imageError ? (
                  <img
                    src={selectedImage}
                    alt={product.name || "Fresh meat product"}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <span className="font-serif text-7xl font-bold tracking-wider text-[#751F2B]">
                      DC
                    </span>
                    <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#82766D]">
                      Dilli Cuts
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute left-3 top-3">
                <span className="rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#751F2B] shadow-sm">
                  {product.category || "Fresh cuts"}
                </span>
              </div>

              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#292321]/35">
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#751F2B]">
                    Currently unavailable
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mx-auto mt-3 grid max-w-[480px] grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedImage(image);
                      setImageError(false);
                    }}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={image === selectedImage}
                    className={`aspect-square overflow-hidden rounded-lg border-2 bg-white transition focus:outline-none focus:ring-2 focus:ring-[#751F2B] ${
                      image === selectedImage
                        ? "border-[#751F2B]"
                        : "border-transparent hover:border-[#D8C5BE]"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name || "Product"} ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Compact supporting information */}
            <div className="mx-auto mt-4 flex max-w-[480px] flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[#E5DED5] py-3 text-[10px] font-semibold text-[#82766D]">
              <span className="flex items-center gap-1.5">
                <span className="text-[#751F2B]">✓</span>
                Quality selection
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#751F2B]">✓</span>
                Easy ordering
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#751F2B]">✓</span>
                Clear pricing
              </span>
            </div>
          </div>

          {/* Product details */}
          <div className="min-w-0 md:pt-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#751F2B]">
              Dilli Cuts / Product details
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F0E4E1] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#751F2B]">
                {product.category || "Fresh cuts"}
              </span>

              {product.weight != null && (
                <span className="rounded-full border border-[#E5DED5] bg-white px-2.5 py-1 text-[10px] font-medium text-[#65584F]">
                  {product.weight}g
                </span>
              )}

              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                  isAvailable
                    ? "bg-[#E7F2E9] text-[#28734A]"
                    : "bg-[#F5E9E7] text-[#751F2B]"
                }`}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>

            <h1 className="mt-3 break-words font-serif text-3xl font-bold leading-tight tracking-tight text-[#282321] sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#82766D] sm:text-sm">
              {product.description || "Explore this selection from Dilli Cuts."}
            </p>

            {/* Price block */}
            <div className="mt-5 border-y border-[#E5DED5] py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#95877C]">
                Price
              </p>

              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-[#751F2B] sm:text-4xl">
                  {hasPrice ? `₹${formatPrice(price)}` : "Price unavailable"}
                </span>

                {product.weight != null && (
                  <span className="text-xs text-[#82766D]">
                    / {product.weight}g
                  </span>
                )}
              </div>
            </div>

            {isAvailable ? (
              <>
                {/* Quantity and item total */}
                <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#82766D]">
                      Quantity
                    </p>

                    <div className="inline-flex items-center rounded-full border border-[#E5DED5] bg-white p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((value) => Math.max(1, value - 1))
                        }
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#65584F] transition hover:bg-[#F7F4EF] hover:text-[#751F2B] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#751F2B]"
                      >
                        −
                      </button>

                      <span
                        aria-live="polite"
                        className="w-9 text-center text-sm font-bold text-[#282321]"
                      >
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((value) => value + 1)
                        }
                        aria-label="Increase quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#65584F] transition hover:bg-[#F7F4EF] hover:text-[#751F2B] focus:outline-none focus:ring-2 focus:ring-[#751F2B]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#95877C]">
                      Item total
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#282321]">
                      {hasPrice ? `₹${formatPrice(price * quantity)}` : "—"}
                    </p>
                  </div>
                </div>

                {/* Main purchase CTA */}
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!hasPrice}
                  className="mt-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-[#751F2B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5D1721] focus:outline-none focus:ring-2 focus:ring-[#751F2B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#C9BDB7] sm:px-5"
                >
                  <span>{hasPrice ? "Add to cart" : "Price unavailable"}</span>

                  <span className="flex items-center gap-3">
                    {hasPrice && (
                      <span>₹{formatPrice(price * quantity)}</span>
                    )}
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-[#E9D9D5] bg-[#F5E9E7] p-4">
                <p className="text-sm font-semibold text-[#751F2B]">
                  This product is currently unavailable.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-3 text-sm font-bold text-[#751F2B] underline underline-offset-4"
                >
                  Explore other cuts →
                </button>
              </div>
            )}

            <p className="mt-4 text-[10px] leading-5 text-[#95877C]">
              Please review your quantity and order details before checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
