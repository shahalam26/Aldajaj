import express from "express";
import { registerUser,loginUser,requestOTP,verifyOTP } from "../controller/auth.controller.js";


const router=express.Router()

router.post("/register",registerUser);
router.post("/login",loginUser)
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);

export default router;