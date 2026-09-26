import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    deliveryAddress: {
      label: {
        type: String,
        enum: ["HOME", "WORK", "OTHER"],
      },

      addressLine: {
        type: String,
      },

      city: {
        type: String,
      },

      state: {
        type: String,
      },

      pincode: {
        type: String,
      },

      landmark: {
        type: String,
        default: "",
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "PLACED",
        "ACCEPTED",
        "PROCESSING",
        "PACKED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    // Cashfree payment ID
    paymentId: {
      type: String,
      default: null,
      index: true,
    },

    // Our local order ID ↔ Cashfree order ID mapping
    cashfreeOrderId: {
      type: String,
      default: null,
      index: true,
    },

    // Prevent duplicate inventory deduction
    stockReduced: {
      type: Boolean,
      default: false,
    },

    orderSource: {
      type: String,
      enum: ["ONLINE", "POS"],
      default: "ONLINE",
    },
  },

  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;