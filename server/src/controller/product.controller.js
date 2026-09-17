import Product from "../model/product.model.js"


const createProduct=async(req,res)=>{

    try{
        const{
            name,description,price,image,category,weight,stock,isavailable,
        }=req.body

        const product=await Product.create(
            {
                name,description,price,image,category,weight,stock,isavailable,
            }
        );
        res.status(201).json({
            success:true,
            message:"product created sucessfully",
            product
        });
    }
      catch (error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
      }
}

const getProduct=async(req,res)=>{
    try{
        const products=await Product.find()

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

    const product = await Product.findById(id);

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

const updateProduct=async(req,res)=>{
    try {
        const {id}=req.params;

        const product=await Product.findByIdAndUpdate(id,req.body,{
            new:true,
            runValidators:true,
        });
      
        if(!product){
          return  res.status(404).json({
            success:false,
            message:"product not found"
          })
        }
        res.status(200).json({
            success:true,
            message:"product updated succesfully",
            product
        })
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}


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

export {createProduct,getProduct,getProductById,updateProduct,deleteProduct}