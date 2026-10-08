import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const readCart = () => {
  try {
    const stored = JSON.parse(
      localStorage.getItem("dilli_cart") || "[]"
    );

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  const persist = (next) => {
    setItems(next);
    localStorage.setItem(
      "dilli_cart",
      JSON.stringify(next)
    );
  };

  // Add product to cart.
  // Quantity can come from product details page.
  const add = (product, quantity = 1) => {
    if (!product?._id) {
      return;
    }

    const numericQuantity = Math.max(
      1,
      Math.floor(Number(quantity) || 1)
    );

    const found = items.find(
      (item) => item.product === product._id
    );

    if (found) {
      persist(
        items.map((item) =>
          item.product === product._id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) +
                  numericQuantity,
                productData: product,
              }
            : item
        )
      );

      return;
    }

    persist([
      ...items,
      {
        product: product._id,
        quantity: numericQuantity,
        productData: product,
      },
    ]);
  };

  const remove = (id) => {
    persist(
      items.filter(
        (item) => item.product !== id
      )
    );
  };

  const setQuantity = (id, quantity) => {
    const numericQuantity = Math.floor(
      Number(quantity)
    );

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      remove(id);
      return;
    }

    persist(
      items.map((item) =>
        item.product === id
          ? {
              ...item,
              quantity: numericQuantity,
            }
          : item
      )
    );
  };

  const clear = () => {
    persist([]);
  };

  const total = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(item.productData?.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [items]);

  const count = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        setQuantity,
        clear,
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () =>
  useContext(CartContext);