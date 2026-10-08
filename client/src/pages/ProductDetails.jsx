import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductDetails({
  productId,
  navigate,
}) {
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] =
    useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setMessage("");
        setProduct(null);
        setQuantity(1);

        const data = await api(
          `/products/${productId}`
        );

        if (!active) {
          return;
        }

        if (!data?.product) {
          throw new Error(
            "Product not found."
          );
        }

        const nextProduct = data.product;

        setProduct(nextProduct);

        const firstImage =
          nextProduct.image ||
          nextProduct.images?.[0] ||
          "";

        setSelectedImage(firstImage);
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(
          error.message ||
            "Unable to load product."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const images = product
    ? Array.from(
        new Set(
          [
            product.image,
            ...(Array.isArray(product.images)
              ? product.images
              : []),
          ].filter(Boolean)
        )
      )
    : [];

  const isAvailable =
    product?.isAvailable !== false;

  const increaseQuantity = () => {
    setQuantity(
      (current) => current + 1
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  };

  const handleAddToCart = () => {
    if (!product || !isAvailable) {
      return;
    }

    add(product, quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-[#c62828]" />

          <p className="mt-4 text-sm font-medium text-black/50">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (message || !product) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-5 text-center">
        <div className="w-full rounded-3xl border border-red-100 bg-red-50 p-8">

          <div className="text-5xl">
            🍗
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Product unavailable
          </h1>

          <p className="mt-2 text-sm text-black/50">
            {message ||
              "This product could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-full bg-[#171717] px-6 py-3 text-sm font-bold text-white"
          >
            ← Back to products
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-[#faf7f2] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 text-sm font-bold text-black/50 transition hover:text-[#c62828]"
        >
          ← Back to products
        </button>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ========================= */}
          {/* GALLERY */}
          {/* ========================= */}

          <div>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#f1e9e1]">
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

              {!isAvailable && (
                <div className="absolute left-5 top-5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white">
                  Currently unavailable
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map(
                  (image, index) => {
                    const selected =
                      image ===
                      selectedImage;

                    return (
                      <button
                        type="button"
                        key={`${image}-${index}`}
                        onClick={() =>
                          setSelectedImage(
                            image
                          )
                        }
                        className={`aspect-square overflow-hidden rounded-2xl border-2 bg-white transition ${
                          selected
                            ? "border-[#c62828]"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* ========================= */}
          {/* INFORMATION */}
          {/* ========================= */}

          <div className="flex flex-col justify-center">

            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-[#c62828]/10 px-4 py-2 text-xs font-bold uppercase tracking-[.15em] text-[#c62828]">
                {product.category}
              </span>

              <span className="rounded-full bg-black/5 px-4 py-2 text-xs font-bold">
                {product.weight}g
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">
              {product.name}
            </h1>

            <p className="mt-5 text-base leading-7 text-black/60">
              {product.description}
            </p>

            <div className="mt-8 flex items-end gap-3">

              <span className="text-4xl font-black">
                ₹{product.price}
              </span>

              <span className="pb-1 text-sm text-black/40">
                / {product.weight}g
              </span>
            </div>

            <div className="mt-6">

              {isAvailable ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Available to order
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Currently unavailable
                </div>
              )}
            </div>

            {isAvailable && (
              <div className="mt-8">

                <p className="mb-3 text-sm font-bold">
                  Quantity
                </p>

                <div className="flex w-fit items-center rounded-full border border-black/10 bg-white p-1">

                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold hover:bg-black/5"
                  >
                    −
                  </button>

                  <span className="w-12 text-center text-lg font-black">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold hover:bg-black/5"
                  >
                    +
                  </button>

                </div>
              </div>
            )}

            <button
              type="button"
              onClick={
                handleAddToCart
              }
              disabled={!isAvailable}
              className="mt-8 w-full rounded-2xl bg-[#c62828] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#c62828]/20 transition hover:bg-[#a91f1f] disabled:cursor-not-allowed disabled:bg-black/15 disabled:shadow-none"
            >
              {isAvailable
                ? `Add ${quantity} to cart · ₹${(
                    Number(product.price) *
                    quantity
                  ).toFixed(0)}`
                : "Currently unavailable"}
            </button>

            <div className="mt-5 grid grid-cols-3 gap-3">

              <div className="rounded-2xl bg-white p-4 text-center">
                <div className="text-xl">
                  ✦
                </div>
                <p className="mt-1 text-xs font-bold">
                  Fresh
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center">
                <div className="text-xl">
                  ✓
                </div>
                <p className="mt-1 text-xs font-bold">
                  Hygienic
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center">
                <div className="text-xl">
                  ⚡
                </div>
                <p className="mt-1 text-xs font-bold">
                  Fast
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}