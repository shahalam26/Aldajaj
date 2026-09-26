import Cashfree from "../config/cashfree.js";

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
const cashfreeWebhook = async (req, res) => {
  try {
    console.log("========== CASHFREE WEBHOOK ==========");
    console.log("Webhook received:", req.body);
    console.log("======================================");

    res.status(200).json({
      success: true,
      message: "Webhook received successfully",
    });
  } catch (error) {
    console.error("Webhook error:", error.message);

    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

export  {createTestPayment ,verifyTestPayment,cashfreeWebhook};