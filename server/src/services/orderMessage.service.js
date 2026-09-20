const buildOrderPlacedMessage = (order, user) => {
  return `
Hello ${user.name || "Customer"} 👋

Your order has been placed successfully! 🎉

Order ID: ${order._id}
Total Amount: ₹${order.totalAmount}
Payment Method: ${order.paymentMethod}

Delivery Address:
${order.deliveryAddress.addressLine}
${order.deliveryAddress.city}, ${order.deliveryAddress.state}
${order.deliveryAddress.pincode}

Thank you for ordering with us! ❤️
`;
};

export { buildOrderPlacedMessage };