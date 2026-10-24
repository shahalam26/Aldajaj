
import CategoryCard from "./CategoryCard";

function CategoriesSection() {
  return (
    <section
      className="categories-section"
      aria-labelledby="categories-heading"
    >
      <div className="section-heading">
        <div>
          <span>SHOP FRESH</span>

          <h2 id="categories-heading">
            Shop Fresh Chicken &amp; Meat Online
          </h2>
        </div>

        <button
          className="view-all-btn"
          type="button"
          aria-label="View all product categories"
        >
          View all →
        </button>
      </div>

      <div
        className="category-grid"
        aria-label="Browse product categories"
      >
        <CategoryCard
          name="Chicken"
          description="Fresh whole chicken"
          emoji="🍗"
        />

        <CategoryCard
          name="Boneless"
          description="Boneless chicken, cleaned and ready to cook"
          emoji="🥩"
        />

        <CategoryCard
          name="Chicken Breast"
          description="Chicken breast for protein-rich meals"
          emoji="🍖"
        />

        <CategoryCard
          name="Ready to Cook"
          description="Marinated options for convenient cooking"
          emoji="🔥"
        />
      </div>
    </section>
  );
}

export default CategoriesSection;
