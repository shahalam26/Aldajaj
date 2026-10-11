
import { sendWhatsAppOrderUpdate } from "./twilioWhatsapp.service.js";

const sendWhatsAppMessage = async (phone, message) => {
  if (!phone || !message) {
    console.error("WhatsApp skipped: phone or message missing");
    return { success: false };
  }

  try {
    return await sendWhatsAppOrderUpdate({ phone, message });
  } catch (error) {
    console.error("WhatsApp delivery failed:", error.message);
    return { success: false, message: error.message };
  }
};

export default sendWhatsAppMessage;
