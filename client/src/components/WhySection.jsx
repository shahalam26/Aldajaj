import WhyCard from "./WhyCard";
import { whyChooseUs } from "../data/homeData";

function WhySection() {
  return (
    <section className="overflow-hidden bg-[#171717] py-20 sm:py-24">

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">

          {/* Heading */}
          <div>

            <span className="text-xs font-bold tracking-[0.18em] text-[#ef5350]">
              WHY DILLI CUTS?
            </span>

            <h2 className="mt-5 text-4xl font-black leading-[1] tracking-[-0.05em] text-white sm:text-5xl">
              Good food starts
              <br />
              with good cuts.
            </h2>

            <p className="mt-6 max-w-md text-sm leading-6 text-white/50">
              Quality chicken, careful preparation and doorstep delivery.
              Simple ingredients. Better food.
            </p>

          </div>

          {/* Cards */}
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">

            {whyChooseUs.map((item) => (
              <WhyCard
                key={item.number}
                {...item}
              />
            ))}

          </div>

        </div>

      </div>
    </section>
  );
}

export default WhySection;