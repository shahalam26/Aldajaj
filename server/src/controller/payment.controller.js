
import crypto from "crypto";
import mongoose from "mongoose";

import Cashfree from "../config/cashfree.js";
import Order from "../model/order.model.js";
import User from "../model/user.model.js";

import { reduceStock } from "../services/inventory.service.js";
import sendWhatsAppMessage from "../services/whatsapp.service.js";
import sendOrderEmail from "../services/email.service.js";
import { buildOrderPlacedMessage } from "../services/orderMessage.service.js";
import { emitOrderCreated } from "../services/realtime.service.js";

const amountsMatch = (a, b) => {
  const first = Number(a);
  const second = Number(b);

  return (
    Number.isFinite(first) &&
    Number.isFinite(second) &&
    Math.round(first * 100) === Math.round(second * 100)
  );
};

// Runs only after successful payment confirmation.
// Admin realtime notification is independent of WhatsApp/email.
const notifyPaidOrder = async (orderId) => {
  let order;
  let user;

  try {
    order = await Order.findById(orderId).populate(
      "items.product",
      "name price"
    );

    if (!order) return;

    if (
      order.paymentMethod === "ONLINE" &&
      order.paymentStatus === "PAID"
    ) {
      emitOrderCreated(order);

      console.log(
        "Online order realtime event emitted:",
        order._id.toString()
      );
    }

    user = await User.findById(order.user);

    if (!user) return;
  } catch (error) {
    console.error(
      "Could not load paid order for notifications:",
      error.message
    );
    return;
  }

  if (user.phone) {
    try {
      const message = buildOrderPlacedMessage(order, user);
      await sendWhatsAppMessage(user.phone, message);
    } catch (error) {
      console.error(
        "Paid-order WhatsApp notification failed:",
        error.message
      );
    }
  }

  try {
    await sendOrderEmail(order, user, "payment");
  } catch (error) {
    console.error(
      "Paid-order email notification failed:",
      error.message
    );
  }
};

/**
 * Verify payment for the authenticated customer's own online order.
 */
const verifyMyOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      paymentMethod: "ONLINE",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Online order not found",
      });
    }

    if (order.paymentStatus === "PAID" && order.stockReduced) {
      return res.status(200).json({
        success: true,
        paymentStatus: "PAID",
        message: "Payment already verified",
      });
    }

    if (!order.cashfreeOrderId) {
      return res.status(409).json({
        success: false,
        message: "Cashfree order reference is missing",
      });
    }

    // Fetch payment status directly from Cashfree.
    const response = await Cashfree.PGOrderFetchPayments(
      order.cashfreeOrderId
    );

    const payments = Array.isArray(response.data)
      ? response.data
      : [];

    const successfulPayment = payments.find(
      (payment) => payment.payment_status === "SUCCESS"
    );

    if (successfulPayment) {
      if (
        !amountsMatch(
          successfulPayment.payment_amount,
          order.totalAmount
        )
      ) {
        console.error("Cashfree payment amount mismatch", {
          localOrderId: order._id.toString(),
          cashfreeOrderId: order.cashfreeOrderId,
        });

        return res.status(409).json({
          success: false,
          message: "Payment amount does not match the order",
        });
      }

      let transitionedToPaid = false;
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const currentOrder = await Order.findOne({
            _id: order._id,
            user: req.user._id,
          }).session(session);

          if (!currentOrder) {
            throw new Error("Order not found");
          }

          if (currentOrder.status === "CANCELLED") {
            throw new Error(
              "Order is cancelled; payment requires manual reconciliation"
            );
          }

          if (currentOrder.paymentStatus !== "PAID") {
            // Deduct inventory only once.
            if (!currentOrder.stockReduced) {
              await reduceStock(currentOrder.items, session);
              currentOrder.stockReduced = true;
            }

            currentOrder.paymentStatus = "PAID";
            currentOrder.paymentId =
              String(successfulPayment.cf_payment_id || "") || null;

            await currentOrder.save({ session });
            transitionedToPaid = true;
          } else if (!currentOrder.stockReduced) {
            // Repair an inconsistent order without deducting twice.
            await reduceStock(currentOrder.items, session);
            currentOrder.stockReduced = true;
            await currentOrder.save({ session });
          }
        });
      } finally {
        await session.endSession();
      }

      // Emit only when this request transitions the order to PAID.
      if (transitionedToPaid) {
        await notifyPaidOrder(order._id);
      }

      return res.status(200).json({
        success: true,
        paymentStatus: "PAID",
        message: "Payment verified successfully",
      });
    }

    // Do not let a failed attempt overwrite an existing successful payment.
    const latestFailedPayment = [...payments]
      .reverse()
      .find((payment) =>
        ["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(
          payment.payment_status
        )
      );

    const hasPendingAttempt = payments.some((payment) =>
      ["PENDING", "NOT_ATTEMPTED"].includes(payment.payment_status)
    );

    if (
      latestFailedPayment &&
      !hasPendingAttempt &&
      order.paymentStatus !== "PAID"
    ) {
      order.paymentStatus = "FAILED";
      order.paymentId =
        String(latestFailedPayment.cf_payment_id || "") || null;

      await order.save();
    }

    return res.status(200).json({
      success: true,
      paymentStatus: order.paymentStatus,
      message:
        order.paymentStatus === "FAILED"
          ? "Payment failed"
          : "Payment is still being confirmed",
    });
  } catch (error) {
    console.error(
      "verifyMyOrderPayment error:",
      error.response?.data || error.message
    );

    return res.status(502).json({
      success: false,
      message: "Unable to verify payment right now",
    });
  }
};

