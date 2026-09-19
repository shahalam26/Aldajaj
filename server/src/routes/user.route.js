import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  updateProfile,
  addAddress,
} from "../controller/user.controller.js";

const router = express.Router();


router.patch("/profile", authenticate, updateProfile);

router.post("/addresses", authenticate, addAddress);

export default router;