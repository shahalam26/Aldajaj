import express from "express";
import {
  createOrder,
  createPOSOrder,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
  getOrderById,cancelMyOrder,
} from "../controller/order.controller.js";

import authenticate from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

const router = express.Router();

// Customer: place online order
router.post("/", authenticate, createOrder);

// Admin/POS: create walk-in order
router.post(
  "/pos",
  authenticate,
  adminOnly,
  createPOSOrder
);

// Customer: get own orders
router.get(
  "/my-orders",
  authenticate,
  getMyOrders
);

// Customer: get single own order
router.get(
  "/:id",
  authenticate,
  getOrderById
);

// Admin: get all orders
router.get(
  "/",
  authenticate,
  adminOnly,
  getAllOrders
);

// Admin: update order status
router.patch(
  "/:id/status",
  authenticate,
  adminOnly,
  updateOrderStatus
);
router.patch(
  "/:id/cancel",
  authenticate,
  cancelMyOrder
);

export default router;