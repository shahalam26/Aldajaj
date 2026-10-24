

import { useEffect, useMemo, useState } from "react";

import { api } from "../services/api";

import ProductCard from "../components/ProductCard";



const CATEGORIES = [

  {

    name: "Chicken",

    description: "Explore chicken cuts and everyday favourites available from Dilli Cuts in Delhi.",

  },

  {

    name: "Mutton",

    description: "Browse mutton options for family meals and special occasions in Delhi.",

  },

  {

    name: "Fish",

    description: "Explore fish options for your favourite recipes, subject to availability.",

  },

];



function getProductImage(product) {

  if (typeof product?.image === "string" && product.image.trim()) {

    return product.image;

  }



  if (Array.isArray(product?.images)) {

    const image = product.images.find(

      (item) => typeof item === "string" && item.trim()

    );



    if (image) return image;

  }



  return "";

}



function getProductCategory(product) {

  const name = (product?.name || "").trim().toLowerCase();

  const category = (product?.category || "").trim().toLowerCase();



  // Identify fish products first to avoid cross-category mixing.

  if (

    /\b(fish|rohu|catla|katla|tilapia|pomfret|surmai|salmon|tuna|prawns?|shrimp|crab)\b/.test(

      name

    )

  ) {

    return "Fish";

  }



  if (/\b(mutton|goat|bakra)\b/.test(name)) {

    return "Mutton";

  }



  if (/\b(chicken|broiler)\b/.test(name)) {

    return "Chicken";

  }



  if (category === "chicken") return "Chicken";

  if (category === "mutton" || category === "goat") return "Mutton";

  if (category === "fish") return "Fish";



  return "";

}



