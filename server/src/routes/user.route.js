import express from "express";

import authenticate from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

import {
  getCurrentUser,
  updateProfile,
  addAddress,
  findCustomerByPhone,
  createPOSCustomer,
  updateAddress,
  deleteAddress,
} from "../controller/user.controller.js";

const router = express.Router();

// ===============================
// CUSTOMER PROFILE
// ===============================

// Get currently logged-in user
router.get(
  "/me",
  authenticate,
  getCurrentUser
);

// Update profile
router.patch(
  "/profile",
  authenticate,
  updateProfile
);

// ===============================
// CUSTOMER ADDRESSES
// ===============================

// Add new address
router.post(
  "/addresses",
  authenticate,
  addAddress
);

// Update existing address
router.patch(
  "/addresses/:addressId",
  authenticate,
  updateAddress
);

// Delete address
router.delete(
  "/addresses/:addressId",
  authenticate,
  deleteAddress
);

// ===============================
// ADMIN / POS CUSTOMER
// ===============================

// Find customer by phone
router.get(
  "/customer",
  authenticate,
  adminOnly,
  findCustomerByPhone
);

// Create POS customer
router.post(
  "/customer",
  authenticate,
  adminOnly,
  createPOSCustomer
);

export default router;