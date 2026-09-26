import Product from "../model/product.model.js"


const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      category,
      weight,
      stock,
      isAvailable,
    } = req.body;

    if (
      !name ||
      !description ||
      !image ||
      !category ||
      price === undefined ||
      weight === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All required product fields are required",
      });
    }

    if (price < 0 || weight <= 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product values",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      image: image.trim(),
      category: category.trim(),
      weight,
      stock: stock ?? 0,
      isAvailable: isAvailable ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProduct=async(req,res)=>{
    try{

    const products = await Product.find().select("-stock");
    res.status(200).json({
        success:true,
        products,
    })
    }
    catch(error){
        res.status(500).json({
            success:false,
            message: error.message,
        })
    }
}

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).select("-stock");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "name",
      "description",
      "price",
      "image",
      "category",
      "weight",
      "stock",
      "isAvailable",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    if (updates.weight !== undefined && updates.weight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Weight must be greater than 0",
      });
    }

    if (updates.stock !== undefined && updates.stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    if (updates.name !== undefined) {
      updates.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    if (updates.category !== undefined) {
      updates.category = updates.category.trim();
    }

    if (updates.image !== undefined) {
      updates.image = updates.image.trim();
    }

    const product = await Product.findByIdAndUpdate(
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
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Stock is required",
      });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative integer",
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { stock },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Adjustment quantity is required",
      });
    }

    if (!Number.isInteger(quantity) || quantity === 0) {
      return res.status(400).json({
        success: false,
        message: "Adjustment quantity must be a non-zero integer",
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        $inc: {
          stock: quantity,
        },
      },
      {
        new: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const deleteProduct=async(req,res)=>{

    try{
        const {id}=req.params;
        const product=await Product.findByIdAndDelete(id);

        if(!product){
            res.status(404).json({
                success:false,
                message:"product not found",
            })
           
        } res.status(200).json({
                success:true,
                message:"product deleted succesfully",
                product,
            })
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

const getInventory = async (req, res) => {
  try {
    const products = await Product.find()
      .select("name category price weight stock isAvailable image")
      .sort({ stock: 1 });

    res.status(200).json({
      success: true,
      inventory: products,
    });
  } catch (error) {
    res.status(500).json({
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
  deleteProduct,getInventory,adjustStock
};