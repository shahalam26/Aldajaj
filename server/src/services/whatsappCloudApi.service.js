const requiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

export const sendCloudWhatsAppText = async (to, body) => {
  const token = requiredEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requiredEnv("WHATSAPP_PHONE_NUMBER_ID");
  const version =
    process.env.WHATSAPP_GRAPH_API_VERSION || "v25.0";

  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp Cloud API error:", {
      status: response.status,
      error: data.error?.message,
    });

    throw new Error("WhatsApp message could not be sent");
  }

  return data;
};