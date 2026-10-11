
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Cart({ navigate }) {
  const { items, setQuantity, remove, total } = useCart();
  const { user } = useAuth();

  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const getImage = (product) => {
    if (typeof product?.image === "string" && product.image.trim()) {
      return product.image;
    }

    if (Array.isArray(product?.images)) {
      return product.images.find(
        (image) => typeof image === "string" && image.trim()
      );
    }

    return "";
  };

  if (!items.length) {
    return (
      <section className="min-h-[75vh] bg-[#F7F4EF] px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#E9E1D8] bg-white px-6 py-12 text-center shadow-sm sm:px-12 sm:py-16">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F5E9E7] text-[#751F2B]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-9 w-9"
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
          </div>

          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.24em] text-[#751F2B]">
            Your shopping bag
          </p>

          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#282321] sm:text-4xl">
            Something fresh is missing.
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#82766D]">
            Your basket is waiting. Explore our selection of fresh cuts and
            find something delicious for your next meal.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#751F2B] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#5D1721] focus:outline-none focus:ring-2 focus:ring-[#751F2B] focus:ring-offset-2"
          >
            Explore fresh cuts
            <span aria-hidden="true">→</span>
          </button>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A99B90]">
            Dilli Cuts · Quality you can trust
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[75vh] bg-[#F7F4EF] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <div className="border-b border-[#E5DED5] pb-6 sm:pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#751F2B]">
            Dilli Cuts · Shopping bag
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#282321] sm:text-5xl">
                Your fresh selection.
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#82766D]">
                Review your cuts before moving to checkout.
              </p>
            </div>

            <div className="rounded-full border border-[#E5DED5] bg-white px-4 py-2 text-xs font-semibold text-[#65584F]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </div>
          </div>
        </div>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-8">
          {/* Cart items */}
          <div className="min-w-0 space-y-4">
            {items.map((item) => {
              const product = item.productData;
              const image = getImage(product);
              const price = Number(product?.price || 0);
              const quantity = Number(item.quantity || 0);
              const lineTotal = price * quantity;

              return (
                <article
                  key={item.product}
                  className="rounded-2xl border border-[#E9E1D8] bg-white p-3 shadow-sm transition hover:border-[#D8C5BE] sm:rounded-[24px] sm:p-5"
                >
                  <div className="flex gap-3 sm:gap-5">
                    {/* Product image */}
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${item.product}`)}
                      aria-label={`View ${product?.name || "product"} details`}
                      className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F1EBE4] focus:outline-none focus:ring-2 focus:ring-[#751F2B] sm:h-32 sm:w-32 sm:rounded-2xl"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product?.name || "Fresh meat"}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center">
                          <span className="font-serif text-3xl font-bold text-[#751F2B]">
                            DC
                          </span>
                          <span className="mt-1 text-[8px] font-semibold uppercase tracking-widest text-[#82766D]">
                            Dilli Cuts
                          </span>
                        </div>
                      )}
                    </button>

                    {/* Product information */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#751F2B]">
                            {product?.category || "Fresh cuts"}
                          </p>

                          <button
                            type="button"
                            onClick={() => navigate(`/product/${item.product}`)}
                            className="mt-1 block max-w-full text-left font-serif text-base font-bold leading-6 text-[#282321] hover:text-[#751F2B] sm:text-lg"
                          >
                            {product?.name || "Product"}
                          </button>

                          {product?.weight != null && (
                            <p className="mt-1 text-xs text-[#82766D]">
                              {product.weight}g
                            </p>
                          )}

                          <p className="mt-1 text-xs font-medium text-[#82766D]">
                            ₹{formatPrice(price)} per item
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(item.product)}
                          aria-label={`Remove ${product?.name || "product"}`}
                          className="shrink-0 rounded-lg p-2 text-[#A99B90] transition hover:bg-[#F8ECEB] hover:text-[#751F2B] focus:outline-none focus:ring-2 focus:ring-[#751F2B]"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                        {/* Quantity control */}
                        <div
                          className="inline-flex items-center rounded-full border border-[#E9E1D8] bg-[#FAF8F5] p-1"
                          aria-label="Product quantity"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.product, quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#65584F] transition hover:bg-white hover:text-[#751F2B] focus:outline-none focus:ring-2 focus:ring-[#751F2B]"
                          >
                            −
                          </button>

                          <span
                            aria-live="polite"
                            className="w-8 text-center text-sm font-bold text-[#282321]"
                          >
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.product, quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#65584F] transition hover:bg-white hover:text-[#751F2B] focus:outline-none focus:ring-2 focus:ring-[#751F2B]"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-lg font-bold tracking-tight text-[#751F2B] sm:text-xl">
                          ₹{formatPrice(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold text-[#65584F] transition hover:text-[#751F2B]"
            >
              <span aria-hidden="true">←</span>
              Continue shopping
            </button>
          </div>

          {/* Order summary */}
          <aside className="h-fit rounded-[24px] border border-[#4D2025] bg-[#292321] p-5 text-white shadow-lg shadow-[#3A171A]/10 sm:rounded-[28px] sm:p-7 lg:sticky lg:top-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D8B7AE]">
              Your order
            </p>

            <h2 className="mt-3 font-serif text-2xl font-bold">
              Order summary
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/55">
              A quick review of your basket before checkout.
            </p>

            <div className="mt-7 space-y-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/60">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold">
                  ₹{formatPrice(total)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/60">Delivery</span>
                <span className="text-xs text-white/60">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <div className="my-6 border-t border-white/15" />

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-white/55">Estimated total</p>
                <p className="mt-1 text-[10px] text-white/40">
                  Final charges shown at checkout
                </p>
              </div>

              <span className="text-3xl font-bold tracking-tight">
                ₹{formatPrice(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                user ? navigate("/checkout") : navigate("/login")
              }
              className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8D2935] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#A33340] focus:outline-none focus:ring-2 focus:ring-[#E8B8B5] focus:ring-offset-2 focus:ring-offset-[#292321]"
            >
              {user ? "Continue to checkout" : "Login to checkout"}
              <span aria-hidden="true">→</span>
            </button>

            <div className="mt-5 flex items-start gap-3 border-t border-white/10 pt-5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mt-0.5 h-5 w-5 shrink-0 text-[#D8B7AE]"
                aria-hidden="true"
              >
                <path
                  d="M12 3 5 6v5c0 4.5 2.8 7.7 7 10 4.2-2.3 7-5.5 7-10V6l-7-3Z"
                  strokeLinejoin="round"
                />
                <path
                  d="m9 12 2 2 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="text-xs leading-5 text-white/55">
                Review your order details carefully before confirming your
                purchase.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
