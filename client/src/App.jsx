
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import PaymentResult from "./pages/PaymentResult";
import ProductDetails from "./pages/ProductDetails";

import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

import { useAuth } from "./context/AuthContext";

function useLocationPath() {
  const [url, setUrl] = useState(() => window.location.href);

  useEffect(() => {
    const onPop = () => {
      setUrl(window.location.href);
    };

    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const navigate = (to, options = {}) => {
    const destination = new URL(to, window.location.origin);

    if (destination.origin !== window.location.origin) {
      window.location.assign(destination.href);
      return;
    }

    const nextUrl =
      destination.pathname + destination.search + destination.hash;

    if (!options.force && destination.href === window.location.href) {
      return;
    }

    window.history.pushState({}, "", nextUrl);
    setUrl(window.location.href);

    if (options.scroll !== false) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return { url, navigate };
}

export default function App() {
  const { url, navigate } = useLocationPath();
  const { user } = useAuth();

  const current = new URL(url);
  const path = current.pathname;
  const searchParams = current.searchParams;

  const returnTo = `${path}${current.search}${current.hash}`;

  const productMatch = path.match(/^\/product\/([^/]+)$/);

  let page;

  // ADMIN ROUTES
  if (path === "/admin-login") {
    page =
      user?.role === "admin" ? (
        <Admin navigate={navigate} />
      ) : (
        <AdminLogin navigate={navigate} />
      );
  } else if (path === "/admin" || path.startsWith("/admin/")) {
    page =
      user?.role === "admin" ? (
        <Admin navigate={navigate} />
      ) : (
        <AdminLogin navigate={navigate} />
      );
  }

  // LOGIN
  else if (path === "/login") {
    const requestedDestination = searchParams.get("returnTo");

    const destinationPath = requestedDestination
      ? requestedDestination.split(/[?#]/)[0]
      : "";

    const safeReturnTo =
      requestedDestination &&
      requestedDestination.startsWith("/") &&
      !requestedDestination.startsWith("//") &&
      destinationPath !== "/admin" &&
      !destinationPath.startsWith("/admin/") &&
      destinationPath !== "/admin-login"
        ? requestedDestination
        : null;

    page = <Login navigate={navigate} returnTo={safeReturnTo} />;
  }

  // PRODUCT DETAILS
  else if (productMatch) {
    let productId;

    try {
      productId = decodeURIComponent(productMatch[1]);
    } catch {
      productId = productMatch[1];
    }

    page = (
      <ProductDetails
        productId={productId}
        navigate={navigate}
      />
    );
  }

  // CART
  else if (path === "/cart") {
    page = <Cart navigate={navigate} />;
  }

  // CHECKOUT
  else if (path === "/checkout") {
    page = user ? (
      <Checkout navigate={navigate} />
    ) : (
      <Login navigate={navigate} returnTo={returnTo} />
    );
  }

  // ORDERS
  else if (path === "/orders") {
    page = user ? (
      <Orders navigate={navigate} />
    ) : (
      <Login navigate={navigate} returnTo={returnTo} />
    );
  }

  // PROFILE
  else if (path === "/profile") {
    page = user ? (
      <Profile navigate={navigate} />
    ) : (
      <Login navigate={navigate} returnTo={returnTo} />
    );
  }

  // PAYMENT RESULT
  else if (path === "/payment/success") {
    page = user ? (
      <PaymentResult navigate={navigate} />
    ) : (
      <Login navigate={navigate} returnTo={returnTo} />
    );
  }

  // HOME, SEARCH AND CATEGORY FILTERS
  else if (path === "/") {
    page = (
      <Home
        searchParams={searchParams}
        navigate={navigate}
      />
    );
  }

  // UNKNOWN ROUTE
  else {
    page = (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#F7F4EF] px-4 py-12">
        <div className="max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#751F2B]">
            Dilli Cuts
          </p>

          <h1 className="mt-3 font-serif text-3xl font-bold text-[#292321]">
            Page not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#82766D]">
            This page may have moved or the address may be incorrect.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-[#751F2B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5D1721]"
          >
            Back to shop
          </button>
        </div>
      </main>
    );
  }

  const isAdminRoute =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/admin-login";

  if (isAdminRoute) {
    return <div className="min-h-screen bg-[#111]">{page}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#292321]">
      <Navbar navigate={navigate} />

      <main>{page}</main>

      <Footer />
    </div>
  );
}
