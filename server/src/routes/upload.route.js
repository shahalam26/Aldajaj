import express from "express";

import authenticate from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  uploadProductImages,
} from "../controller/upload.controller.js";

const router = express.Router();

/*
 * ADMIN ONLY
 *
 * Upload multiple product images.
 *
 * FormData field name:
 * images
 */
router.post(
  "/product-images",
  authenticate,
  adminOnly,
  upload.array("images", 8),
  uploadProductImages
);

export default router;