function ImageCarousel({ products, onOpen, label }) {

  const images = useMemo(

    () =>

      products

        .map((product) => ({

          product,

          image: getProductImage(product),

        }))

        .filter((item) => item.image)

        .slice(0, 3),

    [products]

  );



  const [activeIndex, setActiveIndex] = useState(0);



  useEffect(() => {

    setActiveIndex(0);

  }, [products]);



  useEffect(() => {

    if (images.length < 2) return undefined;



    const interval = window.setInterval(() => {

      setActiveIndex((current) => (current + 1) % images.length);

    }, 3000);



    return () => window.clearInterval(interval);

  }, [images]);



  if (!images.length) {

    return (

      <div className="flex h-full min-h-48 items-center justify-center bg-[#EEE6DD] p-5 text-center">

        <div>

          <p className="text-sm font-semibold text-[#751F2B]">{label}</p>

          <p className="mt-1 text-xs leading-5 text-[#82766D]">

            No products with images available in this category yet.

          </p>

        </div>

      </div>

    );

  }



  const active = images[activeIndex];



  return (

    <button

      type="button"

      onClick={() => onOpen(active.product)}

      aria-label={`View ${active.product.name || label}`}

      className="group relative block h-full min-h-48 w-full overflow-hidden bg-[#F0E9E1] text-left"

    >

      {images.map((item, index) => (

        <img

          key={`${item.product._id || item.product.name}-${index}`}

          src={item.image}

          alt={item.product.name || label}

          loading={index === 0 ? "eager" : "lazy"}

          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${

            index === activeIndex

              ? "opacity-100"

              : "pointer-events-none opacity-0"

          }`}

        />

      ))}



      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />



      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">

            {label}

          </p>

          <p className="mt-1 text-base font-bold text-white sm:text-lg">

            {active.product.name}

          </p>

        </div>



        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#751F2B] transition group-hover:scale-105">

          →

        </span>

      </div>



      {images.length > 1 && (

        <div className="absolute right-4 top-4 flex gap-1.5">

          {images.map((item, index) => (

            <span

              key={`${item.product._id || item.product.name}-dot`}

              className={`h-1.5 rounded-full transition-all ${

                index === activeIndex

                  ? "w-5 bg-white"

                  : "w-1.5 bg-white/60"

              }`}

            />

          ))}

        </div>

      )}

    </button>

  );

}



export default function Home({ searchParams, navigate }) {

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [heroIndex, setHeroIndex] = useState(0);



  const search = searchParams.get("search")?.trim() || "";

  const selectedCategory = searchParams.get("category")?.trim() || "";

  // Bring filtered products into view after a category or search is selected.
  useEffect(() => {
    if (!selectedCategory && !search) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedCategory, search]);



  useEffect(() => {

    let active = true;



    async function loadProducts() {

      try {

        setLoading(true);

        setError("");



        const data = await api("/products?available=true");



        if (!active) return;



        setProducts(Array.isArray(data.products) ? data.products : []);

      } catch (err) {

        if (!active) return;

        setError(err.message || "Unable to load products.");

      } finally {

        if (active) setLoading(false);

      }

    }



    loadProducts();



    return () => {

      active = false;

    };

  }, []);



  const availableProducts = useMemo(

    () => products.filter((product) => product?.isAvailable !== false),

    [products]

  );



  const categoryProducts = useMemo(

    () =>

      CATEGORIES.map((category) => ({

        ...category,

        products: availableProducts.filter(

          (product) => getProductCategory(product) === category.name

        ),

      })),

    [availableProducts]

  );



  // Never use products from another category as hero fallbacks.

  const heroProducts = useMemo(() => {

    const result = [];



    for (const categoryName of ["Chicken", "Mutton", "Fish"]) {

      const category = categoryProducts.find(

        (item) => item.name === categoryName

      );



      const product = category?.products.find((item) =>

        Boolean(getProductImage(item))

      );



      if (product) result.push(product);

    }



    return result;

  }, [categoryProducts]);



  useEffect(() => {

    setHeroIndex(0);

  }, [heroProducts]);



  useEffect(() => {

    if (heroProducts.length < 2) return undefined;



    const interval = window.setInterval(() => {

      setHeroIndex((current) => (current + 1) % heroProducts.length);

    }, 3000);



    return () => window.clearInterval(interval);

  }, [heroProducts]);



  const visibleProducts = useMemo(() => {

    let result = availableProducts;



    if (selectedCategory) {

      const categoryName = CATEGORIES.find(

        (category) =>

          category.name.toLowerCase() === selectedCategory.toLowerCase()

      )?.name;



      result = categoryName

        ? result.filter(

            (product) => getProductCategory(product) === categoryName

          )

        : [];

    }



    if (search) {

      const normalizedSearch = search.toLowerCase();



      result = result.filter((product) =>

        `${product.name || ""} ${product.description || ""} ${

          product.category || ""

        }`

          .toLowerCase()

          .includes(normalizedSearch)

      );

    }



    return result;

  }, [availableProducts, search, selectedCategory]);



  const openProduct = (product) => {

    if (product?._id) {

      navigate(`/product/${product._id}`);

    }

  };



  const openCategory = (category) => {

    navigate(`/?category=${encodeURIComponent(category.name)}`);

  };



  const clearFilters = () => {

    navigate("/");

  };



  const heroProduct = heroProducts[heroIndex];



  const selectedCategoryName =

    CATEGORIES.find(

      (category) =>

        category.name.toLowerCase() === selectedCategory.toLowerCase()

    )?.name || "";



  return (

    <>

      {/* HERO */}

      <section className="overflow-hidden bg-[#F7F4EF]">

        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-16">

          <div>

            <span className="inline-flex rounded-full border border-[#751F2B]/15 bg-white px-3.5 py-2 text-[10px] font-bold tracking-[0.17em] text-[#751F2B]">

              MADE FOR YOUR KITCHEN

            </span>



            <h1 className="mt-5 text-4xl font-black leading-[1.03] tracking-[-0.055em] text-[#292321] sm:text-5xl lg:text-6xl">

              Order Fresh Chicken Online in Delhi

              <br />

              <span className="text-[#751F2B]">From Dilli Cuts</span>

            </h1>



            <p className="mt-5 max-w-lg text-sm leading-7 text-[#746B65] sm:text-base">

              Shop chicken cuts and other meat options from Dilli Cuts. Browse available products,
              compare prices, and check delivery availability for your area in Delhi.

            </p>



            <div className="mt-7 flex flex-wrap gap-3">

              <button

                type="button"

                onClick={clearFilters}

                className="rounded-xl bg-[#751F2B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5D1721]"

              >

                Shop all products →

              </button>



              <a

                href="#categories"

                className="rounded-xl border border-[#E5DED5] bg-white px-5 py-3 text-sm font-bold text-[#292321] transition hover:border-[#751F2B]/30"

              >

                Explore categories

              </a>

            </div>



            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#E5DED5] pt-5 text-xs text-[#746B65]">

              {CATEGORIES.map((category) => (

                <a
                  key={category.name}
                  href={`/?category=${encodeURIComponent(category.name)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    openCategory(category);
                  }}
                  className="transition hover:text-[#751F2B]"
                >
                  {category.name} in Delhi
                </a>

              ))}

            </div>

          </div>



          <div className="relative mx-auto w-full max-w-xl">

            {heroProduct ? (

              <button

                type="button"

                onClick={() => openProduct(heroProduct)}

                className="group relative block aspect-[5/4] w-full overflow-hidden rounded-3xl bg-[#EDE3D8] text-left shadow-sm"

              >

                {heroProducts.map((product, index) => (

                  <img

                    key={product._id || product.name}

                    src={getProductImage(product)}

                    alt={product.name}

                    loading={index === heroIndex ? "eager" : "lazy"}

                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${

                      index === heroIndex

                        ? "opacity-100"

                        : "pointer-events-none opacity-0"

                    }`}

                  />

                ))}



                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />



                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">

                    Explore the selection

                  </p>



                  <div className="mt-2 flex items-end justify-between gap-4">

                    <div>

                      <h2 className="text-2xl font-bold text-white sm:text-3xl">

                        {heroProduct.name}

                      </h2>

                      <p className="mt-1 text-sm text-white/80">

                        {getProductCategory(heroProduct)}

                      </p>

                    </div>



                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-[#751F2B] transition group-hover:scale-105">

                      →

                    </span>

                  </div>

                </div>



                {heroProducts.length > 1 && (

                  <div className="absolute right-4 top-4 flex gap-1.5">

                    {heroProducts.map((product, index) => (

                      <span

                        key={`${product._id || product.name}-hero-dot`}

                        className={`h-1.5 rounded-full transition-all ${

                          index === heroIndex

                            ? "w-5 bg-white"

                            : "w-1.5 bg-white/60"

                        }`}

                      />

                    ))}

                  </div>

                )}

              </button>

            ) : (

              <div className="flex aspect-[5/4] items-center justify-center rounded-3xl bg-[#EDE3D8] p-6 text-center">

                <p className="max-w-xs text-sm leading-6 text-[#746B65]">

                  Add available Chicken, Mutton or Fish products with images

                  to display them here.

                </p>

              </div>

            )}



            <div className="mt-3 grid grid-cols-3 gap-3">

              {["Chicken", "Mutton", "Fish"].map((name) => {

                const category = categoryProducts.find(

                  (item) => item.name === name

                );



                const imageProduct = category?.products.find((product) =>

                  Boolean(getProductImage(product))

                );



                return (

                  <button

                    key={name}

                    type="button"

                    onClick={() => openCategory({ name })}

                    className="group relative h-20 overflow-hidden rounded-xl bg-[#EDE3D8] text-left sm:h-24"

                  >

                    {imageProduct && (

                      <img

                        src={getProductImage(imageProduct)}

                        alt={name}

                        loading="lazy"

                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"

                      />

                    )}



                    <span className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />

                    <span className="absolute bottom-2 left-2 text-xs font-bold text-white sm:bottom-3 sm:left-3">

                      {name}

                    </span>

                  </button>

                );

              })}

            </div>

          </div>

        </div>

      </section>



      {/* CATEGORY CARDS */}

      <section id="categories" className="bg-white py-12 sm:py-16">

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#751F2B]">

                Find your favourite

              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#292321] sm:text-3xl">

                Shop by category

              </h2>

            </div>



            <button

              type="button"

              onClick={clearFilters}

              className="text-xs font-bold text-[#751F2B] hover:underline"

            >

              View all products ↓

            </button>

          </div>



          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {categoryProducts.map((category) => (

              <article

                key={category.name}

                className="group overflow-hidden rounded-2xl border border-[#E5DED5] bg-[#FAF8F5] transition hover:-translate-y-0.5 hover:shadow-lg"

              >

                <div className="relative h-48 overflow-hidden sm:h-52">

                  <ImageCarousel

                    products={category.products}

                    label={category.name.toUpperCase()}

                    onOpen={openProduct}

                  />

                </div>



                <button

                  type="button"

                  onClick={() => openCategory(category)}

                  className="flex w-full items-center justify-between gap-3 p-4 text-left"

                >

                  <div>

                    <h3 className="text-base font-bold text-[#292321]">

                      {category.name}

                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#82766D]">

                      {category.description}

                    </p>

                    <p className="mt-2 text-[11px] text-[#82766D]">

                      {category.products.length} products

                    </p>

                  </div>



                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5DED5] bg-white text-[#751F2B] transition group-hover:bg-[#751F2B] group-hover:text-white">

                    →

                  </span>

                </button>

              </article>

            ))}

          </div>

        </div>

      </section>



      {/* LOCAL SEO CONTENT: keep this accurate to the areas actually served. */}
      <section aria-labelledby="delhi-meat-heading" className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#751F2B]">
            Dilli Cuts · Delhi
          </p>
          <h2 id="delhi-meat-heading" className="mt-2 text-2xl font-black tracking-tight text-[#292321] sm:text-3xl">
            Buy Chicken Online in Delhi with Dilli Cuts
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#746B65] sm:text-base">
            Looking for chicken online in Delhi? Explore the products currently listed on Dilli Cuts,
            check product details and prices, and confirm whether delivery is available in your area
            before placing an order. Product selection and availability may change.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#751F2B]">
            <a href="/?category=Chicken" onClick={(event) => { event.preventDefault(); openCategory({ name: "Chicken" }); }} className="hover:underline">
              Chicken in Delhi
            </a>
            <a href="/?category=Mutton" onClick={(event) => { event.preventDefault(); openCategory({ name: "Mutton" }); }} className="hover:underline">
              Mutton in Delhi
            </a>
            <a href="/?category=Fish" onClick={(event) => { event.preventDefault(); openCategory({ name: "Fish" }); }} className="hover:underline">
              Fish in Delhi
            </a>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}

      <section

        id="products"

        className="scroll-mt-6 bg-[#F7F4EF] py-12 sm:py-16"

      >

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#751F2B]">

                {selectedCategoryName

                  ? "Selected category"

                  : search

                    ? "Your search"

                    : "Explore the selection"}

              </p>



              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#292321] sm:text-3xl">

                {selectedCategoryName ||

                  (search ? `Results for "${search}"` : "All available products")}

              </h2>



              {!loading && !error && (

                <p className="mt-1.5 text-xs text-[#82766D]">

                  {visibleProducts.length}{" "}

                  {visibleProducts.length === 1 ? "product" : "products"}

                </p>

              )}

            </div>



            {(selectedCategory || search) && (

              <button

                type="button"

                onClick={clearFilters}

                className="rounded-lg border border-[#E5DED5] bg-white px-4 py-2.5 text-xs font-bold text-[#751F2B] transition hover:border-[#751F2B]/40"

              >

                Show all products

              </button>

            )}

          </div>



          {loading && (

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {Array.from({ length: 4 }).map((_, index) => (

                <div

                  key={index}

                  className="animate-pulse overflow-hidden rounded-2xl border border-[#E5DED5] bg-white"

                >

                  <div className="h-52 bg-black/5" />

                  <div className="space-y-3 p-4">

                    <div className="h-3 w-20 rounded bg-black/10" />

                    <div className="h-5 w-36 rounded bg-black/10" />

                    <div className="h-4 w-full rounded bg-black/10" />

                    <div className="h-9 w-full rounded bg-black/10" />

                  </div>

                </div>

              ))}

            </div>

          )}



          {!loading && error && (

            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">

              <h3 className="text-lg font-bold text-[#292321]">

                Couldn't load products

              </h3>

              <p className="mt-2 text-sm text-[#82766D]">{error}</p>

              <button

                type="button"

                onClick={() => window.location.reload()}

                className="mt-5 rounded-xl bg-[#751F2B] px-5 py-3 text-sm font-bold text-white hover:bg-[#5D1721]"

              >

                Try again

              </button>

            </div>

          )}



          {!loading && !error && visibleProducts.length > 0 && (

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {visibleProducts.map((product) => (

                <ProductCard

                  key={product._id}

                  product={product}

                  navigate={navigate}

                />

              ))}

            </div>

          )}



          {!loading && !error && visibleProducts.length === 0 && (

            <div className="rounded-2xl border border-dashed border-[#D9CEC3] bg-white px-5 py-12 text-center">

              <h3 className="text-lg font-bold text-[#292321]">

                No products in this category yet

              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#82766D]">

                Try another category or browse all available products.

              </p>

              <button

                type="button"

                onClick={clearFilters}

                className="mt-5 rounded-xl bg-[#751F2B] px-5 py-3 text-sm font-bold text-white hover:bg-[#5D1721]"

              >

                Show all products

              </button>

            </div>

          )}

        </div>

      </section>

    </>

  );

}
