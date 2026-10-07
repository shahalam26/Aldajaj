import mongoose from "mongoose";
import Product from "../model/product.model.js";

const normalizeImages = ({
  image,
  images,
  imagePublicIds,
}) => {
  let normalizedImages = [];
  let normalizedPublicIds = [];

  if (Array.isArray(images)) {
    normalizedImages = images
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (
    Array.isArray(imagePublicIds)
  ) {
    normalizedPublicIds =
      imagePublicIds
        .filter(
          (item) =>
            typeof item === "string"
        )
        .map((item) => item.trim())
        .filter(Boolean);
  }

  if (
    image &&
    typeof image === "string"
  ) {
    const trimmedImage = image.trim();

    if (
      trimmedImage &&
      !normalizedImages.includes(
        trimmedImage
      )
    ) {
      normalizedImages.unshift(
        trimmedImage
      );
    }
  }

  return {
    images: normalizedImages,
    imagePublicIds: normalizedPublicIds,
  };
};

const validateProductValues = ({
  name,
  description,
  price,
  category,
  weight,
}) => {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return "Product name is required";
  }

  if (
    typeof description !== "string" ||
    !description.trim()
  ) {
    return "Product description is required";
  }

  if (
    typeof category !== "string" ||
    !category.trim()
  ) {
    return "Product category is required";
  }

  if (
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return "Price must be a valid non-negative number";
  }

  if (
    !Number.isFinite(Number(weight)) ||
    Number(weight) <= 0
  ) {
    return "Weight must be greater than 0";
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/

const createProduct = async (
  req,
  res
) => {
  try {
    const {
      name,
      description,
      price,
      image,
      images,
      imagePublicIds,
      category,
      weight,
      stock,
      isAvailable,
    } = req.body;

    const validationError =
      validateProductValues({
        name,
        description,
        price,
        category,
        weight,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const numericStock =
      stock === undefined ||
      stock === ""
        ? 0
        : Number(stock);

    if (!Number.isFinite(numericStock)) {
      return res.status(400).json({
        success: false,
        message:
          "Stock must be a valid number",
      });
    }

    const normalized =
      normalizeImages({
        image,
        images,
        imagePublicIds,
      });

    const product =
      await Product.create({
        name: name.trim(),

        description:
          description.trim(),

        price: Number(price),

        image:
          normalized.images[0] || "",

        images:
          normalized.images,

        imagePublicIds:
          normalized.imagePublicIds,

        category:
          category.trim(),

        weight:
          Number(weight),

        /*
         * Negative stock intentionally allowed.
         */
        stock:
          numericStock,

        isAvailable:
          isAvailable === undefined
            ? true
            : Boolean(
                isAvailable
              ),
      });

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(
      "createProduct error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PRODUCTS
|--------------------------------------------------------------------------
*/

const getProduct = async (
  req,
  res
) => {
  try {
    const {
      search,
      category,
      available,
    } = req.query;

    const filter = {};

    if (
      search &&
      search.trim()
    ) {
      filter.$text = {
        $search:
          search.trim(),
      };
    }

    if (
      category &&
      category.trim()
    ) {
      filter.category =
        category.trim();
    }

    if (available === "true") {
      filter.isAvailable = true;
    }

    if (available === "false") {
      filter.isAvailable = false;
    }

    const products =
      await Product.find(filter)
        /*
         * Customer should NOT receive
         * internal stock information.
         */
        .select("-stock -imagePublicIds")
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "getProduct error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PRODUCT BY ID
|--------------------------------------------------------------------------
*/

const getProductById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    const product =
      await Product.findById(id)
        .select(
          "-stock -imagePublicIds"
        );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "getProductById error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/

const updateProduct = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "image",
      "images",
      "imagePublicIds",
      "category",
      "weight",
      "stock",
      "isAvailable",
    ];

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    if (
      Object.keys(updates)
        .length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No valid fields provided for update",
      });
    }

    if (
      updates.name !== undefined
    ) {
      if (
        typeof updates.name !==
          "string" ||
        !updates.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required",
        });
      }

      updates.name =
        updates.name.trim();
    }

    if (
      updates.description !==
      undefined
    ) {
      if (
        typeof updates.description !==
          "string" ||
        !updates.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product description is required",
        });
      }

      updates.description =
        updates.description.trim();
    }

    if (
      updates.category !==
      undefined
    ) {
      if (
        typeof updates.category !==
          "string" ||
        !updates.category.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product category is required",
        });
      }

      updates.category =
        updates.category.trim();
    }

    if (
      updates.price !==
      undefined
    ) {
      updates.price =
        Number(updates.price);

      if (
        !Number.isFinite(
          updates.price
        ) ||
        updates.price < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price must be a valid non-negative number",
        });
      }
    }

    if (
      updates.weight !==
      undefined
    ) {
      updates.weight =
        Number(updates.weight);

      if (
        !Number.isFinite(
          updates.weight
        ) ||
        updates.weight <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Weight must be greater than 0",
        });
      }
    }

    /*
     * Negative stock is allowed.
     */
    if (
      updates.stock !==
      undefined
    ) {
      updates.stock =
        Number(updates.stock);

      if (
        !Number.isFinite(
          updates.stock
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid number",
        });
      }
    }

    if (
      updates.images !==
      undefined
    ) {
      if (
        !Array.isArray(
          updates.images
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Images must be an array",
        });
      }

      updates.images =
        updates.images
          .filter(
            (item) =>
              typeof item ===
              "string"
          )
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);
    }

    if (
      updates.imagePublicIds !==
      undefined
    ) {
      if (
        !Array.isArray(
          updates.imagePublicIds
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Image public IDs must be an array",
        });
      }
    }

    if (
      updates.image !==
      undefined
    ) {
      if (
        typeof updates.image !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Main image must be a string",
        });
      }

      updates.image =
        updates.image.trim();
    }

    if (
      Array.isArray(
        updates.images
      ) &&
      updates.images.length > 0 &&
      updates.image ===
        undefined
    ) {
      updates.image =
        updates.images[0];
    }

    const product =
      await Product.findByIdAndUpdate(
        id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(
      "updateProduct error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| SET STOCK
|--------------------------------------------------------------------------
*/

const updateProductStock =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { stock } =
        req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      if (
        stock === undefined ||
        stock === "" ||
        !Number.isFinite(
          Number(stock)
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid number",
        });
      }

      const product =
        await Product.findByIdAndUpdate(
          id,
          {
            stock:
              Number(stock),
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Stock updated successfully",
        product,
      });
    } catch (error) {
      console.error(
        "updateProductStock error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/*
|--------------------------------------------------------------------------
| ADJUST STOCK
|--------------------------------------------------------------------------
*/

const adjustStock = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const { quantity } =
      req.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    const numericQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        numericQuantity
      ) ||
      numericQuantity === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Adjustment quantity must be a non-zero number",
      });
    }

    const product =
      await Product.findByIdAndUpdate(
        id,
        {
          $inc: {
            stock:
              numericQuantity,
          },
        },
        {
          new: true,
        }
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Stock adjusted successfully",
      product,
    });
  } catch (error) {
    console.error(
      "adjustStock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/

const deleteProduct = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    const product =
      await Product.findByIdAndDelete(
        id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
      product,
    });
  } catch (error) {
    console.error(
      "deleteProduct error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN INVENTORY
|--------------------------------------------------------------------------
*/

const getInventory = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find()
        .select(
          "name category price weight stock isAvailable image images imagePublicIds"
        )
        .sort({
          stock: 1,
        });

    return res.status(200).json({
      success: true,
      count: products.length,
      inventory: products,
    });
  } catch (error) {
    console.error(
      "getInventory error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getInventory,
  adjustStock,
};