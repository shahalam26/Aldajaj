import Order from "../model/order.model.js";
import Product from "../model/product.model.js";
import User from "../model/user.model.js";
import sendWhatsAppMessage from "../services/whatsapp.service.js";
import { buildOrderPlacedMessage } from "../services/orderMessage.service.js";

import {
  reduceStock,
  increaseStock,
} from "../services/inventory.service.js";
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

    // Get logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find selected address from logged-in user's addresses
    const selectedAddress = user.addresses.id(addressId);

    if (!selectedAddress) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // Get products
    const productIds = items.map((item) => item.product);

    const products = await Product.find({
      _id: { $in: productIds },
    });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
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

      // Stock is NOT checked here.
      // Customer can place an order even if stock is 0.

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create order
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
      },

      totalAmount,

      paymentMethod,
    });
    await reduceStock(orderItems);
     const message = buildOrderPlacedMessage(order, user);

await sendWhatsAppMessage(user.phone, message);
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

    const products = await Product.find({
      _id: { $in: productIds },
    });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(
        (p) => p._id.toString() === item.product
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

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

    const order = await Order.create({
      user: customer._id,
      items: orderItems,
     deliveryAddress: deliveryAddress || undefined,
      totalAmount,
      paymentMethod,
      orderSource: "POS",
      paymentStatus:
        paymentMethod === "COD" ? "PAID" : "PENDING",
    });
   await reduceStock(orderItems);
    const message = buildOrderPlacedMessage(order, customer);

    await sendWhatsAppMessage(customer.phone, message);

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
   if (status === "CANCELLED" && order.status !== "CANCELLED") {
  if (
    order.status === "PLACED" ||
    order.status === "ACCEPTED"
  ) {
    await increaseStock(order.items);
  }
}
    order.status = status;

    await order.save();

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

export {
  createOrder,
  createPOSOrder,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
};