import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  category: "Chicken",
  weight: 500,
  stock: 0,
  isAvailable: true,
};

export default function Admin({ navigate }) {
  const { user, logout } = useAuth();

  // =====================================================
  // GENERAL ADMIN STATE
  // =====================================================

  const [tab, setTab] = useState("dashboard");
  const [dash, setDash] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [message, setMessage] = useState("");

  // =====================================================
  // PRODUCT STATE
  // =====================================================

  const [form, setForm] = useState(emptyProduct);

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const fileInputRef = useRef(null);

  // =====================================================
  // POS STATE
  // =====================================================

  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);

  // =====================================================
  // LOAD ADMIN DATA
  // =====================================================

  const load = async () => {
    try {
      const [d, p, o] = await Promise.all([
        api("/dashboard/today"),
        api("/products/inventory"),
        api("/orders"),
      ]);

      setDash(d.dashboard);
      setProducts(p.inventory || []);
      setOrders(o.orders || []);
    } catch (error) {
      setMessage(error.message || "Failed to load admin data.");
    }
  };

  // =====================================================
  // ADMIN AUTH CHECK
  // =====================================================

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/login");
      return;
    }

    load();
  }, [user]);

  // =====================================================
  // PRODUCT IMAGE SELECTION
  // =====================================================

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    // Maximum 8 images
    if (files.length > 8) {
      setMessage("Maximum 8 images are allowed.");
      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    // Validate each image
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setMessage(
          `${file.name}: Only JPG, JPEG, PNG and WEBP images are allowed.`
        );

        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage(`${file.name}: Image must be 5MB or smaller.`);

        event.target.value = "";
        return;
      }
    }

    // Clear old previews
    imagePreviews.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
    });

    // Save files
    setSelectedImages(files);

    // Create previews
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImagePreviews(previews);
    setMessage("");

    // Allow selecting same file again
    event.target.value = "";
  };

  // =====================================================
  // REMOVE SELECTED IMAGE
  // =====================================================

  const removeSelectedImage = (index) => {
    setSelectedImages((current) =>
      current.filter((_, i) => i !== index)
    );

    setImagePreviews((current) => {
      const item = current[index];

      if (item?.url) {
        URL.revokeObjectURL(item.url);
      }

      return current.filter((_, i) => i !== index);
    });
  };

  // =====================================================
  // UPLOAD PRODUCT IMAGES TO CLOUDINARY
  // =====================================================

  const uploadProductImages = async () => {
    if (!selectedImages.length) {
      return {
        images: [],
        imagePublicIds: [],
      };
    }

    const formData = new FormData();

    selectedImages.forEach((file) => {
      formData.append("images", file);
    });

    setUploadingImages(true);

    try {
      const data = await api("/upload/product-images", {
        method: "POST",
        body: formData,
      });

      if (!data?.images || !Array.isArray(data.images)) {
        throw new Error("Invalid image upload response.");
      }

      return {
        images: data.images.map((item) => item.url),
        imagePublicIds: data.images.map(
          (item) => item.publicId
        ),
      };
    } finally {
      setUploadingImages(false);
    }
  };

  // =====================================================
  // CREATE PRODUCT
  // =====================================================

  const create = async () => {
    setMessage("");

    // -----------------------------
    // Validate product name
    // -----------------------------

    if (!form.name.trim()) {
      setMessage("Product name is required.");
      return;
    }

    // -----------------------------
    // Validate description
    // -----------------------------

    if (!form.description.trim()) {
      setMessage("Product description is required.");
      return;
    }

    // -----------------------------
    // Validate category
    // -----------------------------

    if (!form.category.trim()) {
      setMessage("Product category is required.");
      return;
    }

    // -----------------------------
    // Convert numeric fields
    // -----------------------------

    const price = Number(form.price);
    const weight = Number(form.weight);
    const stock = Number(form.stock);

    // -----------------------------
    // Validate price
    // -----------------------------

    if (!Number.isFinite(price) || price < 0) {
      setMessage("Enter a valid non-negative price.");
      return;
    }

    // -----------------------------
    // Validate weight
    // -----------------------------

    if (!Number.isFinite(weight) || weight <= 0) {
      setMessage("Weight must be greater than 0.");
      return;
    }

    // -----------------------------
    // Validate stock
    // IMPORTANT:
    // Negative stock is allowed.
    // -----------------------------

    if (!Number.isFinite(stock)) {
      setMessage("Enter a valid stock value.");
      return;
    }

    try {
      setCreatingProduct(true);

      // =================================================
      // STEP 1: UPLOAD IMAGES
      // =================================================

      const uploaded = await uploadProductImages();

      // =================================================
      // STEP 2: CREATE PRODUCT IN MONGODB
      // =================================================

      await api("/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          category: form.category.trim(),
          weight,
          stock,
          isAvailable: form.isAvailable,

          // First image becomes main image
          image: uploaded.images[0] || "",

          // All images
          images: uploaded.images,

          // Cloudinary public IDs
          imagePublicIds: uploaded.imagePublicIds,
        }),
      });

      // =================================================
      // STEP 3: RESET FORM
      // =================================================

      setForm({
        ...emptyProduct,
      });

      imagePreviews.forEach((item) => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });

      setSelectedImages([]);
      setImagePreviews([]);

      // =================================================
      // STEP 4: SUCCESS MESSAGE
      // =================================================

      setMessage("Product created successfully.");

      // =================================================
      // STEP 5: REFRESH ADMIN DATA
      // =================================================

      await load();
    } catch (error) {
      setMessage(
        error.message || "Failed to create product."
      );
    } finally {
      setCreatingProduct(false);
    }
  };

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const status = async (id, next) => {
    try {
      await api(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: next,
        }),
      });

      setMessage("Order status updated.");

      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // =====================================================
  // CUSTOMER LOOKUP FOR POS
  // =====================================================

  const lookup = async () => {
    if (!phone.trim()) {
      setMessage("Enter customer phone number.");
      return;
    }

    try {
      const data = await api(
        `/users/customer?phone=${encodeURIComponent(phone)}`
      );

      setCustomer(data.customer);
      setMessage("Customer found.");
    } catch (error) {
      setCustomer(null);
      setMessage(error.message);
    }
  };

  // =====================================================
  // POS ADD PRODUCT
  // =====================================================

  const posAdd = (product) =>
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product === product._id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.product === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          product: product._id,
          quantity: 1,
          price: product.price,
          name: product.name,
        },
      ];
    });

  // =====================================================
  // CREATE POS ORDER
  // =====================================================

  const posCreate = async () => {
    if (!customer) {
      setMessage("Select customer first.");
      return;
    }

    if (!cart.length) {
      setMessage("Add products to the bill.");
      return;
    }

    try {
      const data = await api("/orders/pos", {
        method: "POST",
        body: JSON.stringify({
          customerId: customer._id,

          items: cart.map((item) => ({
            product: item.product,
            quantity: item.quantity,
          })),

          paymentMethod: "COD",
        }),
      });

      setMessage(
        `POS order created: ${data.order?._id?.slice(-8) || "Success"}`
      );

      setCart([]);

      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // =====================================================
  // CLEANUP IMAGE PREVIEWS
  // =====================================================

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [imagePreviews]);

  // =====================================================
  // ADMIN PROTECTION
  // =====================================================

  if (user?.role !== "admin") {
    return null;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <p className="text-xs font-bold tracking-[.18em] text-[#c62828]">
            ADMIN
          </p>

          <h1 className="text-3xl font-black">
            Dilli Cuts Control
          </h1>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="rounded-full border px-5 py-2.5 text-sm font-bold"
        >
          Logout
        </button>

      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="mt-7 flex gap-2 overflow-x-auto">

        {[
          "dashboard",
          "products",
          "orders",
          "pos",
        ].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-full px-5 py-2.5 text-sm font-bold ${
              tab === item
                ? "bg-[#171717] text-white"
                : "bg-white"
            }`}
          >
            {item}
          </button>
        ))}

      </div>

      {/* =================================================
          GLOBAL MESSAGE
      ================================================= */}

      {message && (
        <div className="mt-4 rounded-2xl bg-black/5 p-3 text-sm">
          {message}
        </div>
      )}

      {/* =================================================
          DASHBOARD
      ================================================= */}

      {tab === "dashboard" && dash && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {[
            [
              "Today orders",
              dash.todayOrders,
            ],
            [
              "Today sales",
              `₹${dash.todaySales}`,
            ],
            [
              "Pending",
              dash.pendingOrders,
            ],
            [
              "Customers",
              dash.totalCustomers,
            ],
            [
              "New today",
              dash.newCustomersToday,
            ],
            [
              "Low stock",
              dash.lowStockProducts,
            ],
            [
              "Negative stock",
              dash.negativeStockProducts,
            ],
            [
              "Online / POS",
              `${dash.onlineOrders} / ${dash.posOrders}`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-black/50">
                {label}
              </p>

              <b className="mt-2 block text-2xl">
                {value}
              </b>
            </div>
          ))}

        </div>
      )}

      {/* =================================================
          PRODUCTS
      ================================================= */}

      {tab === "products" && (
        <div className="mt-7 grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* =============================================
              ADD PRODUCT FORM
          ============================================= */}

          <section className="rounded-3xl bg-white p-6 shadow-sm">

            <div>
              <h2 className="text-xl font-black">
                Add Product
              </h2>

              <p className="mt-1 text-sm text-black/50">
                Add chicken products to your store.
              </p>
            </div>

            {/* Product Name */}

            <label className="mt-5 block text-sm font-bold">
              Product Name
            </label>

            <input
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="Chicken Breast"
              className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#c62828]"
            />

            {/* Description */}

            <label className="mt-4 block text-sm font-bold">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              placeholder="Fresh and hygienically cleaned chicken breast."
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border px-4 py-3 outline-none focus:border-[#c62828]"
            />

            {/* Category */}

            <label className="mt-4 block text-sm font-bold">
              Category
            </label>

            <input
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value,
                })
              }
              placeholder="Chicken"
              className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#c62828]"
            />

            {/* Price + Weight */}

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div>
                <label className="text-sm font-bold">
                  Price (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: event.target.value,
                    })
                  }
                  placeholder="320"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#c62828]"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Weight (g)
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.weight}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      weight: event.target.value,
                    })
                  }
                  placeholder="500"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#c62828]"
                />
              </div>

            </div>

            {/* Stock */}

            <label className="mt-4 block text-sm font-bold">
              Stock
            </label>

            <input
              type="number"
              value={form.stock}
              onChange={(event) =>
                setForm({
                  ...form,
                  stock: event.target.value,
                })
              }
              placeholder="0"
              className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#c62828]"
            />

            <p className="mt-1 text-xs text-black/40">
              Stock can be 0 or negative. Orders are controlled
              by availability.
            </p>

            {/* Availability */}

            <label className="mt-5 flex cursor-pointer items-center gap-3">

              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  setForm({
                    ...form,
                    isAvailable: event.target.checked,
                  })
                }
                className="h-5 w-5 accent-[#c62828]"
              />

              <span className="text-sm font-bold">
                Product is available for ordering
              </span>

            </label>

            {/* =========================================
                PRODUCT IMAGES
            ========================================= */}

            <div className="mt-6">

              <div className="flex items-center justify-between gap-3">

                <div>
                  <label className="text-sm font-bold">
                    Product Images
                  </label>

                  <p className="mt-1 text-xs text-black/40">
                    JPG, PNG or WEBP · Max 5MB each · Up to
                    8 images
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={selectedImages.length >= 8}
                  className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-30"
                >
                  + Add Images
                </button>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Image Preview */}

              {imagePreviews.length > 0 ? (
                <div className="mt-4 grid grid-cols-4 gap-2">

                  {imagePreviews.map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-black/5"
                    >

                      <img
                        src={item.url}
                        alt={`Product preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {/* Main image badge */}

                      {index === 0 && (
                        <span className="absolute left-1 top-1 rounded-full bg-black px-2 py-1 text-[9px] font-bold text-white">
                          MAIN
                        </span>
                      )}

                      {/* Remove image */}

                      <button
                        type="button"
                        onClick={() =>
                          removeSelectedImage(index)
                        }
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                      >
                        ×
                      </button>

                    </div>
                  ))}

                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="mt-4 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/10 py-8 text-center hover:border-[#c62828]"
                >
                  <span className="text-3xl">
                    📷
                  </span>

                  <span className="mt-2 text-sm font-bold">
                    Upload product images
                  </span>

                  <span className="mt-1 text-xs text-black/40">
                    First image becomes the main product image
                  </span>
                </button>
              )}

            </div>

            {/* Create */}

            <button
              onClick={create}
              disabled={
                creatingProduct ||
                uploadingImages
              }
              className="mt-6 w-full rounded-2xl bg-[#c62828] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingImages
                ? "Uploading images..."
                : creatingProduct
                  ? "Creating product..."
                  : "Create Product"}
            </button>

          </section>

          {/* =============================================
              PRODUCT LIST
          ============================================= */}

          <section>

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-black">
                  Products
                </h2>

                <p className="text-sm text-black/50">
                  {products.length} product
                  {products.length === 1 ? "" : "s"} in
                  inventory
                </p>
              </div>

              <button
                onClick={load}
                className="rounded-full border px-4 py-2 text-xs font-bold"
              >
                Refresh
              </button>

            </div>

            {/* Empty State */}

            {products.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

                <div className="text-4xl">
                  🍗
                </div>

                <h3 className="mt-3 font-black">
                  No products yet
                </h3>

                <p className="mt-1 text-sm text-black/50">
                  Create your first product from the form.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {products.map((product) => (
                  <div
                    key={product._id}
                    className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                  >

                    {/* Product Image */}

                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5">

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">
                          🍗
                        </div>
                      )}

                    </div>

                    {/* Product Info */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <b className="text-base">
                          {product.name}
                        </b>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            product.isAvailable
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.isAvailable
                            ? "AVAILABLE"
                            : "UNAVAILABLE"}
                        </span>

                      </div>

                      <p className="mt-1 text-sm text-black/50">
                        {product.category} ·{" "}
                        {product.weight}g
                      </p>

                      <p className="mt-1 font-bold">
                        ₹{product.price}
                      </p>

                    </div>

                    {/* Stock */}

                    <div className="shrink-0">

                      <span
                        className={`rounded-full px-3 py-2 text-xs font-bold ${
                          product.stock < 0
                            ? "bg-red-100 text-red-700"
                            : product.stock === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        Stock {product.stock}
                      </span>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </section>

        </div>
      )}

      {/* =================================================
          ORDERS
      ================================================= */}

      {tab === "orders" && (
        <div className="mt-7 space-y-3">

          {orders.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <p className="font-bold">
                No orders found.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="rounded-3xl bg-white p-5 shadow-sm"
              >

                <div className="flex flex-wrap justify-between gap-3">

                  <div>
                    <b>
                      #
                      {order._id
                        .slice(-8)
                        .toUpperCase()}{" "}
                      ·{" "}
                      {order.user?.name ||
                        "Customer"}
                    </b>

                    <p className="text-sm text-black/50">
                      {order.user?.phone}
                    </p>
                  </div>

                  <b>
                    ₹{order.totalAmount}
                  </b>

                </div>

                <div className="mt-4 flex flex-wrap gap-2">

                  {[
                    "ACCEPTED",
                    "PROCESSING",
                    "PACKED",
                    "OUT_FOR_DELIVERY",
                    "DELIVERED",
                    "CANCELLED",
                  ].map((nextStatus) => (
                    <button
                      disabled={
                        order.status === nextStatus ||
                        order.status === "DELIVERED" ||
                        order.status === "CANCELLED"
                      }
                      key={nextStatus}
                      onClick={() =>
                        status(
                          order._id,
                          nextStatus
                        )
                      }
                      className="rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-30"
                    >
                      {nextStatus}
                    </button>
                  ))}

                </div>

              </div>
            ))
          )}

        </div>
      )}

      {/* =================================================
          POS
      ================================================= */}

      {tab === "pos" && (
        <div className="mt-7 grid gap-6 lg:grid-cols-[360px_1fr]">

          {/* =============================================
              CUSTOMER + BILL
          ============================================= */}

          <section className="rounded-3xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black">
              Walk-in Customer
            </h2>

            <div className="mt-4 flex gap-2">

              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Phone"
                className="min-w-0 flex-1 rounded-2xl border px-4 py-3"
              />

              <button
                onClick={lookup}
                className="rounded-2xl bg-[#171717] px-4 font-bold text-white"
              >
                Find
              </button>

            </div>

            {/* Customer */}

            {customer && (
              <div className="mt-4 rounded-2xl bg-black/5 p-4">

                <b>
                  {customer.name}
                </b>

                <p className="text-sm">
                  {customer.phone}
                </p>

              </div>
            )}

            {/* Bill */}

            <div className="mt-6 border-t pt-5">

              <b>
                Bill
              </b>

              {cart.length === 0 ? (
                <p className="mt-3 text-sm text-black/40">
                  No products added.
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product}
                    className="mt-2 flex justify-between text-sm"
                  >
                    <span>
                      {item.name} ×{" "}
                      {item.quantity}
                    </span>

                    <span>
                      ₹
                      {item.price *
                        item.quantity}
                    </span>
                  </div>
                ))
              )}

              {/* Total */}

              {cart.length > 0 && (
                <div className="mt-4 flex justify-between border-t pt-4 font-black">
                  <span>
                    Total
                  </span>

                  <span>
                    ₹
                    {cart.reduce(
                      (total, item) =>
                        total +
                        item.price *
                          item.quantity,
                      0
                    )}
                  </span>
                </div>
              )}

              <button
                onClick={posCreate}
                className="mt-5 w-full rounded-2xl bg-[#c62828] py-3 font-bold text-white"
              >
                Create COD Bill
              </button>

            </div>

          </section>

          {/* =============================================
              POS PRODUCTS
          ============================================= */}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {products
              .filter(
                (product) =>
                  product.isAvailable
              )
              .map((product) => (
                <button
                  key={product._id}
                  onClick={() =>
                    posAdd(product)
                  }
                  className="rounded-3xl bg-white p-5 text-left shadow-sm hover:shadow-lg"
                >

                  {/* Product Image */}

                  <div className="h-40 overflow-hidden rounded-2xl bg-black/5">

                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        🍗
                      </div>
                    )}

                  </div>

                  <b className="mt-4 block">
                    {product.name}
                  </b>

                  <p className="mt-1 text-sm text-black/50">
                    ₹{product.price}
                  </p>

                  <span className="mt-4 inline-block rounded-full bg-black px-4 py-2 text-xs font-bold text-white">
                    + Add
                  </span>

                </button>
              ))}

          </section>

        </div>
      )}

    </div>
  );
}