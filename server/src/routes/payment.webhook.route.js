import express from "express";

import { cashfreeWebhook } from "../controller/payment.controller.js";

const router = express.Router();

router.post("/", cashfreeWebhook);

export default router;