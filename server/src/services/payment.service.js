import crypto from "crypto";

import Cashfree from "../config/cashfree.js";

const createCashfreeOrder = async ({
  orderId,
  amount,
  user,
}) => {
  const request = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",

    customer_details: {
      customer_id: user._id.toString(),
      customer_name: user.name || "Customer",
      customer_email: user.email || "customer@example.com",
      customer_phone: user.phone,
    },

    order_meta: {
      return_url: `${process.env.CASHFREE_RETURN_URL}?order_id=${orderId}`,
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

const verifyCashfreeWebhook = ({
  signature,
  timestamp,
  rawBody,
}) => {
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
};

export {
  createCashfreeOrder,
  getCashfreePayments,
  verifyCashfreeWebhook,
};