// Standalone ₹1 test payment endpoint.
// Do not expose this endpoint publicly in production.
const createTestPayment = async (req, res) => {
  try {
    const orderId = `TEST_${Date.now()}`;

    const request = {
      order_amount: 1,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: "test_customer_1",
        customer_name: "Test Customer",
        customer_email: "test@example.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: `${
          process.env.FRONTEND_URL?.split(",")[0] ||
          "http://localhost:5173"
        }/payment/success?order_id=${orderId}`,
      },
    };

    const response = await Cashfree.PGCreateOrder(request);

    return res.status(200).json({
      success: true,
      message: "Cashfree test order created",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Cashfree create test order error:",
      error.response?.data || error.message
    );

    return res.status(502).json({
      success: false,
      message: "Failed to create Cashfree test order",
    });
  }
};

const verifyTestPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (
      typeof orderId !== "string" ||
      !orderId.startsWith("TEST_")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid test order ID",
      });
    }

    const response = await Cashfree.PGOrderFetchPayments(orderId);

    return res.status(200).json({
      success: true,
      message: "Payment status fetched",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Cashfree test payment verification error:",
      error.response?.data || error.message
    );

    return res.status(502).json({
      success: false,
      message: "Failed to verify test payment",
    });
  }
};

/**
 * Verify Cashfree webhook signature using the original raw request body.
 */
const verifyCashfreeWebhookSignature = (
  signature,
  timestamp,
  rawBody
) => {
  try {
    const secret = process.env.CASHFREE_SECRET_KEY;

    if (!signature || !timestamp || !rawBody || !secret) {
      return false;
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(timestamp + rawBody)
      .digest("base64");

    const expected = Buffer.from(generatedSignature, "utf8");
    const received = Buffer.from(String(signature), "utf8");

    if (expected.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, received);
  } catch (error) {
    console.error(
      "Webhook signature verification error:",
      error.message
    );

    return false;
  }
};

const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : "";

    if (
      !verifyCashfreeWebhookSignature(
        signature,
        timestamp,
        rawBody
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    let webhookData;

    try {
      webhookData = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook JSON",
      });
    }

    const eventType =
      webhookData.type || webhookData.event_type || "";

    const cashfreeOrderId = webhookData.data?.order?.order_id;
    const payment = webhookData.data?.payment;

    const paymentId = payment?.cf_payment_id;
    const paymentStatus = payment?.payment_status;
    const paymentAmount = payment?.payment_amount;

    if (!cashfreeOrderId || !payment) {
      return res.status(400).json({
        success: false,
        message: "Cashfree order/payment details are missing",
      });
    }

    const order = await Order.findOne({ cashfreeOrderId });

    if (!order) {
      console.error(
        "Cashfree webhook references an unknown local order"
      );

      return res.status(404).json({
        success: false,
        message: "Local order not found",
      });
    }

    if (!amountsMatch(paymentAmount, order.totalAmount)) {
      console.error("Cashfree webhook payment amount mismatch");

      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
      });
    }

    // Trust the signed payment status, not the event name alone.
    if (paymentStatus === "SUCCESS") {
      if (order.status === "CANCELLED") {
        console.error(
          "Successful payment received for a cancelled order"
        );

        return res.status(200).json({
          success: true,
          message:
            "Cancelled-order payment requires reconciliation",
        });
      }

      let transitionedToPaid = false;
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const currentOrder = await Order.findById(
            order._id
          ).session(session);

          if (!currentOrder) {
            throw new Error("Local order not found");
          }

          if (currentOrder.status === "CANCELLED") {
            return;
          }

          if (currentOrder.paymentStatus !== "PAID") {
            if (!currentOrder.stockReduced) {
              await reduceStock(currentOrder.items, session);
              currentOrder.stockReduced = true;
            }

            currentOrder.paymentStatus = "PAID";
            currentOrder.paymentId =
              String(paymentId || "") || null;

            await currentOrder.save({ session });
            transitionedToPaid = true;
          } else if (!currentOrder.stockReduced) {
            await reduceStock(currentOrder.items, session);
            currentOrder.stockReduced = true;
            await currentOrder.save({ session });
          }
        });
      } finally {
        await session.endSession();
      }

      // Notify only after successful payment transition.
      if (transitionedToPaid) {
        await notifyPaidOrder(order._id);
      }

      return res.status(200).json({
        success: true,
        message: "Payment success event processed",
      });
    }

    if (
      ["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(
        paymentStatus
      )
    ) {
      if (order.paymentStatus === "PAID") {
        return res.status(200).json({
          success: true,
          message:
            "Ignoring failure event for an already paid order",
        });
      }

      order.paymentStatus = "FAILED";

      if (paymentId) {
        order.paymentId = String(paymentId);
      }

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Payment failure event processed",
      });
    }

    console.info(
      "Cashfree webhook received; no payment state change required",
      { eventType, paymentStatus }
    );

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error(
      "Cashfree webhook processing error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

export {
  createTestPayment,
  verifyTestPayment,
  verifyMyOrderPayment,
  cashfreeWebhook,
};
