import express from "express";
import {
  createOrder,
  getAllOrders,updateOrderStatus,getMyOrders
} from "../controller/order.controller.js";


import authenticate from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/", authenticate, createOrder);
router.get("/my-orders", authenticate, getMyOrders);

router.get("/", authenticate, adminOnly, getAllOrders);
router.patch(
  "/:id/status",
  authenticate,
  adminOnly,
  updateOrderStatus
);

export default router;