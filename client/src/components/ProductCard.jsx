import { useCart } from "../context/CartContext";

export default function ProductCard({
  product,
  navigate,
}) {
  const { add } = useCart();

  const isAvailable =
    product?.isAvailable !== false;

  const handleAdd = (event) => {
    event.stopPropagation();

    if (!isAvailable) {
      return;
    }

    add(product, 1);
  };

  const openDetails = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <article className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

      {/* Product */}
      <button
        type="button"
        onClick={openDetails}
        className="block w-full text-left"
      >
        <div className="relative flex h-64 items-center justify-center overflow-hidden bg-[#f4eee8]">

          {product?.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-8xl">
              🍗
            </span>
          )}

          <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold shadow">
            {product.weight}g
          </span>

          {!isAvailable && (
            <span className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-[10px] font-bold text-white shadow">
              Unavailable
            </span>
          )}
        </div>

        <div className="p-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#c62828]">
            {product.category}
          </p>

          <h3 className="mt-1 text-lg font-black">
            {product.name}
          </h3>

          <p className="mt-1 min-h-10 text-sm leading-5 text-black/50">
            {product.description}
          </p>
        </div>
      </button>

      {/* Bottom section */}
      <div className="p-5 pt-3">
        <div className="flex items-center justify-between border-t border-black/5 pt-4">

          <div>
            <span className="text-xl font-black">
              ₹{product.price}
            </span>

            <span className="ml-1 text-xs text-black/40">
              / {product.weight}g
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable}
            className="rounded-full bg-[#171717] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#c62828] disabled:cursor-not-allowed disabled:bg-black/15"
          >
            {isAvailable
              ? "+ Add"
              : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}