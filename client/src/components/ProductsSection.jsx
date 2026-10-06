import ProductCard from "./ProductCard";

function ProductsSection() {
  return (
    <section className="products-section">

      <div className="section-heading">

        <div>
          <span>FRESH PICKS</span>
          <h2>Popular cuts</h2>
        </div>

        <button className="view-all-btn">
          Shop all →
        </button>

      </div>

      <div className="product-grid">

        <ProductCard
          name="Chicken Curry Cut"
          description="Fresh bone-in curry pieces"
          price="₹220"
          weight="500g"
        />

        <ProductCard
          name="Chicken Breast"
          description="Skinless & boneless"
          price="₹280"
          weight="500g"
        />

        <ProductCard
          name="Chicken Leg"
          description="Juicy whole leg pieces"
          price="₹250"
          weight="500g"
        />

        <ProductCard
          name="Chicken Wings"
          description="Perfect for snacks & grills"
          price="₹240"
          weight="500g"
        />

      </div>

    </section>
  );
}

export default ProductsSection;