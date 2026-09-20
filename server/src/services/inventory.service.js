import Product from "../model/product.model.js";

const reduceStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          stock: -item.quantity,
        },
      },
      {
        runValidators: true,
      }
    );
  }
};
const increaseStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          stock: item.quantity,
        },
      }
    );
  }
};
export { reduceStock ,increaseStock};