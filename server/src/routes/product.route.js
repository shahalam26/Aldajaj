import express from "express"
import {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getInventory,adjustStock
} from "../controller/product.controller.js";
import adminOnly from "../middleware/admin.middleware.js";
import authenticate from "../middleware/auth.middleware.js";

const router=express.Router()

router.post("/",authenticate,adminOnly, createProduct)
router.get(
  "/inventory",
  authenticate,
  adminOnly,
  getInventory
);
router.get("/", getProduct);
router.patch(
  "/:id/stock",
  authenticate,
  adminOnly,
  updateProductStock
);
router.get("/:id",getProductById);
router.patch("/:id",authenticate,adminOnly,updateProduct);
router.patch(
  "/:id/adjust-stock",
  authenticate,
  adminOnly,
  adjustStock
);
router.delete("/:id",authenticate, adminOnly, deleteProduct);

export default router;