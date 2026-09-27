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

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // Validate payment method
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

    // Get logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find selected address
    const selectedAddress = user.addresses.id(addressId);

    if (!selectedAddress) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // Get product IDs
    const productIds = items.map((item) => item.product);

    // Prevent duplicate products
    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed in an order",
      });
    }

    // Get products
    const products = await Product.find({
      _id: { $in: productIds },
    });

    let totalAmount = 0;
    const orderItems = [];

    // Validate and prepare order items
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

      // Admin-controlled availability
      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available`,
        });
      }

      // Stock is intentionally NOT checked.
      // Stock is allowed to become negative.

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create local order first
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

      paymentStatus:
        paymentMethod === "COD" ? "PENDING" : "PENDING",

      stockReduced: false,

      orderSource: "ONLINE",
    });

    // =====================================================
    // COD ORDER
    // =====================================================

    if (paymentMethod === "COD") {
      await reduceStock(orderItems);

      order.stockReduced = true;

      await order.populate("items.product", "name price");

      const message = buildOrderPlacedMessage(order, user);

      await sendWhatsAppMessage(user.phone, message);

      await order.save();

      return res.status(201).json({
        success: true,
        message: "COD order created successfully",
        order,
      });
    }

    // =====================================================
    // ONLINE PAYMENT
    // =====================================================

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
      // Cashfree order creation failed.
      // Remove the pending local order.
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

    // Validate customer
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer is required",
      });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // Validate payment method exists
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    // Validate payment method value
    const allowedPaymentMethods = ["COD", "ONLINE"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Find customer
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

    // Get product IDs
    const productIds = items.map((item) => item.product);

    // Prevent duplicate products
    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed in an order",
      });
    }

    // Get products
    const products = await Product.find({
      _id: { $in: productIds },
    });

    let totalAmount = 0;
    const orderItems = [];

    // Validate and prepare order items
    for (const item of items) {
      // Validate quantity
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive integer",
        });
      }

      const product = products.find(
        (p) => p._id.toString() === item.product
      );

      // Product must exist
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Admin-controlled availability
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

    // Create POS order
    const order = await Order.create({
      user: customer._id,

      items: orderItems,

      deliveryAddress: deliveryAddress || undefined,

      totalAmount,

      paymentMethod,

      orderSource: "POS",

      paymentStatus:
        paymentMethod === "COD"
          ? "PAID"
          : "PENDING",
    });

    // Populate products for WhatsApp message
    await order.populate("items.product", "name price");

    // Reduce inventory
    await reduceStock(orderItems);

    // Build WhatsApp message
    const message = buildOrderPlacedMessage(order, customer);

    // Send WhatsApp message
    await sendWhatsAppMessage(customer.phone, message);

    // Response
    res.status(201).json({
      success: true,
      message: "POS order created successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
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

    // Allowed statuses
    const allowedStatuses = [
      "PLACED",
      "ACCEPTED",
      "PROCESSING",
      "PACKED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    // Validate status
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // Find order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Online orders must be paid before acceptance
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

    // Allowed status transitions
    const allowedTransitions = {
      PLACED: ["ACCEPTED", "CANCELLED"],
      ACCEPTED: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["PACKED"],
      PACKED: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    // Prevent invalid status transition
    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.status} to ${status}`,
      });
    }

    // Restore stock when order is cancelled
    // Only restore if stock was previously reduced.
    if (
      status === "CANCELLED" &&
      order.status !== "CANCELLED"
    ) {
      if (
        order.status === "PLACED" ||
        order.status === "ACCEPTED"
      ) {
        await increaseStock(order.items);
      }
    }

    // Update status
    order.status = status;

    await order.save();

    // Find customer
    const user = await User.findById(order.user);

    // Send WhatsApp status notification
    if (user) {
      const message = buildOrderStatusMessage(order, user);

      await sendWhatsAppMessage(user.phone, message);
    }

    // Response
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
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
// EXPORTS
// =====================================================

export {
  createOrder,
  createPOSOrder,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
};