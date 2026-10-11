
function Footer() {
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shopLinks = [
    { label: "Chicken", search: "chicken" },
    { label: "Mutton", search: "mutton" },
    { label: "Fish", search: "fish" },
    { label: "Ready to Cook", search: "ready to cook" },
  ];

  const helpLinks = [
    { label: "Track your order", path: "/orders" },
    { label: "My account", path: "/profile" },
    { label: "Sign in", path: "/login" },
  ];

  return (
    <footer className="overflow-hidden bg-[#211B19] text-white">
      {/* Brand CTA */}
      <div className="border-b border-white/10 bg-[#751F2B]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 sm:px-8 sm:py-10 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
              Your next favourite meal starts here
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Good food starts with a good cut.
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-white/75">
              From everyday chicken to special-occasion cuts, find what your
              kitchen needs at Dilli Cuts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-3 rounded-xl bg-[#FFF9F1] px-5 py-3 text-sm font-bold text-[#751F2B] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#751F2B]"
          >
            Explore the shop
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-5 pb-7 pt-10 sm:px-8 sm:pt-12 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand story */}
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="button"
              onClick={() => navigateTo("/")}
              aria-label="Dilli Cuts home"
              className="text-left"
            >
              <span className="text-2xl font-black tracking-[-0.07em]">
                DILLI
                <span className="ml-1 text-[#E7A6A4]">CUTS</span>
              </span>
            </button>

            <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
              Your kitchen, your recipes, your choice of cuts. Dilli Cuts
              brings together the products you need to make everyday meals
              and weekend feasts your own.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Everyday meals", "Family feasts", "Your recipes"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-white/65"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Shop categories */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
              Explore the shop
            </h3>

            <ul className="mt-5 space-y-3">
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo(`/?search=${encodeURIComponent(item.search)}`)
                    }
                    className="group flex items-center gap-2 text-left text-sm text-white/55 transition hover:text-white"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#B97C75] transition group-hover:bg-[#F1C9C5]" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => navigateTo("/")}
              className="mt-5 text-xs font-semibold text-[#E7A6A4] transition hover:text-white"
            >
              Browse all products →
            </button>
          </div>

          {/* Customer account */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
              Your account
            </h3>

            <ul className="mt-5 space-y-3">
              {helpLinks.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    className="group flex items-center gap-2 text-left text-sm text-white/55 transition hover:text-white"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#B97C75] transition group-hover:bg-[#F1C9C5]" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
              <p className="text-xs font-semibold text-white/85">
                Need to check an order?
              </p>
              <p className="mt-1.5 text-xs leading-5 text-white/45">
                Visit your orders page to review your order details and
                available status updates.
              </p>
            </div>
          </div>

          {/* Brand values */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
              The Dilli Cuts approach
            </h3>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#E7A6A4]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="m12 3 7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m9 12 2 2 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/85">
                    Quality matters
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Choose products thoughtfully for the meal you want to make.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#E7A6A4]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 7h16M4 12h16M4 17h10"
                      strokeLinecap="round"
                    />
                    <circle cx="18" cy="17" r="2" />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/85">
                    Find your cut
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Explore the available products and choose what suits
                    your recipe.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#E7A6A4]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3v18M3 12h18"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/85">
                    Made for your kitchen
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    From quick weekday cooking to meals worth sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-10 border-t border-white/10 pt-5 sm:mt-12">
          <div className="flex flex-col gap-3 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Dilli Cuts. All rights reserved.
            </p>

            <p className="leading-5">
              Thoughtful cuts. Memorable meals.
            </p>

            <button
              type="button"
              onClick={() => navigateTo("/")}
              className="w-fit font-semibold text-white/60 transition hover:text-white"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
