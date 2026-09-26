const buildOrderPlacedMessage = (order, user) => {
  const items = order.items
    .map((item) => {
      const lineTotal = item.price * item.quantity;

      return `• ${item.product.name}
  ${item.quantity} × ₹${item.price} = ₹${lineTotal}`;
    })
    .join("\n\n");

  let deliverySection = "";

  if (order.deliveryAddress) {
    deliverySection = `
Delivery Address:
${order.deliveryAddress.addressLine}
${order.deliveryAddress.city}, ${order.deliveryAddress.state}
${order.deliveryAddress.pincode}
${order.deliveryAddress.landmark || ""}
`;
  } else {
    deliverySection = `
Order Type:
Walk-in / Shop Sale
`;
  }

  return `
Hello ${user.name || "Customer"} 👋

Your order has been placed successfully! 🎉

Order ID: ${order._id}

Items:
${items}

--------------------------------
Total Amount: ₹${order.totalAmount}
Payment Method: ${order.paymentMethod}
--------------------------------

${deliverySection}

Thank you for ordering with us! ❤️
`;
};

const buildOrderStatusMessage = (order, user) => {
  const statusMessages = {
    ACCEPTED: "Your order has been accepted and will be processed shortly. ✅",
    PROCESSING: "Your order is now being prepared. 👨‍🍳",
    PACKED: "Your order has been packed and is ready for delivery. 📦",
    OUT_FOR_DELIVERY: "Your order is out for delivery. 🛵",
    DELIVERED: "Your order has been delivered successfully. 🎉",
    CANCELLED: "Your order has been cancelled. ❌",
  };

  return `
Hello ${user.name || "Customer"} 👋

Order Update

Order ID: ${order._id}

${statusMessages[order.status] || "Your order status has been updated."}

Current Status: ${order.status}

Thank you for ordering with us! ❤️
`;
};
export { buildOrderPlacedMessage,buildOrderStatusMessage };