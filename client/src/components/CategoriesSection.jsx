import CategoryCard from "./CategoryCard";

function CategoriesSection() {
  return (
    <section className="categories-section">

      <div className="section-heading">

        <div>
          <span>SHOP FRESH</span>
          <h2>What are you craving?</h2>
        </div>

        <button className="view-all-btn">
          View all →
        </button>

      </div>

      <div className="category-grid">

        <CategoryCard
          name="Chicken"
          description="Fresh whole chicken"
          emoji="🍗"
        />

        <CategoryCard
          name="Boneless"
          description="Clean & ready to cook"
          emoji="🥩"
        />

        <CategoryCard
          name="Chicken Breast"
          description="Lean & protein rich"
          emoji="🍖"
        />

        <CategoryCard
          name="Ready to Cook"
          description="Marinated & convenient"
          emoji="🔥"
        />

      </div>

    </section>
  );
}

export default CategoriesSection;