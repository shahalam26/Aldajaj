function HeroSection() {
  return (
    <section className="overflow-hidden bg-[#faf7f2]">
      <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">

        {/* Content */}
        <div className="relative z-10">

          <span className="inline-flex rounded-full border border-[#c62828]/20 bg-[#c62828]/5 px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#c62828]">
            FRESHNESS YOU CAN TASTE
          </span>

          <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            Fresh cuts.
            <br />
            <span className="text-[#c62828]">
              Delivered fast.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-black/60 sm:text-lg">
            Premium quality chicken, freshly cut and packed with care.
            Straight from Dilli Cuts to your doorstep.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">

            <button className="group flex items-center justify-center gap-4 rounded-full bg-[#c62828] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#c62828]/20 transition hover:-translate-y-0.5 hover:bg-[#9f1d1d]">
              Order now

              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>

            <button className="rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-bold transition hover:border-black/20 hover:bg-black/[0.02]">
              Explore cuts
            </button>

          </div>

          {/* Trust */}
          <div className="mt-12 flex flex-wrap gap-8 border-t border-black/10 pt-7">

            <div>
              <strong className="block text-xl font-black">
                100%
              </strong>

              <span className="text-xs text-black/50">
                Fresh
              </span>
            </div>

            <div>
              <strong className="block text-xl font-black">
                Clean
              </strong>

              <span className="text-xs text-black/50">
                Hygienic
              </span>
            </div>

            <div>
              <strong className="block text-xl font-black">
                Fast
              </strong>

              <span className="text-xs text-black/50">
                Delivery
              </span>
            </div>

          </div>
        </div>

        {/* Visual */}
        <div className="relative mx-auto flex h-[480px] w-full max-w-[560px] items-center justify-center lg:h-[560px]">

          {/* Background */}
          <div className="absolute h-[350px] w-[350px] rounded-full bg-[#c62828] sm:h-[440px] sm:w-[440px]" />

          <div className="absolute h-[390px] w-[390px] rounded-full border border-white/30 sm:h-[490px] sm:w-[490px]" />

          {/* Product placeholder */}
          <div className="relative flex h-[330px] w-[330px] flex-col items-center justify-center rounded-[45%] bg-[#ead7c8] shadow-2xl sm:h-[420px] sm:w-[420px]">

            <span className="text-[100px] drop-shadow-lg sm:text-[140px]">
              🍗
            </span>

            <span className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-[#171717]/70">
              Fresh Chicken
            </span>

          </div>

          {/* Floating card */}
          <div className="absolute left-0 top-12 flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-xl sm:left-4">

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c62828]/10 text-[#c62828]">
              ✦
            </span>

            <div>
              <strong className="block text-sm">
                Freshly Cut
              </strong>

              <small className="text-xs text-black/50">
                Made to order
              </small>
            </div>

          </div>

          {/* Delivery card */}
          <div className="absolute bottom-12 right-0 flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-xl sm:right-2">

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
              ✓
            </span>

            <div>
              <strong className="block text-sm">
                Delhi Delivery
              </strong>

              <small className="text-xs text-black/50">
                Fast doorstep delivery
              </small>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default HeroSection;