import { useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async () => {
  try {
    setLoading(true);
    setMessage("");

    const response = await fetch(
      "http://localhost:5000/api/payment/test",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    console.log("BACKEND RESPONSE:", result);

    if (!result.success) {
      throw new Error(result.message || "Failed to create payment");
    }

    const orderId = result.data.order_id;
    const paymentSessionId = result.data.payment_session_id;

    console.log("CASHFREE ORDER ID:", orderId);
    console.log("PAYMENT SESSION ID:", paymentSessionId);

    if (!paymentSessionId) {
      throw new Error("Payment session ID not received");
    }

    const cashfree = await load({
      mode: "sandbox",
    });

    await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_self",
    });
  } catch (error) {
    console.error("Payment error:", error);
    setMessage(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          width: "350px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h1>Cashfree Test Payment</h1>

        <p>Sandbox payment testing</p>

        <h2>₹1</h2>

        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "#111",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          {loading ? "Opening Checkout..." : "Pay ₹1"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "20px",
              color: "red",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;