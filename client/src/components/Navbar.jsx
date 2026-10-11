
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  const icons = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.2 4.2" />
      </>
    ),
    location: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7.5" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    cart: (
      <>
        <path d="M2.5 3h2.7l2.3 12.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.5L22 8H6" />
        <circle cx="9.5" cy="20" r="1.3" />
        <circle cx="18" cy="20" r="1.3" />
      </>
    ),
    menu: <path d="M3 7h18M3 12h18M3 17h18" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return <svg {...common}>{icons[name]}</svg>;
}

export default function Navbar({ navigate }) {
  const { user, logout } = useAuth();
  const { count } = useCart();

  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const submit = (event) => {
    event.preventDefault();

    const query = search.trim();
    goTo(query ? `/?search=${encodeURIComponent(query)}` : "/");
  };

  // Categories must use the category query, NOT the search query.
  const openCategory = (category) => {
    goTo(`/?category=${encodeURIComponent(category)}`);
  };

  const accountPath = user
    ? user.role === "admin"
      ? "/admin"
      : "/profile"
    : "/login";

  const navLinks = [
    { label: "Shop", action: () => goTo("/") },
    { label: "Chicken", action: () => openCategory("Chicken") },
    { label: "Mutton", action: () => openCategory("Mutton") },
    { label: "Fish", action: () => openCategory("Fish") },
    {
      label: "Ready to Cook",
      action: () => openCategory("Ready to Cook"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5DED5] bg-[#FAF7F2]/95 text-[#242321] shadow-[0_2px_12px_rgba(36,35,33,0.035)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[78px] max-w-[1600px] items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:min-h-[90px] lg:gap-6 lg:px-10">
        <button
          type="button"
          onClick={() => goTo("/")}
          aria-label="Dilli Cuts home"
          className="flex shrink-0 items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#751F2B]"
        >
          <span className="flex h-10 w-10 items-center justify-center font-serif text-[30px] font-black tracking-[-0.13em] text-[#751F2B] sm:h-12 sm:w-12 sm:text-[35px]">
            DC
          </span>

          <span className="flex flex-col gap-1">
            <span className="whitespace-nowrap text-[17px] font-black leading-none tracking-[-0.055em] sm:text-xl lg:text-2xl">
              DILLI <span className="text-[#751F2B]">CUTS</span>
            </span>
            <span className="whitespace-nowrap text-[7px] font-bold tracking-[0.17em] text-[#82776E] sm:text-[8px]">
              PREMIUM FRESH MEAT
            </span>
          </span>
        </button>

        <nav
          aria-label="Main navigation"
          className="hidden shrink-0 items-center gap-4 xl:flex 2xl:gap-6"
        >
          {navLinks.map((link, index) => (
            <button
              key={link.label}
              type="button"
              onClick={link.action}
              className={`relative whitespace-nowrap py-3 text-xs font-semibold transition hover:text-[#751F2B] 2xl:text-[13px] ${
                index === 0 ? "text-[#751F2B]" : "text-[#48413B]"
              }`}
            >
              {link.label}
              {index === 0 && (
                <span className="absolute inset-x-0 bottom-1 h-0.5 rounded-full bg-[#751F2B]" />
              )}
            </button>
          ))}
        </nav>

        <form
          onSubmit={submit}
          role="search"
          className="ml-auto flex h-10 min-w-0 max-w-[420px] flex-1 items-center gap-2 rounded-full border border-[#E5DED5] bg-white px-3 transition focus-within:border-[#B77D83] focus-within:ring-2 focus-within:ring-[#751F2B]/10 sm:h-11 sm:gap-3 sm:px-4"
        >
          <Icon
            name="search"
            className="h-[18px] w-[18px] shrink-0 text-[#82776E]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
            placeholder="Search cuts..."
            className="min-w-0 flex-1 bg-transparent text-xs text-[#242321] outline-none placeholder:text-[#948A81] sm:text-sm"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="shrink-0 text-lg leading-none text-[#82776E] hover:text-[#751F2B]"
            >
              ×
            </button>
          )}

          <button
            type="submit"
            aria-label="Submit search"
            className="hidden rounded-full bg-[#751F2B] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#5C1721] sm:block"
          >
            Search
          </button>
        </form>

        <div className="hidden shrink-0 items-center gap-3 border-l border-[#E5DED5] pl-4 2xl:flex">
          <Icon name="location" className="h-6 w-6 text-[#751F2B]" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#82776E]">
              Delivery details
            </span>
            <button
              type="button"
              onClick={() => goTo(user ? "/profile" : "/login")}
              className="whitespace-nowrap text-left text-xs font-bold hover:text-[#751F2B]"
            >
              Check availability
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo(accountPath)}
          aria-label={user ? "Open account" : "Login"}
          className="hidden shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[#39332E] transition hover:text-[#751F2B] sm:flex"
        >
          <Icon name="user" className="h-[22px] w-[22px]" />
          <span className="max-w-[90px] truncate text-[10px] font-semibold">
            {user ? user.name || "Account" : "Login"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => goTo("/cart")}
          aria-label={`Open cart, ${count} items`}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5DED5] bg-white text-[#242321] transition hover:border-[#751F2B] hover:text-[#751F2B] sm:h-11 sm:w-11"
        >
          <Icon name="cart" className="h-[21px] w-[21px]" />
          <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-[#FAF7F2] bg-[#751F2B] px-1 text-[9px] font-extrabold text-white">
            {count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5DED5] bg-white text-[#242321] xl:hidden"
        >
          <Icon name={menuOpen ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#E5DED5] bg-[#FFFCF8] px-4 py-4 shadow-lg sm:px-6 xl:hidden">
          <nav
            aria-label="Mobile navigation"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.action}
                className="rounded-xl border border-[#E5DED5] bg-white px-4 py-3 text-left text-sm font-semibold text-[#39332E] transition hover:border-[#751F2B]/40 hover:bg-[#F5EAE5] hover:text-[#751F2B]"
              >
                {link.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goTo(accountPath)}
              className="rounded-xl border border-[#E5DED5] bg-white px-4 py-3 text-left text-sm font-semibold hover:bg-[#F5EAE5]"
            >
              {user ? "My account" : "Login / Sign up"}
            </button>

            {user && (
              <button
                type="button"
                onClick={() => goTo("/orders")}
                className="rounded-xl border border-[#E5DED5] bg-white px-4 py-3 text-left text-sm font-semibold hover:bg-[#F5EAE5]"
              >
                My orders
              </button>
            )}

            {user && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="rounded-xl border border-[#E5DED5] bg-white px-4 py-3 text-left text-sm font-semibold text-[#751F2B] hover:bg-[#F5EAE5]"
              >
                Logout
              </button>
            )}
          </nav>

          <button
            type="button"
            onClick={() => goTo(user ? "/profile" : "/login")}
            className="mt-3 flex w-full items-center gap-2 rounded-xl bg-[#F2E8E1] px-4 py-3 text-left text-xs text-[#751F2B] 2xl:hidden"
          >
            <Icon name="location" className="h-5 w-5" />
            <span>
              <span className="block font-medium">Delivery details</span>
              <span className="mt-1 block font-bold">
                Check availability
              </span>
            </span>
          </button>
        </div>
      )}
    </header>
  );
}
