import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Cart({ navigate }) {
  const { items, setQuantity, remove, total } = useCart();
  const { user } = useAuth();

  if (!items.length) {
    return (
      <section className="min-h-[75vh] bg-[#faf7f2] px-5 py-16">
        <div className="mx-auto max-w-xl rounded-[32px] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f4eee8] text-4xl">
            🛒
          </div>
          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-[#c62828]">
            Your basket
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">
            Nothing here yet.
          </h1>
          <p className="mt-2 text-sm leading-6 text-black/45">
            Pick your favourite fresh cuts and we'll get them ready for you.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-7 rounded-2xl bg-[#171717] px-7 py-3.5 text-sm font-black text-white"
          >
            Browse fresh cuts →
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[75vh] bg-[#faf7f2] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c62828]">
            Your basket
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Fresh cuts, ready to go.
          </h1>
          <p className="mt-2 text-sm text-black/45">
            {items.reduce((sum, item) => sum + item.quantity, 0)} items in your basket
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.product}
                className="rounded-[26px] bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f4eee8] sm:h-28 sm:w-28">
                    {item.productData?.image ? (
                      <img
                        src={item.productData.image}
                        alt={item.productData.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">
                        🍗
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#c62828]">
                          {item.productData?.category || "Chicken"}
                        </p>
                        <h2 className="mt-1 truncate text-base font-black">
                          {item.productData?.name || "Product"}
                        </h2>
                        <p className="mt-1 text-xs text-black/40">
                          {item.productData?.weight}g · ₹{item.productData?.price}
                        </p>
                      </div>

                      <button
                        onClick={() => remove(item.product)}
                        className="text-[10px] font-bold text-black/30 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center rounded-full bg-[#f6f5f2] p-1">
                        <button
                          onClick={() =>
                            setQuantity(item.product, item.quantity - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black hover:bg-white"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-xs font-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            setQuantity(item.product, item.quantity + 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black hover:bg-white"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-lg font-black">
                        ₹
                        {Number(item.productData?.price || 0) *
                          Number(item.quantity || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[28px] bg-[#171717] p-6 text-white lg:sticky lg:top-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Order summary
            </p>
            <h2 className="mt-2 text-xl font-black">Ready to checkout?</h2>

            <div className="mt-7 space-y-3 text-sm">
              <div className="flex justify-between text-white/55">
                <span>Items</span>
                <span>₹{total}</span>
              </div>
              <div className="flex justify-between text-white/55">
                <span>Delivery</span>
                <span>Included</span>
              </div>
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="flex items-end justify-between">
              <span className="text-xs text-white/40">Total</span>
              <span className="text-3xl font-black tracking-[-0.05em]">
                ₹{total}
              </span>
            </div>

            <button
              onClick={() =>
                user ? navigate("/checkout") : navigate("/login")
              }
              className="mt-6 w-full rounded-2xl bg-[#c62828] py-4 text-sm font-black text-white"
            >
              {user ? "Continue to checkout →" : "Login to checkout →"}
            </button>

            <button
              onClick={() => navigate("/")}
              className="mt-3 w-full py-2 text-xs font-bold text-white/35 hover:text-white"
            >
              Continue shopping
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
