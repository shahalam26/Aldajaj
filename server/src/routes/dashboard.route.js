import express from "express";

import {
  getTodayDashboard,
} from "../controller/dashboard.controller.js";

import authenticate from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

const router = express.Router();

router.get(
  "/today",
  authenticate,
  adminOnly,
  getTodayDashboard
);

export default router;