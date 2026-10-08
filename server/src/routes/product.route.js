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

// ======================================================
// PUBLIC
// ======================================================

// Get all customer products
router.get("/", getProduct);

// ======================================================
// ADMIN
// ======================================================

// Get complete inventory
// IMPORTANT: must come before /:id
router.get(
  "/inventory",
  authenticate,
  adminOnly,
  getInventory
);

// Create product
router.post(
  "/",
  authenticate,
  adminOnly,
  createProduct
);

// Update complete product
router.patch(
  "/:id",
  authenticate,
  adminOnly,
  updateProduct
);

// Set exact stock
router.patch(
  "/:id/stock",
  authenticate,
  adminOnly,
  updateProductStock
);

// Increase/decrease stock
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

// ======================================================
// PUBLIC - SINGLE PRODUCT
// IMPORTANT: keep this AFTER /inventory
// ======================================================

router.get("/:id", getProductById);

export default router;