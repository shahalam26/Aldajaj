import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";
import {
  updateProfile,
  addAddress,
  findCustomerByPhone,
  createPOSCustomer,updateAddress,deleteAddress
} from "../controller/user.controller.js";

const router = express.Router();


router.patch("/profile", authenticate, updateProfile);

router.post("/addresses", authenticate, addAddress);
router.patch(
  "/addresses/:addressId",
  authenticate,
  updateAddress
);
router.delete(
  "/addresses/:addressId",
  authenticate,
  deleteAddress
);
router.get(
  "/customer",
  authenticate,
  adminOnly,
  findCustomerByPhone
);
router.post(
  "/customer",
  authenticate,
  adminOnly,
  createPOSCustomer
);
export default router;