function CategoryCard({ name, description, emoji }) {
  return (
    <div className="category-card">
      <div className="category-image">
        <span>{emoji}</span>
      </div>

      <div className="category-info">
        <div>
          <h3>{name}</h3>
          <p>{description}</p>
        </div>

        <button>→</button>
      </div>
    </div>
  );
}

export default CategoryCard;