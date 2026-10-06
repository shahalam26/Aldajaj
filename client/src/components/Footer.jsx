function Footer() {
  return (
    <footer className="bg-[#111111] px-5 py-10 text-white sm:px-8 lg:px-10">

      <div className="mx-auto max-w-7xl">

        <div className="flex flex-col gap-8 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="text-2xl font-black tracking-[-0.06em]">
              <span>DILLI</span>
              <span className="ml-1 text-[#ef5350]">
                CUTS
              </span>
            </div>

            <p className="mt-3 text-sm text-white/45">
              Fresh cuts. Straight to your door.
            </p>

          </div>

          <div className="flex gap-6 text-sm text-white/50">
            <button className="transition hover:text-white">
              About
            </button>

            <button className="transition hover:text-white">
              Contact
            </button>

            <button className="transition hover:text-white">
              Privacy
            </button>
          </div>

        </div>

        <div className="flex flex-col gap-2 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">

          <span>
            © 2026 Dilli Cuts
          </span>

          <span>
            Made for Delhi
          </span>

        </div>

      </div>

    </footer>
  );
}

export default Footer;