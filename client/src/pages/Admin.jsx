import { useEffect, useMemo, useRef, useState } from "react";
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

const navItems = [
  { id: "dashboard", label: "Overview", icon: "grid" },
  { id: "products", label: "Products", icon: "box" },
  { id: "orders", label: "Orders", icon: "orders" },
  { id: "pos", label: "Point of Sale", icon: "pos" },
];

const statusStyles = {
  ACCEPTED: "bg-blue-50 text-blue-700 ring-blue-100",
  PROCESSING: "bg-amber-50 text-amber-700 ring-amber-100",
  PACKED: "bg-violet-50 text-violet-700 ring-violet-100",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 ring-orange-100",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELLED: "bg-red-50 text-red-700 ring-red-100",
};

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    box: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h12a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2Z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </>
    ),
    pos: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h10M7 13h3M13 13h4M7 16h5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    plus: <><path d="M12 5v14M5 12h14" /></>,
    edit: (
      <>
        <path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-2L4 18v2Z" />
        <path d="m13.5 7.5 3 3" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L4 8" />
        <path d="M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2" />
        <path d="M20 20v-4h-4" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    logout: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="m15 16 4-4-4-4M19 12H9" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m4 17 5-5 3 3 2-2 6 5" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    phone: (
      <>
        <path d="M7 3h3l1.5 4-2 1.5a14 14 0 0 0 6 6l1.5-2L21 14v3c0 2-2 3-4 3C10 20 4 14 4 7c0-2 1-4 3-4Z" />
      </>
    ),
    trend: (
      <>
        <path d="M4 17 9 12l3 3 7-8" />
        <path d="M15 7h4v4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function StatCard({ label, value, note, icon, tone = "dark" }) {
  const tones = {
    dark: "bg-[#171717] text-white",
    cream: "bg-[#fffaf4] text-[#171717]",
    red: "bg-[#c92d2d] text-white",
    green: "bg-[#eaf7ef] text-[#174d2b]",
  };

  return (
    <div className={`rounded-[24px] p-5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold ${tone === "dark" || tone === "red" ? "text-white/55" : "text-black/45"}`}>
            {label}
          </p>
          <p className="mt-3 text-[30px] font-black tracking-[-0.05em]">
            {value}
          </p>
          {note && (
            <p className={`mt-1 text-xs ${tone === "dark" || tone === "red" ? "text-white/45" : "text-black/45"}`}>
              {note}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          tone === "dark" || tone === "red" ? "bg-white/10" : "bg-black/5"
        }`}>
          <Icon name={icon} size={18} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c62828]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-[22px] font-black tracking-[-0.04em] text-[#171717]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-black/45">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export default function Admin({ navigate }) {
  const { user, logout } = useAuth();

  const [tab, setTab] = useState("dashboard");
  const [dash, setDash] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [form, setForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [existingImagePublicIds, setExistingImagePublicIds] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [stockDrafts, setStockDrafts] = useState({});
  const fileInputRef = useRef(null);

  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const [d, p, o] = await Promise.all([
        api("/dashboard/today"),
        api("/products/inventory"),
        api("/orders"),
      ]);

      setDash(d.dashboard);
      setProducts(p.inventory || []);
      setOrders(o.orders || []);

      const drafts = {};
      (p.inventory || []).forEach((product) => {
        drafts[product._id] = String(product.stock ?? 0);
      });
      setStockDrafts(drafts);
    } catch (error) {
      setMessage(error.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/admin-login");
      return;
    }
    load();
  }, [user]);

  const resetProductForm = () => {
    imagePreviews.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
    });

    setForm({ ...emptyProduct });
    setEditingProduct(null);
    setExistingImages([]);
    setExistingImagePublicIds([]);
    setSelectedImages([]);
    setImagePreviews([]);
    setMessage("");

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEditProduct = (product) => {
    imagePreviews.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
    });

    setEditingProduct(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      category: product.category || "Chicken",
      weight: product.weight ?? 500,
      stock: product.stock ?? 0,
      isAvailable: product.isAvailable !== false,
    });

    setExistingImages(
      Array.isArray(product.images) && product.images.length
        ? [...product.images]
        : product.image
          ? [product.image]
          : []
    );

    setExistingImagePublicIds(
      Array.isArray(product.imagePublicIds)
        ? [...product.imagePublicIds]
        : []
    );

    setSelectedImages([]);
    setImagePreviews([]);
    setMessage("");
    setTab("products");

    if (fileInputRef.current) fileInputRef.current.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeExistingImage = (index) => {
    setExistingImages((current) => current.filter((_, i) => i !== index));
    setExistingImagePublicIds((current) => current.filter((_, i) => i !== index));
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const totalImages = existingImages.length + selectedImages.length + files.length;

    if (totalImages > 8) {
      setMessage("Maximum 8 images are allowed per product.");
      event.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setMessage(`${file.name}: Only JPG, JPEG, PNG and WEBP images are allowed.`);
        event.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage(`${file.name}: Image must be 5MB or smaller.`);
        event.target.value = "";
        return;
      }
    }

    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setSelectedImages((current) => [...current, ...files]);
    setImagePreviews((current) => [...current, ...previews]);
    setMessage("");
    event.target.value = "";
  };

  const removeSelectedImage = (index) => {
    setSelectedImages((current) => current.filter((_, i) => i !== index));
    setImagePreviews((current) => {
      const item = current[index];
      if (item?.url) URL.revokeObjectURL(item.url);
      return current.filter((_, i) => i !== index);
    });
  };

  const uploadProductImages = async () => {
    if (!selectedImages.length) {
      return { images: [], imagePublicIds: [] };
    }

    const formData = new FormData();
    selectedImages.forEach((file) => formData.append("images", file));

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
        imagePublicIds: data.images.map((item) => item.publicId),
      };
    } finally {
      setUploadingImages(false);
    }
  };

  const saveProduct = async () => {
    setMessage("");

    if (!form.name.trim()) return setMessage("Product name is required.");
    if (!form.description.trim()) return setMessage("Product description is required.");
    if (!form.category.trim()) return setMessage("Product category is required.");

    const price = Number(form.price);
    const weight = Number(form.weight);
    const stock = Number(form.stock);

    if (!Number.isFinite(price) || price < 0) {
      return setMessage("Enter a valid non-negative price.");
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      return setMessage("Weight must be greater than 0.");
    }

    if (!Number.isFinite(stock)) {
      return setMessage("Enter a valid stock value.");
    }

    if (existingImages.length + selectedImages.length > 8) {
      return setMessage("Maximum 8 images are allowed.");
    }

    try {
      setSavingProduct(true);

      const uploaded = await uploadProductImages();
      const finalImages = [...existingImages, ...(uploaded.images || [])];
      const finalPublicIds = [
        ...existingImagePublicIds,
        ...(uploaded.imagePublicIds || []),
      ];

      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category.trim(),
        weight,
        stock,
        isAvailable: form.isAvailable,
        image: finalImages[0] || "",
        images: finalImages,
        imagePublicIds: finalPublicIds,
      };

      if (editingProduct) {
        await api(`/products/${editingProduct._id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setMessage("Product updated successfully.");
      } else {
        await api("/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setMessage("Product created successfully.");
      }

      resetProductForm();
      await load();
    } catch (error) {
      setMessage(error.message || "Failed to save product.");
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis will permanently delete the product and its Cloudinary images.`
    );
    if (!confirmed) return;

    try {
      setMessage("");
      await api(`/products/${product._id}`, { method: "DELETE" });

      if (editingProduct?._id === product._id) {
        resetProductForm();
      }

      setMessage("Product deleted successfully.");
      await load();
    } catch (error) {
      setMessage(error.message || "Failed to delete product.");
    }
  };

  const handleStockDraftChange = (productId, value) => {
    setStockDrafts((current) => ({
      ...current,
      [productId]: value,
    }));
  };

  const saveProductStock = async (product) => {
    const stock = Number(stockDrafts[product._id]);

    if (!Number.isFinite(stock)) {
      return setMessage("Stock must be a valid number.");
    }

    try {
      await api(`/products/${product._id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      });
      setMessage(`${product.name} stock updated to ${stock}.`);
      await load();
    } catch (error) {
      setMessage(error.message || "Failed to update stock.");
    }
  };

  const adjustProductStock = async (product, quantity) => {
    try {
      await api(`/products/${product._id}/adjust-stock`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      await load();
      setMessage(
        `${product.name} stock ${quantity > 0 ? "increased" : "decreased"}.`
      );
    } catch (error) {
      setMessage(error.message || "Failed to adjust stock.");
    }
  };

  const status = async (id, next) => {
    try {
      await api(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setMessage("Order status updated.");
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const lookup = async () => {
    if (!phone.trim()) return setMessage("Enter customer phone number.");

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

  const posAdd = (product) =>
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.product === product._id);

      if (existing) {
        return currentCart.map((item) =>
          item.product === product._id
            ? { ...item, quantity: item.quantity + 1 }
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

  const posCreate = async () => {
    if (!customer) return setMessage("Select customer first.");
    if (!cart.length) return setMessage("Add products to the bill.");

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

  const totalRevenue = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0
      ),
    [orders]
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock) <= 0),
    [products]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [imagePreviews]);

  if (user?.role !== "admin") return null;

  const currentNav = navItems.find((item) => item.id === tab);

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-[#171717]">

      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/5 bg-[#f6f5f2]/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileNav(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
        >
          <Icon name="grid" />
        </button>

        <div className="text-center">
          <p className="text-[9px] font-black tracking-[0.2em] text-[#c62828]">
            DILLI CUTS
          </p>
          <p className="text-sm font-black">Admin</p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
        >
          <Icon name="logout" size={17} />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            onClick={() => setMobileNav(false)}
            className="absolute inset-0 bg-black/45"
          />
          <aside className="relative h-full w-[280px] bg-[#151515] p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-black tracking-[-0.06em]">
                  DILLI<span className="text-[#ef5350]"> CUTS</span>
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Store control
                </p>
              </div>
              <button
                onClick={() => setMobileNav(false)}
                className="rounded-xl bg-white/10 p-2"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <nav className="mt-10 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setMobileNav(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    tab === item.id
                      ? "bg-white text-[#171717]"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-[1600px]">

        {/* DESKTOP SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-[245px] shrink-0 flex-col bg-[#151515] p-5 text-white lg:flex">
          <div className="px-3 pt-3">
            <p className="text-[25px] font-black tracking-[-0.07em]">
              DILLI<span className="text-[#ef5350]"> CUTS</span>
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
              Store control center
            </p>
          </div>

          <div className="mt-10">
            <p className="px-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
              Workspace
            </p>

            <nav className="mt-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                    tab === item.id
                      ? "bg-white text-[#171717]"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      tab === item.id
                        ? "bg-[#171717] text-white"
                        : "bg-white/5"
                    }`}
                  >
                    <Icon name={item.icon} size={17} />
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="rounded-[22px] bg-white/[0.055] p-4">
              <p className="text-xs font-bold text-white/80">
                Store status
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-white/45">
                  Online & accepting orders
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/45 hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                <Icon name="logout" size={17} />
              </span>
              Sign out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1 px-4 pb-10 sm:px-6 lg:px-9">

          {/* TOP BAR */}
          <header className="hidden h-[88px] items-center justify-between lg:flex">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c62828]">
                {currentNav?.label || "Admin"}
              </p>
              <h1 className="mt-1 text-[24px] font-black tracking-[-0.05em]">
                {tab === "dashboard"
                  ? "Good to see you, Admin."
                  : currentNav?.label}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3.5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-50"
              >
                <Icon name="refresh" size={15} />
                {loading ? "Refreshing" : "Refresh"}
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171717] text-white">
                  <Icon name="user" size={16} />
                </div>
                <div className="pr-2">
                  <p className="text-xs font-black">
                    {user?.username || "Administrator"}
                  </p>
                  <p className="text-[10px] text-black/35">
                    Store admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* MESSAGE */}
          {message && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf7ef] text-[#1c7540]">
                  <Icon name="check" size={14} />
                </span>
                <span className="font-semibold">{message}</span>
              </div>
              <button
                onClick={() => setMessage("")}
                className="text-black/30 hover:text-black"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          {/* =================================================
              DASHBOARD
          ================================================= */}
          {tab === "dashboard" && dash && (
            <div className="space-y-6">

              <section className="rounded-[30px] bg-[#171717] p-6 text-white sm:p-8">
                <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                  <div className="max-w-xl">
                    <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                      Today at Dilli Cuts
                    </span>
                    <h2 className="mt-4 text-[32px] font-black leading-[1.02] tracking-[-0.06em] sm:text-[42px]">
                      Keep the cuts fresh,
                      <br />
                      keep the store moving.
                    </h2>
                    <p className="mt-4 max-w-md text-sm leading-6 text-white/45">
                      A quick view of orders, sales, customers and stock
                      health across your store.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <div className="rounded-2xl bg-white/10 px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                        Today
                      </p>
                      <p className="mt-1 text-xl font-black">
                        ₹{dash.todaySales || 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#c62828] px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                        Orders
                      </p>
                      <p className="mt-1 text-xl font-black">
                        {dash.todayOrders || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Today's orders"
                  value={dash.todayOrders || 0}
                  note={`${dash.pendingOrders || 0} currently pending`}
                  icon="orders"
                  tone="cream"
                />
                <StatCard
                  label="Today's sales"
                  value={`₹${dash.todaySales || 0}`}
                  note={`${dash.onlineOrders || 0} online · ${dash.posOrders || 0} POS`}
                  icon="trend"
                  tone="dark"
                />
                <StatCard
                  label="Customers"
                  value={dash.totalCustomers || 0}
                  note={`+${dash.newCustomersToday || 0} new today`}
                  icon="user"
                  tone="green"
                />
                <StatCard
                  label="Stock alerts"
                  value={
                    (dash.lowStockProducts || 0) +
                    (dash.negativeStockProducts || 0)
                  }
                  note={`${dash.negativeStockProducts || 0} negative stock`}
                  icon="box"
                  tone="red"
                />
              </section>

              <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">

                <section className="rounded-[26px] bg-white p-5 shadow-[0_8px_35px_rgba(0,0,0,.04)]">
                  <SectionHeader
                    eyebrow="Live"
                    title="Recent orders"
                    description="Latest activity from your store."
                    action={
                      <button
                        onClick={() => setTab("orders")}
                        className="flex items-center gap-2 rounded-xl bg-black px-3.5 py-2.5 text-xs font-bold text-white"
                      >
                        View all
                        <Icon name="arrow" size={13} />
                      </button>
                    }
                  />

                  {orders.length === 0 ? (
                    <div className="rounded-2xl bg-[#f7f6f3] px-5 py-12 text-center">
                      <p className="font-bold">No orders yet</p>
                      <p className="mt-1 text-xs text-black/40">
                        New orders will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left">
                        <thead>
                          <tr className="border-b border-black/5 text-[10px] uppercase tracking-wider text-black/35">
                            <th className="px-3 py-3 font-black">Order</th>
                            <th className="px-3 py-3 font-black">Customer</th>
                            <th className="px-3 py-3 font-black">Status</th>
                            <th className="px-3 py-3 text-right font-black">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 6).map((order) => (
                            <tr key={order._id} className="border-b border-black/[.04] last:border-0">
                              <td className="px-3 py-4">
                                <p className="text-xs font-black">
                                  #{order._id.slice(-8).toUpperCase()}
                                </p>
                                <p className="mt-1 text-[10px] text-black/35">
                                  {order.paymentMethod || "COD"}
                                </p>
                              </td>
                              <td className="px-3 py-4">
                                <p className="text-xs font-bold">
                                  {order.user?.name || "Customer"}
                                </p>
                                <p className="mt-1 text-[10px] text-black/35">
                                  {order.user?.phone || "—"}
                                </p>
                              </td>
                              <td className="px-3 py-4">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ring-1 ${statusStyles[order.status] || "bg-black/5 text-black/50 ring-black/5"}`}>
                                  {order.status || "PENDING"}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-right text-sm font-black">
                                ₹{order.totalAmount || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-[26px] bg-white p-5 shadow-[0_8px_35px_rgba(0,0,0,.04)]">
                  <SectionHeader
                    eyebrow="Inventory"
                    title="Needs attention"
                    description="Products at or below zero stock."
                  />

                  {lowStockProducts.length === 0 ? (
                    <div className="rounded-2xl bg-[#eaf7ef] p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#237545]">
                          <Icon name="check" size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-black text-[#174d2b]">
                            Inventory looks healthy
                          </p>
                          <p className="mt-1 text-xs text-[#174d2b]/55">
                            No products need attention.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lowStockProducts.slice(0, 7).map((product) => (
                        <button
                          key={product._id}
                          onClick={() => {
                            setTab("products");
                            startEditProduct(product);
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl bg-[#f7f6f3] p-3 text-left hover:bg-[#f0eee9]"
                        >
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black/5">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                🍗
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black">
                              {product.name}
                            </p>
                            <p className="mt-1 text-[10px] text-black/40">
                              {product.category}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            product.stock < 0
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {product.stock}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* =================================================
              PRODUCTS
          ================================================= */}
          {tab === "products" && (
            <div className="space-y-6">

              <section className="rounded-[30px] bg-white p-5 shadow-[0_8px_35px_rgba(0,0,0,.04)] sm:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c62828]">
                      Catalogue
                    </p>
                    <h2 className="mt-1 text-[28px] font-black tracking-[-0.05em]">
                      Product management
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-black/45">
                      Manage your cuts, pricing, availability, images and
                      inventory from one clean workspace.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      resetProductForm();
                      document.getElementById("product-editor")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#c62828] px-5 py-3 text-xs font-black text-white shadow-[0_8px_20px_rgba(198,40,40,.18)]"
                  >
                    <Icon name="plus" size={15} />
                    New product
                  </button>
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[390px_1fr]">

                {/* EDITOR */}
                <section
                  id="product-editor"
                  className="rounded-[28px] bg-[#171717] p-5 text-white shadow-[0_8px_35px_rgba(0,0,0,.08)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ef5350]">
                        {editingProduct ? "Editing item" : "New item"}
                      </p>
                      <h3 className="mt-1 text-xl font-black tracking-[-0.04em]">
                        {editingProduct ? editingProduct.name : "Add a product"}
                      </h3>
                    </div>

                    {editingProduct && (
                      <button
                        onClick={resetProductForm}
                        className="rounded-xl bg-white/10 p-2 text-white/60 hover:text-white"
                      >
                        <Icon name="close" size={15} />
                      </button>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Product name
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Chicken Breast"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/25"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={3}
                        placeholder="Fresh, cleaned and ready to cook."
                        className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/25"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Category
                      </label>
                      <input
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                        placeholder="Chicken"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/25"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                          Price
                        </label>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={form.price}
                            onChange={(e) =>
                              setForm({ ...form, price: e.target.value })
                            }
                            className="w-full rounded-2xl border border-white/10 bg-white/[.07] py-3 pl-8 pr-3 text-sm outline-none focus:border-white/25"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                          Weight
                        </label>
                        <div className="relative mt-2">
                          <input
                            type="number"
                            min="1"
                            value={form.weight}
                            onChange={(e) =>
                              setForm({ ...form, weight: e.target.value })
                            }
                            className="w-full rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 pr-12 text-sm outline-none focus:border-white/25"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                            g
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) =>
                          setForm({ ...form, stock: e.target.value })
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm outline-none focus:border-white/25"
                      />
                      <p className="mt-2 text-[10px] text-white/30">
                        Zero and negative stock are allowed. Availability
                        controls whether customers can order.
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[.05] p-4">
                      <div>
                        <p className="text-xs font-black">
                          Available for ordering
                        </p>
                        <p className="mt-1 text-[10px] text-white/35">
                          Customers can add this item to cart.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.isAvailable}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            isAvailable: e.target.checked,
                          })
                        }
                        className="h-5 w-5 accent-[#ef5350]"
                      />
                    </label>

                    {/* IMAGES */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                            Product images
                          </label>
                          <p className="mt-1 text-[10px] text-white/25">
                            Up to 8 · 5MB each
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={
                            existingImages.length + selectedImages.length >= 8
                          }
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-[#171717] disabled:opacity-30"
                        >
                          Add images
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

                      {(existingImages.length > 0 ||
                        imagePreviews.length > 0) ? (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {existingImages.map((image, index) => (
                            <div
                              key={`old-${image}-${index}`}
                              className="group relative aspect-square overflow-hidden rounded-xl bg-white/10"
                            >
                              <img
                                src={image}
                                alt={`${form.name} ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                              {index === 0 && (
                                <span className="absolute left-1 top-1 rounded-full bg-black/80 px-1.5 py-1 text-[7px] font-black text-white">
                                  MAIN
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          {imagePreviews.map((item, index) => (
                            <div
                              key={`new-${item.url}-${index}`}
                              className="group relative aspect-square overflow-hidden rounded-xl bg-white/10"
                            >
                              <img
                                src={item.url}
                                alt={`New preview ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                              {existingImages.length === 0 &&
                                index === 0 && (
                                  <span className="absolute left-1 top-1 rounded-full bg-black/80 px-1.5 py-1 text-[7px] font-black text-white">
                                    MAIN
                                  </span>
                                )}
                              <button
                                type="button"
                                onClick={() => removeSelectedImage(index)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-3 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-7 text-center hover:border-white/25"
                        >
                          <Icon name="image" size={24} />
                          <p className="mt-2 text-xs font-bold text-white/60">
                            Upload product photography
                          </p>
                          <p className="mt-1 text-[10px] text-white/25">
                            JPG, PNG or WEBP
                          </p>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={saveProduct}
                      disabled={savingProduct || uploadingImages}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c62828] py-3.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(198,40,40,.18)] disabled:opacity-40"
                    >
                      {uploadingImages
                        ? "Uploading images..."
                        : savingProduct
                          ? editingProduct
                            ? "Updating product..."
                            : "Creating product..."
                          : editingProduct
                            ? "Save changes"
                            : "Create product"}
                      {!savingProduct && !uploadingImages && (
                        <Icon name="arrow" size={15} />
                      )}
                    </button>

                    {editingProduct && (
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="w-full rounded-2xl border border-white/10 py-3 text-xs font-bold text-white/55 hover:text-white"
                      >
                        Cancel editing
                      </button>
                    )}
                  </div>
                </section>

                {/* PRODUCT LIST */}
                <section className="min-w-0">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-black/35">
                        {products.length} total
                      </p>
                    </div>
                    <button
                      onClick={load}
                      className="flex items-center gap-2 rounded-xl border border-black/7 bg-white px-3 py-2 text-xs font-bold shadow-sm"
                    >
                      <Icon name="refresh" size={14} />
                      Refresh
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="rounded-[28px] bg-white p-12 text-center shadow-[0_8px_35px_rgba(0,0,0,.04)]">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f1eb] text-2xl">
                        🍗
                      </div>
                      <h3 className="mt-4 font-black">
                        No products yet
                      </h3>
                      <p className="mt-1 text-sm text-black/40">
                        Create your first product from the editor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.map((product) => (
                        <div
                          key={product._id}
                          className="group rounded-[25px] border border-black/[.045] bg-white p-4 shadow-[0_6px_25px_rgba(0,0,0,.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,.07)]"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px] bg-[#f4f1eb]">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-3xl">
                                  🍗
                                </div>
                              )}
                              <span
                                className={`absolute bottom-1.5 left-1.5 rounded-full px-2 py-1 text-[8px] font-black ${
                                  product.isAvailable
                                    ? "bg-white text-emerald-700"
                                    : "bg-white text-red-700"
                                }`}
                              >
                                {product.isAvailable ? "LIVE" : "OFF"}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-sm font-black">
                                  {product.name}
                                </h3>
                                <span className="rounded-full bg-black/[.04] px-2 py-1 text-[8px] font-black uppercase text-black/40">
                                  {product.category}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-black/40">
                                {product.weight}g ·{" "}
                                {product.images?.length || 0} photos
                              </p>

                              <div className="mt-3 flex items-center gap-3">
                                <span className="text-sm font-black">
                                  ₹{product.price}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-black/15" />
                                <span
                                  className={`text-[10px] font-bold ${
                                    product.stock < 0
                                      ? "text-red-600"
                                      : product.stock === 0
                                        ? "text-amber-600"
                                        : "text-emerald-600"
                                  }`}
                                >
                                  {product.stock < 0
                                    ? "Negative stock"
                                    : product.stock === 0
                                      ? "Out of stock"
                                      : "In stock"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-2xl bg-[#f7f6f3] p-2">
                              <button
                                onClick={() => adjustProductStock(product, -1)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black shadow-sm"
                              >
                                <Icon name="minus" size={14} />
                              </button>

                              <input
                                type="number"
                                value={
                                  stockDrafts[product._id] ??
                                  product.stock ??
                                  0
                                }
                                onChange={(e) =>
                                  handleStockDraftChange(
                                    product._id,
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveProductStock(product);
                                  }
                                }}
                                className="w-14 bg-transparent text-center text-xs font-black outline-none"
                              />

                              <button
                                onClick={() => adjustProductStock(product, 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#171717] text-white shadow-sm"
                              >
                                <Icon name="plus" size={14} />
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => saveProductStock(product)}
                                className="rounded-xl border border-black/7 px-3 py-2 text-[10px] font-black"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => startEditProduct(product)}
                                className="flex items-center gap-1.5 rounded-xl bg-black px-3 py-2 text-[10px] font-black text-white"
                              >
                                <Icon name="edit" size={12} />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteProduct(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                title="Delete product"
                              >
                                <Icon name="trash" size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* =================================================
              ORDERS
          ================================================= */}
          {tab === "orders" && (
            <div className="space-y-6">
              <section className="rounded-[30px] bg-[#171717] p-6 text-white sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ef5350]">
                      Order desk
                    </p>
                    <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em]">
                      Keep every order moving.
                    </h2>
                    <p className="mt-2 text-sm text-white/40">
                      Update fulfilment status as orders move through the store.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-5 py-4">
                    <p className="text-[9px] uppercase tracking-wider text-white/35">
                      Total order value
                    </p>
                    <p className="mt-1 text-xl font-black">
                      ₹{totalRevenue}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_35px_rgba(0,0,0,.04)] sm:p-6">
                <SectionHeader
                  eyebrow={`${orders.length} orders`}
                  title="All orders"
                  description="Process, pack and deliver."
                />

                {orders.length === 0 ? (
                  <div className="rounded-2xl bg-[#f7f6f3] p-12 text-center">
                    <p className="font-black">No orders found.</p>
                    <p className="mt-1 text-xs text-black/40">
                      Customer and POS orders will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-[22px] border border-black/[.05] bg-[#fcfbf9] p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#171717] text-xs font-black text-white">
                              #
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black">
                                #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="mt-1 text-xs text-black/40">
                                {order.user?.name || "Customer"} ·{" "}
                                {order.user?.phone || "No phone"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-black/30">
                                Payment
                              </p>
                              <p className="mt-1 text-xs font-black">
                                {order.paymentMethod || "COD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-black/30">
                                Total
                              </p>
                              <p className="mt-1 text-sm font-black">
                                ₹{order.totalAmount || 0}
                              </p>
                            </div>
                          </div>

                          <div className="lg:w-[340px]">
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "ACCEPTED",
                                "PROCESSING",
                                "PACKED",
                                "OUT_FOR_DELIVERY",
                                "DELIVERED",
                                "CANCELLED",
                              ].map((nextStatus) => (
                                <button
                                  key={nextStatus}
                                  disabled={
                                    order.status === nextStatus ||
                                    order.status === "DELIVERED" ||
                                    order.status === "CANCELLED"
                                  }
                                  onClick={() =>
                                    status(order._id, nextStatus)
                                  }
                                  className={`rounded-full border px-2.5 py-1.5 text-[8px] font-black transition disabled:cursor-not-allowed disabled:opacity-25 ${
                                    order.status === nextStatus
                                      ? "border-black bg-black text-white"
                                      : "border-black/7 bg-white text-black/55 hover:bg-black hover:text-white"
                                  }`}
                                >
                                  {nextStatus.replaceAll("_", " ")}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =================================================
              POS
          ================================================= */}
          {tab === "pos" && (
            <div className="space-y-6">

              <section className="rounded-[30px] bg-[#171717] p-6 text-white sm:p-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ef5350]">
                    Counter
                  </p>
                  <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em]">
                    Point of Sale
                  </h2>
                  <p className="mt-2 text-sm text-white/40">
                    Build a walk-in customer bill quickly from the counter.
                  </p>
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

                {/* PRODUCTS */}
                <section>
                  <SectionHeader
                    eyebrow={`${products.filter((p) => p.isAvailable).length} available`}
                    title="Choose products"
                    description="Tap a product to add it to the bill."
                  />

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {products
                      .filter((product) => product.isAvailable)
                      .map((product) => (
                        <button
                          key={product._id}
                          onClick={() => posAdd(product)}
                          className="group overflow-hidden rounded-[24px] bg-white text-left shadow-[0_8px_30px_rgba(0,0,0,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(0,0,0,.08)]"
                        >
                          <div className="h-44 overflow-hidden bg-[#f2efe9]">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl">
                                🍗
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black">
                                  {product.name}
                                </p>
                                <p className="mt-1 text-[10px] text-black/35">
                                  {product.weight}g
                                </p>
                              </div>
                              <span className="text-sm font-black">
                                ₹{product.price}
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-black/30">
                                {product.category}
                              </span>
                              <span className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[9px] font-black text-white">
                                <Icon name="plus" size={11} />
                                Add
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </section>

                {/* BILL */}
                <aside className="h-fit rounded-[28px] bg-white p-5 shadow-[0_8px_35px_rgba(0,0,0,.05)] xl:sticky xl:top-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#c62828]">
                        Current bill
                      </p>
                      <h3 className="mt-1 text-xl font-black">
                        Walk-in customer
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#f4f1eb] px-2.5 py-1 text-[9px] font-black">
                      COD
                    </span>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30">
                        <Icon name="phone" size={14} />
                      </span>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Customer phone"
                        className="w-full rounded-2xl border border-black/7 bg-[#faf9f7] py-3 pl-10 pr-3 text-xs outline-none focus:border-black/20"
                      />
                    </div>
                    <button
                      onClick={lookup}
                      className="rounded-2xl bg-[#171717] px-4 text-xs font-black text-white"
                    >
                      Find
                    </button>
                  </div>

                  {customer && (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#eaf7ef] p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#237545]">
                        <Icon name="user" size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-[#174d2b]">
                          {customer.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#174d2b]/50">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="my-5 border-t border-dashed border-black/10" />

                  {cart.length === 0 ? (
                    <div className="rounded-2xl bg-[#f7f6f3] p-8 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl">
                        🛒
                      </div>
                      <p className="mt-3 text-xs font-black">
                        Your bill is empty
                      </p>
                      <p className="mt-1 text-[10px] text-black/35">
                        Select products from the left.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.product}
                          className="flex items-center justify-between rounded-2xl bg-[#faf9f7] p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black">
                              {item.name}
                            </p>
                            <p className="mt-1 text-[10px] text-black/35">
                              ₹{item.price} × {item.quantity}
                            </p>
                          </div>
                          <p className="text-xs font-black">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 border-t border-black/7 pt-4">
                    <div className="flex items-end justify-between">
                      <span className="text-xs font-bold text-black/40">
                        Total
                      </span>
                      <span className="text-2xl font-black tracking-[-0.05em]">
                        ₹{cartTotal}
                      </span>
                    </div>

                    <button
                      onClick={posCreate}
                      disabled={!customer || cart.length === 0}
                      className="mt-4 w-full rounded-2xl bg-[#c62828] py-3.5 text-xs font-black text-white shadow-[0_10px_25px_rgba(198,40,40,.15)] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Create COD bill
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
