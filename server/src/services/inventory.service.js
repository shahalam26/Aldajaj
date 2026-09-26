import Product from "../model/product.model.js";

const reduceStock = async (items, session = null) => {
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
        session,
      }
    );
  }
};

const increaseStock = async (items, session = null) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          stock: item.quantity,
        },
      },
      {
        session,
      }
    );
  }
};

export {
  reduceStock,
  increaseStock,
};