import express from "express";

import {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getInventory,
  adjustStock,
} from "../controller/product.controller.js";

import adminOnly from "../middleware/admin.middleware.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

// ===============================
// PUBLIC ROUTES
// ===============================

router.get("/", getProduct);

router.get("/:id", getProductById);

// ===============================
// ADMIN ROUTES
// ===============================

// Create product
router.post(
  "/",
  authenticate,
  adminOnly,
  createProduct
);

// Inventory
router.get(
  "/inventory",
  authenticate,
  adminOnly,
  getInventory
);

// Update product
router.patch(
  "/:id",
  authenticate,
  adminOnly,
  updateProduct
);

// Update stock directly
router.patch(
  "/:id/stock",
  authenticate,
  adminOnly,
  updateProductStock
);

// Adjust stock (+/-)
router.patch(
  "/:id/adjust-stock",
  authenticate,
  adminOnly,
  adjustStock
);

// Delete product
router.delete(
  "/:id",
  authenticate,
  adminOnly,
  deleteProduct
);

export default router;