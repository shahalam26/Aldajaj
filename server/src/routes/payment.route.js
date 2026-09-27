import express from "express";

import {
  createTestPayment,
  verifyTestPayment,
} from "../controller/payment.controller.js";

const router = express.Router();

// Test payment creation
router.post("/test", createTestPayment);

// Test payment verification
router.get("/test/verify/:orderId", verifyTestPayment);

export default router;