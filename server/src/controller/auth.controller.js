
import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OTP from "../model/otp.model.js";

import {
  normalizePhone,
  isValidPhone,
} from "../utils/phone.util.js";

import {
  sendProviderOTP,
  verifyProviderOTP,
} from "../services/messageCentral.service.js";


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
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const normalizedUsername =
      typeof username === "string"
        ? username.trim().toLowerCase()
        : "";

    if (!normalizedUsername || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({
      username: normalizedUsername,
      role: "admin",
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin username or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin username or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("adminLogin error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed",
    });
  }
};

const requestOTP = async (req, res) => {
  try {
    const normalizedPhone = normalizePhone(req.body.phone);

    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    // Remove any previous login OTP request for this phone.
    await OTP.deleteMany({
      phone: normalizedPhone,
      purpose: "LOGIN",
    });

    // Ask Message Central to generate and send the OTP.
    const {
      verificationId,
      timeoutSeconds,
    } = await sendProviderOTP(normalizedPhone);

    const expiresAt = new Date(
      Date.now() + timeoutSeconds * 1000
    );

    await OTP.create({
      phone: normalizedPhone,
      verificationId,
      expiresAt,
      purpose: "LOGIN",
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("requestOTP error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Could not send OTP. Please try again.",
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

    const pendingOTP = await OTP.findOne({
      phone: normalizedPhone,
      purpose: "LOGIN",
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!pendingOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired. Request a new OTP.",
      });
    }

    // Enforce the local failed-attempt limit.
    if (pendingOTP.attempts >= 5) {
      await OTP.deleteMany({
        phone: normalizedPhone,
        purpose: "LOGIN",
      });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    let isVerified = false;

    try {
      isVerified = await verifyProviderOTP({
        verificationId: pendingOTP.verificationId,
        code: otp,
      });
    } catch (providerError) {
      // Do not consume a valid pending request on a provider outage.
      console.error(
        "Message Central verification error:",
        providerError.message
      );

      return res.status(502).json({
        success: false,
        message: "OTP verification service is temporarily unavailable.",
      });
    }

    if (!isVerified) {
      pendingOTP.attempts += 1;

      if (pendingOTP.attempts >= 5) {
        await OTP.deleteMany({
          phone: normalizedPhone,
          purpose: "LOGIN",
        });
      } else {
        await pendingOTP.save();
      }

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Consume the verified request before issuing a session.
    await OTP.deleteMany({
      phone: normalizedPhone,
      purpose: "LOGIN",
    });

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
    console.error("verifyOTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};


export {
  registerUser,
  loginUser,
  requestOTP,
  verifyOTP,
  adminLogin,
};