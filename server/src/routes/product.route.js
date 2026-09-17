import express from "express"
import { createProduct ,getProduct,getProductById,updateProduct,deleteProduct} from "../controller/product.controller.js"

const router=express.Router()

router.post("/",createProduct)
router.get("/", getProduct);
router.get("/:id",getProductById);
router.patch("/:id",updateProduct);
router.delete("/:id", deleteProduct);

export default router;