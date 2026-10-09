
import crypto from "crypto";
import Cashfree from "../config/cashfree.js";

const createCashfreeOrder = async ({ orderId, amount, user }) => {
  const returnUrl = process.env.CASHFREE_RETURN_URL;

  if (!returnUrl) {
    throw new Error("CASHFREE_RETURN_URL is not configured");
  }

  // Preserve existing query parameters in the configured return URL.
  const returnUrlWithOrderId = new URL(returnUrl);
  returnUrlWithOrderId.searchParams.set(
    "local_order_id",
    orderId.toString()
  );

  const request = {
    order_id: orderId.toString(),
    order_amount: amount,
    order_currency: "INR",

    customer_details: {
      customer_id: user._id.toString(),
      customer_name: user.name || "Customer",
      customer_email: user.email || "customer@example.com",
      customer_phone: user.phone,
    },

    order_meta: {
      // Pass the local MongoDB order ID to the frontend result page.
      return_url: returnUrlWithOrderId.toString(),
      notify_url: process.env.CASHFREE_WEBHOOK_URL,
    },
  };

  const response = await Cashfree.PGCreateOrder(request);

  return response.data;
};

const getCashfreePayments = async (orderId) => {
  const response = await Cashfree.PGOrderFetchPayments(orderId);

  return response.data;
};

const verifyCashfreeWebhook = ({ signature, timestamp, rawBody }) => {
  if (
    !signature ||
    !timestamp ||
    rawBody === undefined ||
    rawBody === null
  ) {
    return false;
  }

  const signedPayload = timestamp + rawBody;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
    .update(signedPayload)
    .digest("base64");

  // timingSafeEqual throws if the buffers have different lengths.
  const expectedBuffer = Buffer.from(generatedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export {
  createCashfreeOrder,
  getCashfreePayments,
  verifyCashfreeWebhook,
};
