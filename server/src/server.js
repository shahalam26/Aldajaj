
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import http from "http";

import Product from "./model/product.model.js";

import productRoutes from "./routes/product.route.js";
import authRoutes from "./routes/auth.route.js";
import orderRoutes from "./routes/order.route.js";
import userRoutes from "./routes/user.route.js";
import dashboardRoute from "./routes/dashboard.route.js";
import paymentRoute from "./routes/payment.route.js";
import paymentWebhookRoute from "./routes/payment.webhook.route.js";
import uploadRoutes from "./routes/upload.route.js";
import whatsappCloudWebhookRoute from "./routes/whatsappCloudWebhook.route.js";

import { initializeRealtime } from "./services/realtime.service.js";

const app = express();

const httpServer = http.createServer(app);

initializeRealtime(httpServer);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
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

/*
|--------------------------------------------------------------------------
| PAYMENT WEBHOOK
| Raw body must be preserved for webhook verification.
|--------------------------------------------------------------------------
*/

app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookRoute
);

/*
|--------------------------------------------------------------------------
| WHATSAPP WEBHOOK
|--------------------------------------------------------------------------
*/

app.use("/api/whatsapp/webhook", whatsappCloudWebhookRoute);

/*
|--------------------------------------------------------------------------
| SECURITY HEADERS
|--------------------------------------------------------------------------
*/

app.use(helmet());

/*
|--------------------------------------------------------------------------
| JSON BODY PARSER
|--------------------------------------------------------------------------
*/

app.use(express.json());

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/upload", uploadRoutes);

/*
|--------------------------------------------------------------------------
| DYNAMIC XML SITEMAP
|--------------------------------------------------------------------------
| Lists the homepage and product URLs from MongoDB.
|--------------------------------------------------------------------------
*/

app.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await Product.find({})
      .select("_id updatedAt")
      .lean();

    const escapeXml = (value) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const urls = [
      {
        loc: "https://www.dillicuts.com/",
      },
      ...products.map((product) => ({
        loc: `https://www.dillicuts.com/product/${product._id}`,
        lastmod: product.updatedAt,
      })),
    ];

    const xmlUrls = urls
      .map(({ loc, lastmod }) => {
        const lastmodTag = lastmod
          ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>`
          : "";

        return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodTag}
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300");

    return res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error.message);

    return res
      .status(500)
      .type("text/plain")
      .send("Unable to generate sitemap");
  }
});

/*
|--------------------------------------------------------------------------
| ROOT ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    message: "chicken delivery api is running",
  });
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 5000;

const startserver = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log("server running on port " + PORT);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

startserver();
