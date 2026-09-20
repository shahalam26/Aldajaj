const sendWhatsAppMessage = async (phone, message) => {
  try {
    console.log("WhatsApp message queued:", {
      phone,
      message,
    });

    // Actual WhatsApp API integration will be added here.

    return {
      success: true,
    };
  } catch (error) {
    console.error("WhatsApp service error:", error.message);

    return {
      success: false,
      message: error.message,
    };
  }
};

export default sendWhatsAppMessage;