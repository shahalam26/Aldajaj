import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";

import productRoutes from "./routes/product.route.js";
import authRoutes from "./routes/auth.route.js";
import orderRoutes from "./routes/order.route.js";
import userRoutes from "./routes/user.route.js";
import dashboardRoute from "./routes/dashboard.route.js";
import paymentRoute from "./routes/payment.route.js";
import paymentWebhookRoute from "./routes/payment.webhook.route.js";

const app = express();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
| Only allow the frontend origin configured in environment variables.
| This prevents unknown websites from making browser requests to the API.
*/

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, server-to-server requests, Cashfree webhook, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);

// Cashfree webhook MUST receive the raw body
// before express.json() parses it.
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookRoute
);

// Security headers
app.use(helmet());

// Normal JSON requests
app.use(express.json());

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/dashboard", dashboardRoute);

app.use("/api/payment", paymentRoute);

app.get("/", (req, res) => {
  res.json({
    message: "chicken delivery api is running",
  });
});

const PORT = process.env.PORT || 5000;

const startserver = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("server running on port " + PORT);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

startserver();