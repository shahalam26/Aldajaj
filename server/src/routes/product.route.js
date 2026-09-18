import express from "express"
import { createProduct ,getProduct,getProductById,updateProduct,deleteProduct} from "../controller/product.controller.js"
import authenticate from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

const router=express.Router()

router.post("/",authenticate,adminOnly, createProduct)
router.get("/", getProduct);
router.get("/:id",getProductById);
router.patch("/:id",authenticate,adminOnly,updateProduct);
router.delete("/:id",authenticate, adminOnly, deleteProduct);

export default router;