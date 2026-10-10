
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },

    verificationId: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: {
        expireAfterSeconds: 0,
      },
    },

    attempts: {
      type: Number,
      default: 0,
    },

    purpose: {
      type: String,
      enum: ["LOGIN", "REGISTER"],
      default: "LOGIN",
    },
  },
  {
    timestamps: true,
  }
);

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
