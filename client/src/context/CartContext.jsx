import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

const readCart = () => {
  try { return JSON.parse(localStorage.getItem("dilli_cart") || "[]"); } catch { return []; }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  const persist = (next) => {
    setItems(next);
    localStorage.setItem("dilli_cart", JSON.stringify(next));
  };

  const add = (product) => {
    const found = items.find((x) => x.product === product._id);
    if (found) {
      persist(items.map((x) => x.product === product._id ? { ...x, quantity: x.quantity + 1 } : x));
    } else {
      persist([...items, { product: product._id, quantity: 1, productData: product }]);
    }
  };

  const remove = (id) => persist(items.filter((x) => x.product !== id));
  const setQuantity = (id, quantity) => {
    if (quantity <= 0) return remove(id);
    persist(items.map((x) => x.product === id ? { ...x, quantity } : x));
  };
  const clear = () => persist([]);

  const total = useMemo(
    () => items.reduce((sum, x) => sum + Number(x.productData?.price || 0) * x.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((sum, x) => sum + x.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, setQuantity, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
