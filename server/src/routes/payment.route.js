import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  verifyMyOrderPayment,
} from "../controller/payment.controller.js";

const router = express.Router();

// Verify payment for the logged-in customer's own order.
router.post(
  "/verify/:orderId",
  authenticate,
  verifyMyOrderPayment
);

export default router;