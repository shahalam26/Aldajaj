import express from "express";

import {
  createTestPayment,
  verifyTestPayment,
  cashfreeWebhook,
} from "../controller/payment.controller.js";

const router = express.Router();

router.post("/test", createTestPayment);

router.get("/test/verify/:orderId", verifyTestPayment);

router.post("/webhook", cashfreeWebhook);

export default router;