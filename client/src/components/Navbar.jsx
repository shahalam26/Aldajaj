import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ navigate }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [search, setSearch] = useState("");

  const submit = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(search)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf7f2]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-5 sm:px-8 lg:px-10">
        <button onClick={() => navigate("/")} className="shrink-0 text-2xl font-black tracking-[-.06em]">
          DILLI<span className="ml-1 text-[#c62828]">CUTS</span>
        </button>

        <form onSubmit={submit} className="hidden flex-1 md:block">
          <div className="mx-auto flex max-w-xl items-center rounded-full border border-black/10 bg-white px-5 py-3 shadow-sm">
            <span className="mr-3 text-xl text-black/40">⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none" placeholder="Search chicken, cuts, products..." />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <button onClick={() => navigate(user.role === "admin" ? "/admin" : "/profile")}
              className="hidden rounded-full px-3 py-2 text-sm font-bold sm:block">
              Hi, {user.name || "Customer"}
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="rounded-full px-4 py-2.5 text-sm font-bold hover:bg-black/5">
              Login
            </button>
          )}

          {user && (
            <button onClick={logout} className="hidden text-xs text-black/50 hover:text-[#c62828] lg:block">Logout</button>
          )}

          <button onClick={() => navigate("/cart")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#171717] text-white">
            🛒
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c62828] px-1 text-[10px] font-bold ring-2 ring-[#faf7f2]">{count}</span>
          </button>
        </div>
      </div>

      <div className="border-t border-black/5 px-5 py-3 md:hidden">
        <form onSubmit={submit} className="flex items-center rounded-full border border-black/10 bg-white px-4 py-2.5">
          <span className="mr-3 text-lg text-black/40">⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none" placeholder="Search chicken, cuts..." />
        </form>
      </div>
    </header>
  );
}
