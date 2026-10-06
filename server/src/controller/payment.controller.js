import crypto from "crypto";
import mongoose from "mongoose";

import Cashfree from "../config/cashfree.js";

import Order from "../model/order.model.js";
import User from "../model/user.model.js";

import {
  reduceStock,
} from "../services/inventory.service.js";

import sendWhatsAppMessage from "../services/whatsapp.service.js";

import {
  buildOrderPlacedMessage,
} from "../services/orderMessage.service.js";

// =====================================================
// CREATE TEST PAYMENT
// =====================================================

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
        return_url: `http://localhost:5173/payment/success?order_id=${orderId}`,
      },
    };

    const response = await Cashfree.PGCreateOrder(request);

    res.status(200).json({
      success: true,
      message: "Cashfree test order created",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Cashfree create order error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to create Cashfree order",
      error: error.response?.data || error.message,
    });
  }
};

// =====================================================
// VERIFY TEST PAYMENT
// =====================================================

const verifyTestPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const response = await Cashfree.PGOrderFetchPayments(orderId);

    res.status(200).json({
      success: true,
      message: "Payment status fetched",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Cashfree payment verification error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.response?.data || error.message,
    });
  }
};

// =====================================================
// VERIFY CASHFREE WEBHOOK SIGNATURE
// =====================================================

const verifyCashfreeWebhookSignature = (
  signature,
  timestamp,
  rawBody
) => {
  try {
    if (!signature || !timestamp || !rawBody) {
      return false;
    }

    const signedPayload = timestamp + rawBody;

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.CASHFREE_SECRET_KEY
      )
      .update(signedPayload)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error(
      "Webhook signature verification error:",
      error.message
    );

    return false;
  }
};

// =====================================================
// CASHFREE WEBHOOK
// =====================================================

const cashfreeWebhook = async (req, res) => {
  try {
    console.log("========== CASHFREE WEBHOOK ==========");

    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : "";

    console.log("Webhook signature:", signature);
    console.log("Webhook timestamp:", timestamp);

    // =================================================
    // 1. VERIFY SIGNATURE
    // =================================================

    const isValid = verifyCashfreeWebhookSignature(
      signature,
      timestamp,
      rawBody
    );

    if (!isValid) {
      console.error("❌ Invalid Cashfree webhook signature");

      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    console.log("✅ Cashfree webhook signature verified");

    // =================================================
    // 2. PARSE WEBHOOK
    // =================================================

    const webhookData = JSON.parse(rawBody);

    console.log(
      "Cashfree webhook data:",
      JSON.stringify(webhookData, null, 2)
    );

    // =================================================
    // 3. GET EVENT DETAILS
    // =================================================

    const eventType =
      webhookData.type ||
      webhookData.event_type;

    const cashfreeOrderId =
      webhookData.data?.order?.order_id;

    const paymentId =
      webhookData.data?.payment?.cf_payment_id;

    const paymentStatus =
      webhookData.data?.payment?.payment_status;

    const paymentAmount =
      webhookData.data?.payment?.payment_amount;

    console.log("Event:", eventType);
    console.log("Cashfree Order ID:", cashfreeOrderId);
    console.log("Payment ID:", paymentId);
    console.log("Payment Status:", paymentStatus);
    console.log("Payment Amount:", paymentAmount);

    // =================================================
    // 4. BASIC VALIDATION
    // =================================================

    if (!cashfreeOrderId) {
      console.error("❌ Cashfree order ID missing");

      return res.status(400).json({
        success: false,
        message: "Cashfree order ID missing",
      });
    }

    // =================================================
    // 5. FIND LOCAL ORDER
    // =================================================

    let order = await Order.findOne({
      cashfreeOrderId,
    });

    if (!order) {
      console.error(
        "❌ Local order not found:",
        cashfreeOrderId
      );

      return res.status(404).json({
        success: false,
        message: "Local order not found",
      });
    }

    console.log(
      "Local order found:",
      order._id.toString()
    );

    // =================================================
    // 6. VERIFY PAYMENT AMOUNT
    // =================================================

    if (
      paymentAmount !== undefined &&
      Number(paymentAmount) !== Number(order.totalAmount)
    ) {
      console.error("❌ Payment amount mismatch");

      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
      });
    }

    // =================================================
    // 7. SUCCESS PAYMENT
    // =================================================

    if (
      paymentStatus === "SUCCESS" ||
      eventType === "PAYMENT_SUCCESS_WEBHOOK"
    ) {
      // -------------------------------------------------
      // Idempotency
      // -------------------------------------------------

      if (order.paymentStatus === "PAID") {
        console.log(
          "ℹ️ Order already marked as PAID"
        );

        return res.status(200).json({
          success: true,
          message: "Payment already processed",
        });
      }

      // -------------------------------------------------
      // Payment + inventory transaction
      // -------------------------------------------------

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const transactionalOrder = await Order.findById(
            order._id
          ).session(session);

          if (!transactionalOrder) {
            throw new Error("Local order not found");
          }

          // Another webhook may have processed this order
          // while this webhook was waiting for the transaction.
          if (
            transactionalOrder.paymentStatus === "PAID"
          ) {
            order = transactionalOrder;
            return;
          }

          // ---------------------------------------------
          // Mark payment as paid
          // ---------------------------------------------

          transactionalOrder.paymentStatus = "PAID";

          transactionalOrder.paymentId =
            paymentId || null;

          // ---------------------------------------------
          // Reduce stock only once
          // ---------------------------------------------

          if (!transactionalOrder.stockReduced) {
            await reduceStock(
              transactionalOrder.items,
              session
            );

            transactionalOrder.stockReduced = true;

            console.log("✅ Stock reduced");
          }

          // ---------------------------------------------
          // Save order
          // ---------------------------------------------

          await transactionalOrder.save({
            session,
          });

          order = transactionalOrder;
        });
      } finally {
        await session.endSession();
      }

      // -------------------------------------------------
      // Populate products for WhatsApp
      // -------------------------------------------------

      await order.populate(
        "items.product",
        "name price"
      );

      console.log("✅ Order marked as PAID");

      // -------------------------------------------------
      // WhatsApp confirmation
      // -------------------------------------------------

      const user = await User.findById(order.user);

      if (user) {
        const message = buildOrderPlacedMessage(
          order,
          user
        );

        await sendWhatsAppMessage(
          user.phone,
          message
        );

        console.log(
          "✅ Order confirmation WhatsApp sent"
        );
      }

      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
      });
    }

    // =================================================
    // FAILED PAYMENT
    // =================================================

  if (
  paymentStatus === "FAILED" ||
  eventType === "PAYMENT_FAILED_WEBHOOK"
) {
  // Never allow a late/duplicate FAILED webhook
  // to overwrite an already successful payment.
  if (order.paymentStatus === "PAID") {
    console.log(
      "ℹ️ Ignoring FAILED webhook because order is already PAID"
    );

    return res.status(200).json({
      success: true,
      message: "Payment already processed successfully",
    });
  }

  order.paymentStatus = "FAILED";

  if (paymentId) {
    order.paymentId = paymentId;
  }

  await order.save();

  console.log("❌ Payment marked as FAILED");

  return res.status(200).json({
    success: true,
    message: "Payment failure processed",
  });
}
    // =================================================
    // OTHER EVENTS
    // =================================================

    console.log(
      "ℹ️ Webhook received but no payment state change required"
    );

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error(
      "Webhook processing error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

export {
  createTestPayment,
  verifyTestPayment,
  cashfreeWebhook,
};