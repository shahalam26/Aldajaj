import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Home({
  searchParams,
  navigate,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const search =
    searchParams.get("search")?.trim() || "";

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await api(
          "/products?available=true"
        );

        if (!active) {
          return;
        }

        setProducts(
          Array.isArray(data.products)
            ? data.products
            : []
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err.message ||
            "Unable to load products."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedSearch =
      search.toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      `${product.name || ""} ${
        product.description || ""
      } ${product.category || ""}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [products, search]);

  return (
    <>
      {/* ========================= */}
      {/* HERO */}
      {/* ========================= */}

      <section className="overflow-hidden bg-[#faf7f2]">
        <div className="mx-auto grid min-h-[610px] max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10">

          <div>
            <span className="inline-flex rounded-full border border-[#c62828]/20 bg-[#c62828]/5 px-4 py-2 text-xs font-bold tracking-[.18em] text-[#c62828]">
              FRESHNESS YOU CAN TASTE
            </span>

            <h1 className="mt-7 text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl lg:text-7xl">
              Fresh cuts.
              <br />
              <span className="text-[#c62828]">
                Delivered fast.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-7 text-black/60">
              Premium quality chicken,
              freshly cut and packed with care.
              Straight from Dilli Cuts to your
              doorstep.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#products"
                className="rounded-full bg-[#c62828] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#c62828]/20"
              >
                Order now →
              </a>

              <a
                href="#products"
                className="rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-bold"
              >
                Explore cuts
              </a>
            </div>

            <div className="mt-12 flex gap-8 border-t border-black/10 pt-7">
              <div>
                <b className="block text-xl">
                  100%
                </b>
                <span className="text-xs text-black/50">
                  Fresh
                </span>
              </div>

              <div>
                <b className="block text-xl">
                  Clean
                </b>
                <span className="text-xs text-black/50">
                  Hygienic
                </span>
              </div>

              <div>
                <b className="block text-xl">
                  Fast
                </b>
                <span className="text-xs text-black/50">
                  Delivery
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto flex h-[460px] w-full max-w-[520px] items-center justify-center">

            <div className="absolute h-80 w-80 rounded-full bg-[#c62828] sm:h-96 sm:w-96" />

            <div className="relative flex h-72 w-72 flex-col items-center justify-center rounded-[45%] bg-[#ead7c8] shadow-2xl sm:h-80 sm:w-80">
              <span className="text-[110px]">
                🍗
              </span>

              <b className="text-xs uppercase tracking-[.2em] text-black/60">
                Fresh Chicken
              </b>
            </div>

            <div className="absolute left-0 top-10 rounded-2xl bg-white p-4 shadow-xl">
              <b className="block text-sm">
                ✦ Freshly Cut
              </b>

              <small className="text-xs text-black/50">
                Made to order
              </small>
            </div>

            <div className="absolute bottom-10 right-0 rounded-2xl bg-white p-4 shadow-xl">
              <b className="block text-sm">
                ✓ Delhi Delivery
              </b>

              <small className="text-xs text-black/50">
                Fast doorstep delivery
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= */}
      {/* PRODUCTS */}
      {/* ========================= */}

      <section
        id="products"
        className="bg-white py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="mb-10">
            <span className="text-xs font-bold tracking-[.18em] text-[#c62828]">
              FRESH PICKS
            </span>

            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">
              {search
                ? `Results for "${search}"`
                : "Popular cuts"}
            </h2>
          </div>

          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="animate-pulse overflow-hidden rounded-3xl bg-black/5"
                  >
                    <div className="h-64 bg-black/10" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-20 rounded bg-black/10" />
                      <div className="h-5 w-40 rounded bg-black/10" />
                      <div className="h-4 w-full rounded bg-black/10" />
                      <div className="h-10 w-full rounded bg-black/10" />
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-10 text-center">
              <h3 className="text-xl font-black">
                Couldn't load products
              </h3>

              <p className="mt-2 text-sm text-red-700/70">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-5 rounded-full bg-[#c62828] px-6 py-3 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            visibleProducts.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visibleProducts.map(
                  (product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      navigate={navigate}
                    />
                  )
                )}
              </div>
            )}

          {!loading &&
            !error &&
            visibleProducts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-black/10 p-16 text-center">
                <div className="text-5xl">
                  🍗
                </div>

                <h3 className="mt-4 text-xl font-black">
                  No products found
                </h3>

                <p className="mt-2 text-sm text-black/50">
                  Try a different search.
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-5 rounded-full bg-[#171717] px-6 py-3 text-sm font-bold text-white"
                  >
                    View all products
                  </button>
                )}
              </div>
            )}
        </div>
      </section>
    </>
  );
}