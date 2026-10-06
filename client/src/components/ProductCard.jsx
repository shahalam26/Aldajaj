import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { add } = useCart();
  return (
    <article className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-[#f4eee8]">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : <span className="text-8xl">🍗</span>}
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold shadow">{product.weight}g</span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-black">{product.name}</h3>
        <p className="mt-1 min-h-10 text-sm text-black/50">{product.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
          <span className="text-xl font-black">₹{product.price}</span>
          <button onClick={() => add(product)} className="rounded-full bg-[#171717] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c62828]">+ Add</button>
        </div>
      </div>
    </article>
  );
}
