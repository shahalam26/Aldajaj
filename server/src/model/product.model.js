import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Main/primary image.
     *
     * Kept for backward compatibility with
     * existing products.
     */
    image: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Cloudinary URLs.
     *
     * Example:
     *
     * [
     *   "https://res.cloudinary.com/...",
     *   "https://res.cloudinary.com/...",
     *   "https://res.cloudinary.com/..."
     * ]
     */
    images: {
      type: [String],
      default: [],
    },

    /*
     * Cloudinary public IDs.
     *
     * We keep these because later when an admin
     * deletes/replaces an image, we can delete
     * the actual image from Cloudinary too.
     */
    imagePublicIds: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    weight: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
     * IMPORTANT:
     *
     * Negative stock is allowed.
     *
     * stock = 0     -> order allowed
     * stock = -5    -> order allowed
     *
     * Actual availability is controlled by
     * isAvailable.
     */
    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    /*
     * Customer-facing availability.
     *
     * true  -> customer can order
     * false -> customer cannot order
     */
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

productSchema.index({
  name: "text",
  description: "text",
  category: "text",
});

productSchema.index({
  category: 1,
});

productSchema.index({
  isAvailable: 1,
});

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;