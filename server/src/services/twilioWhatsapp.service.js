
import twilio from "twilio";

const getEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

const client = () =>
  twilio(
    getEnv("TWILIO_ACCOUNT_SID"),
    getEnv("TWILIO_AUTH_TOKEN")
  );

const formatWhatsAppNumber = (phone) => {
  let number = String(phone || "").trim();

  if (/^\d{10}$/.test(number)) {
    number = `+91${number}`;
  } else if (/^91\d{10}$/.test(number)) {
    number = `+${number}`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(number)) {
    throw new Error("Invalid WhatsApp recipient number");
  }

  return `whatsapp:${number}`;
};

export const sendWhatsAppOrderUpdate = async ({
  phone,
  message,
}) => {
  const to = formatWhatsAppNumber(phone);
  const from = `whatsapp:${getEnv("TWILIO_WHATSAPP_FROM")}`;

  if (!message || !String(message).trim()) {
    throw new Error("WhatsApp message cannot be empty");
  }

  try {
    const result = await client().messages.create({
      to,
      from,
      contentSid: getEnv("TWILIO_WHATSAPP_CONTENT_SID"),
      contentVariables: JSON.stringify({
        "1": String(message),
      }),
    });

    console.log("Twilio WhatsApp message accepted:", {
      sid: result.sid,
      status: result.status,
      to,
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error("Twilio WhatsApp error:", {
      code: error.code,
      status: error.status,
      message: error.message,
    });

    throw new Error(
      `WhatsApp send failed: ${
        error.code || error.status || error.message
      }`
    );
  }
};