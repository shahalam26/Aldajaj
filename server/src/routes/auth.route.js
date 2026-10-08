import express from "express";

import {
  registerUser,
  loginUser,
  requestOTP,
  verifyOTP,
  adminLogin,
} from "../controller/auth.controller.js";

import authRateLimit from "../middleware/authRateLimit.middleware.js";

const router = express.Router();

router.post("/register", authRateLimit, registerUser);

router.post("/login", authRateLimit, loginUser);

router.post("/admin-login", authRateLimit, adminLogin);

router.post("/request-otp", authRateLimit, requestOTP);

router.post("/verify-otp", authRateLimit, verifyOTP);

export default router;