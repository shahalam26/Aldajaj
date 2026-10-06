function WhyCard({
  number,
  title,
  description,
}) {
  return (
    <article className="group border-t border-white/15 pt-6">

      <span className="text-xs font-bold tracking-[0.15em] text-white/40">
        {number}
      </span>

      <h3 className="mt-8 text-xl font-black tracking-tight text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-white/55">
        {description}
      </p>

    </article>
  );
}

export default WhyCard;