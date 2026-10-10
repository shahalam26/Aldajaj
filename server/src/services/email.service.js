
import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: String(SMTP_SECURE ?? "true").toLowerCase() === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount) || 0);

const formatStatus = (status = "") =>
  String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getAddressText = (address = {}) =>
  [
    address.addressLine,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Address details unavailable";

const getItemsHtml = (order) => {
  const items = order.items || [];

  if (!items.length) {
    return '<tr><td colspan="4">Item details unavailable</td></tr>';
  }

  return items
    .map((item) => {
      const name =
        typeof item.product === "object"
          ? item.product?.name || "Product"
          : "Product";

      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            ${escapeHtml(name)}
          </td>
          <td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">
            ${quantity}
          </td>
          <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
            ${formatCurrency(price)}
          </td>
          <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
            ${formatCurrency(quantity * price)}
          </td>
        </tr>`;
    })
    .join("");
};

const buildOrderEmail = (order, user, event) => {
  const orderId = order._id?.toString() || "N/A";
  const customerName = user?.name || "Customer";
  const status = formatStatus(order.status || "PLACED");

  let heading;
  let message;

  if (event === "status" && order.status === "ACCEPTED") {
    heading = "Your Dilli Cuts order has been accepted";
    message =
      "Great news! Your order has been accepted and is being prepared.";
  } else if (event === "status" && order.status === "DELIVERED") {
    heading = "Your Dilli Cuts order has been delivered";
    message =
      "Your order has been delivered successfully. Thank you for ordering with Dilli Cuts!";
  } else if (event === "payment") {
    heading = "Payment successful";
    message =
      "Your online payment has been confirmed. Thank you for ordering with Dilli Cuts!";
  } else {
    throw new Error("Unsupported email event");
  }

  const address = getAddressText(order.deliveryAddress);
  const total = formatCurrency(order.totalAmount);

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(heading)}</title>
      </head>

      <body style="margin:0;padding:24px;background:#f4f4f4;font-family:Arial,sans-serif;color:#222;">
        <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
          <header style="background:#991b1b;color:#fff;padding:24px;text-align:center;">
            <h1 style="margin:0;font-size:28px;">Dilli Cuts</h1>
            <p style="margin:8px 0 0;">Freshness delivered to your door</p>
          </header>

          <main style="padding:24px;">
            <h2>${escapeHtml(heading)}</h2>
            <p>Hi ${escapeHtml(customerName)},</p>
            <p>${escapeHtml(message)}</p>

            <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0;">
              <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
              <p><strong>Order status:</strong> ${escapeHtml(status)}</p>
              <p><strong>Payment method:</strong> ${escapeHtml(order.paymentMethod || "N/A")}</p>
              <p><strong>Payment status:</strong> ${escapeHtml(formatStatus(order.paymentStatus || "PENDING"))}</p>
            </div>

            <h3>Order items</h3>

            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:12px;text-align:left;">Item</th>
                  <th style="padding:12px;text-align:center;">Qty</th>
                  <th style="padding:12px;text-align:right;">Price</th>
                  <th style="padding:12px;text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${getItemsHtml(order)}</tbody>
            </table>

            <h3 style="text-align:right;margin-top:20px;">
              Total: ${total}
            </h3>

            <h3>Delivery address</h3>
            <p>${escapeHtml(address)}</p>

            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

            <p style="font-size:13px;color:#666;">
              This is an automated email from Dilli Cuts.
              For help with your order, contact our support team.
            </p>
          </main>
        </div>
      </body>
    </html>`;

  const text = [
    heading,
    "",
    `Hi ${customerName},`,
    message,
    "",
    `Order ID: ${orderId}`,
    `Order status: ${status}`,
    `Payment method: ${order.paymentMethod || "N/A"}`,
    `Payment status: ${formatStatus(order.paymentStatus || "PENDING")}`,
    `Total: ${total}`,
    `Delivery address: ${address}`,
  ].join("\n");

  return { subject: heading, html, text };
};

/**
 * Email policy:
 * - "placed": skipped
 * - "status": only ACCEPTED and DELIVERED
 * - "payment": successful online payment confirmation
 *
 * Email is optional. Email errors must never fail an order.
 */
const sendOrderEmail = async (
  order,
  user,
  event = "placed"
) => {
  try {
    // Do not send order-placed emails.
    if (event === "placed") {
      console.info(
        `Order email skipped: order confirmation email disabled for ${order?._id}`
      );
      return false;
    }

    // Only send selected status updates.
    if (
      event === "status" &&
      !["ACCEPTED", "DELIVERED"].includes(order?.status)
    ) {
      console.info(
        `Order status email skipped for status ${order?.status}`
      );
      return false;
    }

    // Ignore unknown event types.
    if (!["status", "payment"].includes(event)) {
      console.warn("Order email skipped: unsupported event");
      return false;
    }

    const recipient = user?.email?.trim();

    // Customer email is optional.
    if (!recipient) {
      console.info(
        `Order email skipped: customer email missing for ${order?._id}`
      );
      return false;
    }

    const mailer = getTransporter();

    if (!mailer) {
      console.warn(
        "Order email skipped: SMTP configuration is missing."
      );
      return false;
    }

    const { subject, html, text } = buildOrderEmail(
      order,
      user,
      event
    );

    const info = await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: `[Dilli Cuts] ${subject}`,
      html,
      text,
    });

    console.info("Order email sent:", {
      orderId: order._id?.toString(),
      event,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return true;
  } catch (error) {
    console.error("Order email failed:", error.message);
    return false;
  }
};

export default sendOrderEmail;
