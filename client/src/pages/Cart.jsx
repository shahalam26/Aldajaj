import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Cart({ navigate }) {
  const { items, setQuantity, remove, total } = useCart();
  const { user } = useAuth();

  if (!items.length) return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <div className="text-7xl">🛒</div><h1 className="mt-5 text-3xl font-black">Your cart is empty</h1>
      <button onClick={() => navigate("/")} className="mt-7 rounded-full bg-[#c62828] px-7 py-3 font-bold text-white">Browse fresh cuts</button>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_360px]">
      <section><h1 className="text-3xl font-black">Your cart</h1>
        <div className="mt-6 space-y-3">{items.map(x => (
          <div key={x.product} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#f4eee8]">{x.productData.image ? <img src={x.productData.image} className="h-full w-full object-cover" /> : <span className="text-4xl">🍗</span>}</div>
            <div className="min-w-0 flex-1"><h3 className="font-black">{x.productData.name}</h3><p className="text-sm text-black/50">₹{x.productData.price}</p></div>
            <div className="flex items-center gap-2"><button onClick={() => setQuantity(x.product, x.quantity-1)} className="h-8 w-8 rounded-full bg-black/5">−</button><b>{x.quantity}</b><button onClick={() => setQuantity(x.product, x.quantity+1)} className="h-8 w-8 rounded-full bg-black/5">+</button></div>
            <button onClick={() => remove(x.product)} className="text-sm text-red-600">Remove</button>
          </div>
        ))}</div>
      </section>
      <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Summary</h2>
        <div className="mt-6 flex justify-between text-sm"><span>Items</span><span>₹{total}</span></div>
        <div className="mt-3 flex justify-between text-sm"><span>Delivery</span><span>Included</span></div>
        <div className="mt-5 flex justify-between border-t pt-5 text-xl font-black"><span>Total</span><span>₹{total}</span></div>
        <button onClick={() => user ? navigate("/checkout") : navigate("/login")} className="mt-6 w-full rounded-2xl bg-[#c62828] py-3.5 font-bold text-white">Checkout</button>
      </aside>
    </div>
  );
}
