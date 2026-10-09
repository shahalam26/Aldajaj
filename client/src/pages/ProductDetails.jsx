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

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setMessage("");

        const data = await api(`/products/${productId}`);

        if (!active) return;

        if (!data?.product) {
          throw new Error("Product not found.");
        }

        const nextProduct = data.product;
        const firstImage =
          nextProduct.image || nextProduct.images?.[0] || "";

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
      new Set([
        product.image,
        ...(Array.isArray(product.images) ? product.images : []),
      ].filter(Boolean))
    );
  }, [product]);

  const isAvailable = product?.isAvailable !== false;

  const addToCart = () => {
    if (!product || !isAvailable) return;

    add(product, quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] bg-[#faf7f2] px-5 py-12">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-4 w-28 rounded bg-black/10" />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="aspect-square rounded-[32px] bg-black/5" />
            <div className="space-y-4 py-10">
              <div className="h-7 w-28 rounded-full bg-black/10" />
              <div className="h-14 w-3/4 rounded bg-black/10" />
              <div className="h-24 w-full rounded bg-black/10" />
              <div className="h-14 w-40 rounded bg-black/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-[#faf7f2] px-5">
        <div className="max-w-md rounded-[30px] bg-white p-8 text-center shadow-sm">
          <div className="text-6xl">🍗</div>
          <h1 className="mt-5 text-2xl font-black">Product unavailable</h1>
          <p className="mt-2 text-sm text-black/45">
            {message || "This product could not be found."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-2xl bg-[#171717] px-6 py-3 text-sm font-black text-white"
          >
            Back to shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-[75vh] bg-[#faf7f2] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate("/")}
          className="mb-7 text-sm font-bold text-black/45 hover:text-[#c62828]"
        >
          ← Back to fresh cuts
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div>
            <div className="relative overflow-hidden rounded-[32px] bg-[#eee5dc] shadow-sm">
              <div className="aspect-square">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[120px]">
                    🍗
                  </div>
                )}
              </div>

              <div className="absolute left-5 top-5 flex gap-2">
                <span className="rounded-full bg-white/90 px-3 py-2 text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {product.category}
                </span>
                {!isAvailable && (
                  <span className="rounded-full bg-black px-3 py-2 text-[10px] font-black text-white">
                    Unavailable
                  </span>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square overflow-hidden rounded-2xl border-2 ${
                      image === selectedImage
                        ? "border-[#c62828]"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#c62828]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#c62828]">
                {product.category}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1.5 text-[10px] font-black">
                {product.weight}g
              </span>
              {isAvailable && (
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                  Available
                </span>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              {product.name}
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-black/55">
              {product.description}
            </p>

            <div className="mt-8">
              <span className="text-4xl font-black tracking-[-0.05em]">
                ₹{product.price}
              </span>
              <span className="ml-2 text-sm text-black/35">
                / {product.weight}g
              </span>
            </div>

            {isAvailable ? (
              <>
                <div className="mt-8">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-black/40">
                    Quantity
                  </p>
                  <div className="flex w-fit items-center rounded-full bg-white p-1 shadow-sm">
                    <button
                      onClick={() =>
                        setQuantity((value) => Math.max(1, value - 1))
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-black hover:bg-black/5"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-black">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((value) => value + 1)
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-black hover:bg-black/5"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  className="mt-6 flex w-full items-center justify-between rounded-2xl bg-[#c62828] px-5 py-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(198,40,40,.18)] hover:bg-[#ad2222]"
                >
                  <span>Add to cart</span>
                  <span>
                    ₹{(Number(product.price) * quantity).toFixed(0)} →
                  </span>
                </button>
              </>
            ) : (
              <div className="mt-7 rounded-2xl bg-black/5 p-4 text-sm font-bold text-black/45">
                This cut is currently unavailable. Please check back later.
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                ["✦", "Fresh"],
                ["✓", "Hygienic"],
                ["⚡", "Fast"],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white p-4 text-center shadow-sm"
                >
                  <span className="text-lg">{icon}</span>
                  <p className="mt-1 text-[10px] font-black">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
