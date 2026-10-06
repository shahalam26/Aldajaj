import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import PaymentResult from "./pages/PaymentResult";
import Admin from "./pages/Admin";
import { useAuth } from "./context/AuthContext";

function useLocationPath() {
  const [url, setUrl] = useState(() => window.location.href);
  useEffect(() => {
    const onPop = () => setUrl(window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (to) => {
    window.history.pushState({}, "", to);
    setUrl(window.location.href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return { url, navigate };
}

export default function App() {
  const { url, navigate } = useLocationPath();
  const { user } = useAuth();
  const current = new URL(url);
  const path = current.pathname;
  const searchParams = current.searchParams;

  const page = useMemo(() => {
    if (path === "/login") return <Login navigate={navigate} />;
    if (path === "/cart") return <Cart navigate={navigate} />;
    if (path === "/checkout") return user ? <Checkout navigate={navigate} /> : <Login navigate={navigate} />;
    if (path === "/orders") return user ? <Orders /> : <Login navigate={navigate} />;
    if (path === "/profile") return user ? <Profile navigate={navigate} /> : <Login navigate={navigate} />;
    if (path === "/payment/success") return user ? <PaymentResult navigate={navigate} /> : <Login navigate={navigate} />;
    if (path === "/admin") return user?.role === "admin" ? <Admin navigate={navigate} /> : <Login navigate={navigate} />;
    return <Home searchParams={searchParams} />;
  }, [path, searchParams.toString(), user]);

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#171717]">
      <Navbar navigate={navigate} />
      <main>{page}</main>
      <footer className="bg-[#111] px-5 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div><b className="text-2xl tracking-[-.06em]">DILLI<span className="text-[#ef5350]"> CUTS</span></b><p className="mt-2 text-sm text-white/45">Fresh cuts. Straight to your door.</p></div>
          <span className="text-xs text-white/35">© 2026 Dilli Cuts · Made for Delhi</span>
        </div>
      </footer>
    </div>
  );
}
