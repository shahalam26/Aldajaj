import mongoose from "mongoose";

import Order from "../model/order.model.js";
import Product from "../model/product.model.js";
import User from "../model/user.model.js";

import sendWhatsAppMessage from "../services/whatsapp.service.js";

import {
  buildOrderPlacedMessage,
  buildOrderStatusMessage,
} from "../services/orderMessage.service.js";

import {
  reduceStock,
  increaseStock,
} from "../services/inventory.service.js";

// =====================================================
// CREATE ONLINE ORDER
// =====================================================

const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod, addressId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    const allowedPaymentMethods = ["COD", "ONLINE"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const selectedAddress = user.addresses.id(addressId);

    if (!selectedAddress) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    const productIds = items.map((item) => item.product);

    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed in an order",
      });
    }

    const products = await Product.find({
      _id: { $in: productIds },
    });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive integer",
        });
      }

      const product = products.find(
        (p) => p._id.toString() === item.product
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Availability is controlled by admin.
      // Inventory stock does NOT block ordering.
      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available`,
        });
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // =====================================================
    // COD
    // Order creation + inventory deduction = one transaction
    // =====================================================

    if (paymentMethod === "COD") {
      const session = await mongoose.startSession();

      let order;

      try {
        await session.withTransaction(async () => {
          order = await Order.create(
            [
              {
                user: req.user._id,

                items: orderItems,

                deliveryAddress: {
                  label: selectedAddress.label,
                  addressLine: selectedAddress.addressLine,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  pincode: selectedAddress.pincode,
                  landmark: selectedAddress.landmark,
                  latitude: selectedAddress.latitude,
                  longitude: selectedAddress.longitude,
                },

                totalAmount,

                paymentMethod,

                paymentStatus: "PENDING",

                stockReduced: false,

                orderSource: "ONLINE",
              },
            ],
            { session }
          );

          order = order[0];

          // IMPORTANT:
          // Stock is NOT used to reject the order.
          // reduceStock() may result in negative stock.
          await reduceStock(orderItems, session);

          order.stockReduced = true;

          await order.save({ session });
        });
      } finally {
        await session.endSession();
      }

      await order.populate("items.product", "name price");

      const message = buildOrderPlacedMessage(order, user);

      await sendWhatsAppMessage(user.phone, message);

      return res.status(201).json({
        success: true,
        message: "COD order created successfully",
        order,
      });
    }

    // =====================================================
    // ONLINE PAYMENT
    // =====================================================

    const order = await Order.create({
      user: req.user._id,

      items: orderItems,

      deliveryAddress: {
        label: selectedAddress.label,
        addressLine: selectedAddress.addressLine,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        landmark: selectedAddress.landmark,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
      },

      totalAmount,

      paymentMethod,

      paymentStatus: "PENDING",

      stockReduced: false,

      orderSource: "ONLINE",
    });

    try {
      const { createCashfreeOrder } = await import(
        "../services/payment.service.js"
      );

      const cashfreeOrder = await createCashfreeOrder({
        orderId: order._id.toString(),
        amount: totalAmount,
        user,
      });

      order.cashfreeOrderId = cashfreeOrder.order_id;

      await order.save();

      return res.status(201).json({
        success: true,
        message: "Online payment order created",
        order,
        payment: {
          orderId: cashfreeOrder.order_id,
          paymentSessionId: cashfreeOrder.payment_session_id,
        },
      });
    } catch (paymentError) {
      await Order.findByIdAndDelete(order._id);

      console.error(
        "Cashfree order creation failed:",
        paymentError.response?.data || paymentError.message
      );

      return res.status(502).json({
        success: false,
        message: "Failed to create online payment",
        error:
          paymentError.response?.data ||
          paymentError.message,
      });
    }
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// CREATE POS ORDER
// =====================================================

const createPOSOrder = async (req, res) => {
  try {
    const {
      customerId,
      items,
      paymentMethod,
      deliveryAddress,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer is required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    const allowedPaymentMethods = ["COD", "ONLINE"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const customer = await User.findOne({
      _id: customerId,
      role: "user",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const productIds = items.map((item) => item.product);

    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed in an order",
      });
    }

    const products = await Product.find({
      _id: { $in: productIds },
    });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive integer",
        });
      }

      const product = products.find(
        (p) => p._id.toString() === item.product
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Availability is controlled by admin.
      // Inventory stock does NOT block ordering.
      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available`,
        });
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const session = await mongoose.startSession();

    let order;

    try {
      await session.withTransaction(async () => {
        const createdOrders = await Order.create(
          [
            {
              user: customer._id,

              items: orderItems,

              deliveryAddress:
                deliveryAddress || undefined,

              totalAmount,

              paymentMethod,

              orderSource: "POS",

              paymentStatus:
                paymentMethod === "COD"
                  ? "PAID"
                  : "PENDING",

              stockReduced: false,
            },
          ],
          { session }
        );

        order = createdOrders[0];

        // IMPORTANT:
        // Stock does NOT block POS orders.
        await reduceStock(orderItems, session);

        order.stockReduced = true;

        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    await order.populate("items.product", "name price");

    const message = buildOrderPlacedMessage(
      order,
      customer
    );

    await sendWhatsAppMessage(
      customer.phone,
      message
    );

    return res.status(201).json({
      success: true,
      message: "POS order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create POS order error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET ALL ORDERS - ADMIN
// =====================================================

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name phone email")
      .populate("items.product", "name image price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS - ADMIN
// =====================================================

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "PLACED",
      "ACCEPTED",
      "PROCESSING",
      "PACKED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      status === "ACCEPTED" &&
      order.paymentMethod === "ONLINE" &&
      order.paymentStatus !== "PAID"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Online order cannot be accepted before payment is successful",
      });
    }

    const allowedTransitions = {
      PLACED: ["ACCEPTED", "CANCELLED"],
      ACCEPTED: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["PACKED"],
      PACKED: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change order status from ${order.status} to ${status}`,
      });
    }

    if (
      status === "CANCELLED" &&
      order.stockReduced &&
      (
        order.status === "PLACED" ||
        order.status === "ACCEPTED"
      )
    ) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          await increaseStock(order.items, session);

          order.stockReduced = false;
          order.status = status;

          await order.save({ session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      order.status = status;

      await order.save();
    }

    const user = await User.findById(order.user);

    if (user) {
      const message = buildOrderStatusMessage(
        order,
        user
      );

      await sendWhatsAppMessage(
        user.phone,
        message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET MY ORDERS - CUSTOMER
// =====================================================

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("items.product", "name image price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET SINGLE ORDER - CUSTOMER TRACKING
// =====================================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // IMPORTANT:
    // Customer can only access their own order.
    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    }).populate(
      "items.product",
      "name image price"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get order by ID error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

export {
  createOrder,
  createPOSOrder,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
  getOrderById,
};