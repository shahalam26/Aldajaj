import { useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async () => {
    try {
      setLoading(true);
      setMessage("");

      // Rahul ka JWT yahan hona chahiye
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("User token not found in localStorage");
      }

      // Create our REAL order
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [
            {
              product: "6aab31930de7162119350bf3",
              quantity: 1,
            },
          ],
          paymentMethod: "ONLINE",
          addressId: "6aaed0949d3341ea66ca700b",
        }),
      });

      const result = await response.json();

      console.log("ORDER RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create order");
      }

      const paymentSessionId = result.payment?.paymentSessionId;

      if (!paymentSessionId) {
        throw new Error("Payment session ID not received");
      }

      console.log("Order ID:", result.order._id);
      console.log("Cashfree Order ID:", result.order.cashfreeOrderId);
      console.log("Payment Session ID:", paymentSessionId);

      // Load Cashfree Sandbox
      const cashfree = await load({
        mode: "sandbox",
      });

      // Open Cashfree checkout
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
        <h1>Chicken Order</h1>

        <p>Chicken Thai - 500g</p>

        <h2>₹320</h2>

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
          {loading ? "Opening Checkout..." : "Pay ₹320"}
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