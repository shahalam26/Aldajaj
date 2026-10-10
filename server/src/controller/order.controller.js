
import mongoose from "mongoose";
import Order from "../model/order.model.js";
import Product from "../model/product.model.js";
import User from "../model/user.model.js";
import sendOrderEmail from "../services/email.service.js";
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

          // Inventory does not block ordering.
          await reduceStock(orderItems, session);

          order.stockReduced = true;
          await order.save({ session });
        });
      } finally {
        await session.endSession();
      }

      await order.populate("items.product", "name price");

      // WhatsApp failure must not fail an already-created order.
      try {
        if (user.phone) {
          const message = buildOrderPlacedMessage(order, user);
          await sendWhatsAppMessage(user.phone, message);
        }
      } catch (notificationError) {
        console.error(
          "COD order WhatsApp notification failed:",
          notificationError.message
        );
      }

      // Email is optional and failure-safe.
      await sendOrderEmail(order, user, "placed");

      return res.status(201).json({
        success: true,
        message: "COD order created successfully",
        order,
      });
    }

    // =====================================================
    // ONLINE PAYMENT
    // Email is sent after payment is confirmed, not here.
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
              deliveryAddress: deliveryAddress || undefined,
              totalAmount,
              paymentMethod,
              orderSource: "POS",
              paymentStatus:
                paymentMethod === "COD" ? "PAID" : "PENDING",
              stockReduced: false,
            },
          ],
          { session }
        );

        order = createdOrders[0];

        // Stock does not block POS orders.
        await reduceStock(orderItems, session);

        order.stockReduced = true;
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    await order.populate("items.product", "name price");

    try {
      if (customer.phone) {
        const message = buildOrderPlacedMessage(order, customer);
        await sendWhatsAppMessage(customer.phone, message);
      }
    } catch (notificationError) {
      console.error(
        "POS order WhatsApp notification failed:",
        notificationError.message
      );
    }

    await sendOrderEmail(order, customer, "placed");

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

    // 1. Validate order ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // 2. Validate requested status
    const allowedStatuses = [
      "PLACED",
      "ACCEPTED",
      "PROCESSING",
      "PACKED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // 3. Define valid order lifecycle transitions
    const allowedTransitions = {
      PLACED: ["ACCEPTED", "CANCELLED"],
      ACCEPTED: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["PACKED"],
      PACKED: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    let updatedOrder;
    let changed = false;

    // 4. Update order and inventory atomically
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);

        if (!order) {
          const error = new Error("Order not found");
          error.statusCode = 404;
          throw error;
        }

        // Prevent duplicate status updates and notifications.
        if (order.status === status) {
          updatedOrder = order;
          return;
        }

        // Reject invalid lifecycle transitions.
        if (!allowedTransitions[order.status]?.includes(status)) {
          const error = new Error(
            `Cannot change order status from ${order.status} to ${status}`
          );
          error.statusCode = 409;
          throw error;
        }

        // Online orders must be paid before acceptance.
        if (
          status === "ACCEPTED" &&
          order.paymentMethod === "ONLINE" &&
          order.paymentStatus !== "PAID"
        ) {
          const error = new Error(
            "Online order cannot be accepted before payment is successful"
          );
          error.statusCode = 409;
          throw error;
        }

        // Never cancel a pending online payment.
        if (
          status === "CANCELLED" &&
          order.paymentMethod === "ONLINE" &&
          order.paymentStatus !== "FAILED"
        ) {
          const error = new Error(
            order.paymentStatus === "PAID"
              ? "This online order is already paid. Complete the refund workflow before cancelling it."
              : "Online payment is not confirmed as failed. Verify the payment before cancelling this order."
          );
          error.statusCode = 409;
          throw error;
        }

        // Restore stock only when it was previously deducted.
        if (
          status === "CANCELLED" &&
          order.stockReduced &&
          ["PLACED", "ACCEPTED"].includes(order.status)
        ) {
          await increaseStock(order.items, session);
          order.stockReduced = false;
        }

        order.status = status;
        await order.save({ session });

        updatedOrder = order;
        changed = true;
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }

    // 5. Skip duplicate notifications if nothing changed.
    if (!changed) {
      return res.status(200).json({
        success: true,
        message: "Order already has this status",
        order: updatedOrder,
      });
    }

    await updatedOrder.populate("items.product", "name image price");

    // 6. Load customer for both notifications.
    let notificationUser = null;

    try {
      notificationUser = await User.findById(updatedOrder.user);
    } catch (notificationError) {
      console.error(
        "Could not load order customer for notifications:",
        notificationError.message
      );
    }

    // WhatsApp must not undo a successful status update.
    if (notificationUser?.phone) {
      try {
        const message = buildOrderStatusMessage(
          updatedOrder,
          notificationUser
        );

        await sendWhatsAppMessage(
          notificationUser.phone,
          message
        );
      } catch (notificationError) {
        console.error(
          "Order status WhatsApp notification failed:",
          notificationError.message
        );
      }
    }

    // Email is optional and failure-safe.
    await sendOrderEmail(
      updatedOrder,
      notificationUser,
      "status"
    );

    // 7. Return updated order.
    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
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

    // Validate MongoDB ObjectId before querying.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

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
