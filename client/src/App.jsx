import {
  useEffect,
  useState,
} from "react";

import Navbar from "./components/Navbar";

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
  const [url, setUrl] = useState(
    () => window.location.href
  );

  useEffect(() => {
    const onPop = () => {
      setUrl(window.location.href);
    };

    window.addEventListener(
      "popstate",
      onPop
    );

    return () => {
      window.removeEventListener(
        "popstate",
        onPop
      );
    };
  }, []);

  const navigate = (to) => {
    window.history.pushState(
      {},
      "",
      to
    );

    setUrl(window.location.href);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return {
    url,
    navigate,
  };
}

export default function App() {
  const { url, navigate } =
    useLocationPath();

  const { user } = useAuth();

  const current = new URL(url);

  const path = current.pathname;
  const searchParams =
    current.searchParams;

  // Dynamic product route
  const productMatch = path.match(
    /^\/product\/([^/]+)$/
  );

  let page;

  // =========================
  // ADMIN ROUTES
  // =========================

  if (path === "/admin-login") {
    page =
      user?.role === "admin" ? (
        <Admin navigate={navigate} />
      ) : (
        <AdminLogin
          navigate={navigate}
        />
      );
  }

  else if (
    path === "/admin" ||
    path.startsWith("/admin/")
  ) {
    page =
      user?.role === "admin" ? (
        <Admin navigate={navigate} />
      ) : (
        <AdminLogin
          navigate={navigate}
        />
      );
  }

  // =========================
  // PRODUCT DETAILS
  // =========================

  else if (productMatch) {
    page = (
      <ProductDetails
        productId={productMatch[1]}
        navigate={navigate}
      />
    );
  }

  // =========================
  // PUBLIC ROUTES
  // =========================

  else if (path === "/login") {
    page = (
      <Login navigate={navigate} />
    );
  }

  else if (path === "/cart") {
    page = (
      <Cart navigate={navigate} />
    );
  }

  else if (path === "/checkout") {
    page = user ? (
      <Checkout
        navigate={navigate}
      />
    ) : (
      <Login
        navigate={navigate}
      />
    );
  }

  else if (path === "/orders") {
    page = user ? (
      <Orders />
    ) : (
      <Login
        navigate={navigate}
      />
    );
  }

  else if (path === "/profile") {
    page = user ? (
      <Profile
        navigate={navigate}
      />
    ) : (
      <Login
        navigate={navigate}
      />
    );
  }

  else if (path === "/payment/success") {
    page = user ? (
      <PaymentResult
        navigate={navigate}
      />
    ) : (
      <Login
        navigate={navigate}
      />
    );
  }

  // =========================
  // HOME
  // =========================

  else {
    page = (
      <Home
        searchParams={searchParams}
        navigate={navigate}
      />
    );
  }

  // =========================
  // ADMIN LAYOUT
  // =========================

  const isAdminRoute =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/admin-login";

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#111]">
        {page}
      </div>
    );
  }

  // =========================
  // PUBLIC LAYOUT
  // =========================

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#171717]">

      <Navbar navigate={navigate} />

      <main>
        {page}
      </main>

      <footer className="bg-[#111] px-5 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <b className="text-2xl tracking-[-.06em]">
              DILLI
              <span className="text-[#ef5350]">
                {" "}CUTS
              </span>
            </b>

            <p className="mt-2 text-sm text-white/45">
              Fresh cuts. Straight to your door.
            </p>
          </div>

          <span className="text-xs text-white/35">
            © 2026 Dilli Cuts · Made for Delhi
          </span>

        </div>
      </footer>

    </div>
  );
}