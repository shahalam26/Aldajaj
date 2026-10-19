import express from "express";
import crypto from "node:crypto";

import Product from "../model/product.model.js";
import { sendCloudWhatsAppText } from "../services/whatsappCloudApi.service.js";

const router = express.Router();

const processedMessages = new Set();

const verifySignature = (rawBody, signature) => {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret || !signature || !Buffer.isBuffer(rawBody)) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

// Meta webhook verification
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

async function buildReply(message) {
  const text = message.trim().toLowerCase();

  if (/^(hi|hello|hey|namaste|start|menu)\b/.test(text)) {
    return [
      "Namaste! 👋 Welcome to Dilli Cuts 🐔",
      "",
      "Aapko kis cheez mein help chahiye?",
      "1. PRICE — today's product prices",
      "2. DELIVERY — delivery information",
      "3. ORDER — order kaise karein",
      "4. HUMAN — team se baat karein",
      "",
      "Website: https://www.dillicuts.com",
      "Fresh Cuts. Delivered Right.",
    ].join("\n");
  }

  if (/\b(price|prices|rate|rates|daam|keemat|menu|products|product)\b/.test(text)) {
    const products = await Product.find({ isAvailable: true })
      .select("name price weight category")
      .sort({ name: 1 })
      .limit(15)
      .lean();

    if (!products.length) {
      return "Abhi product list available nahi hai. Please https://www.dillicuts.com check karein ya team ko message karein.";
    }

    const lines = products.map((product) => {
      const weight = product.weight ? ` (${product.weight} g)` : "";
      return `• ${product.name}${weight} — ₹${product.price}`;
    });

    return [
      "🐔 Dilli Cuts — Current catalogue prices",
      "",
      ...lines,
      "",
      "Price/availability confirm karne ke liye product aur quantity reply karein.",
      "Website: https://www.dillicuts.com",
    ].join("\n");
  }

  if (/\b(delivery|deliver|pincode|pin code|area|location|charge)\b/.test(text)) {
    return "🚚 Apna delivery area ya PIN code bhej dein. Hum delivery availability aur applicable charges confirm karenge.";
  }

  if (/\b(order|buy|purchase|mangwana|book)\b/.test(text)) {
    return "Order ke liye https://www.dillicuts.com par visit karein, ya product name, quantity aur delivery PIN code bhejein. Team details confirm karegi.";
  }

  if (/\b(human|agent|person|support|complaint|staff|owner)\b/.test(text)) {
    return "Aapka message hamari team ke liye note kar liya hai. Team se baat karne ke liye is WhatsApp chat par apni query bhejein. Agar urgent hai, please website par diye gaye contact options use karein.";
  }

  return "Namaste! 👋 Dilli Cuts mein welcome. Current prices ke liye PRICE, delivery ke liye DELIVERY, order information ke liye ORDER, ya options dekhne ke liye MENU bhejein.";
}

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!verifySignature(req.body, req.get("x-hub-signature-256"))) {
      return res.sendStatus(401);
    }

    let payload;

    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    // Meta expects a quick successful webhook acknowledgement.
    res.sendStatus(200);

    try {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== "messages") continue;

          const value = change.value || {};

          for (const message of value.messages || []) {
            if (message.type !== "text" || !message.from || !message.id) {
              continue;
            }

            // Avoid processing the same webhook message twice in this process.
            if (processedMessages.has(message.id)) continue;

            processedMessages.add(message.id);

            if (processedMessages.size > 5000) {
              processedMessages.clear();
            }

            const reply = await buildReply(message.text?.body || "");

            await sendCloudWhatsAppText(message.from, reply);
          }
        }
      }
    } catch (error) {
      console.error("WhatsApp webhook processing failed:", error.message);
    }
  }
);

export default router;