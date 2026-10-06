import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import OTP from "../model/otp.model.js";

import {
  normalizePhone,
  isValidPhone,
} from "../utils/phone.util.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!name || !normalizedEmail || !normalizedPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const requestOTP = async (req, res) => {
  try {
    const normalizedPhone = normalizePhone(req.body.phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    await OTP.deleteMany({
      phone: normalizedPhone,
      purpose: "LOGIN",
    });

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await OTP.create({
      phone: normalizedPhone,
      otpHash,
      expiresAt,
      purpose: "LOGIN",
    });

    // OTP is intentionally not logged.
    // SMS provider integration will deliver it in the dedicated OTP service step.

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const normalizedPhone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();

    if (!normalizedPhone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit number",
      });
    }

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    /*
     * Atomic OTP consumption.
     *
     * The matching OTP is deleted in the same database
     * operation that verifies it. Therefore two concurrent
     * requests cannot successfully consume the same OTP.
     */
    const consumedOTP = await OTP.findOneAndDelete({
      phone: normalizedPhone,
      purpose: "LOGIN",
      otpHash,
      expiresAt: {
        $gt: new Date(),
      },
      attempts: {
        $lt: 5,
      },
    });

    if (!consumedOTP) {
      const existingOTP = await OTP.findOne({
        phone: normalizedPhone,
        purpose: "LOGIN",
      });

      if (!existingOTP) {
        return res.status(400).json({
          success: false,
          message: "OTP not found or expired",
        });
      }

      if (existingOTP.expiresAt <= new Date()) {
        await OTP.deleteOne({
          _id: existingOTP._id,
        });

        return res.status(400).json({
          success: false,
          message: "OTP expired",
        });
      }

      if (existingOTP.attempts >= 5) {
        await OTP.deleteOne({
          _id: existingOTP._id,
        });

        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts",
        });
      }

      await OTP.updateOne(
        {
          _id: existingOTP._id,
        },
        {
          $inc: {
            attempts: 1,
          },
        }
      );

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    let user = await User.findOne({
      phone: normalizedPhone,
    });

    if (!user) {
      user = await User.create({
        name: "Customer",
        phone: normalizedPhone,
        isPhoneVerified: true,
      });
    } else if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  requestOTP,
  verifyOTP,
};