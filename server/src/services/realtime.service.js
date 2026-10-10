
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initializeRealtime = (httpServer) => {
  const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(
          new Error("Origin is not allowed by Socket.IO CORS")
        );
      },
      credentials: true,
    },
  });

  // Authenticate every socket connection using the existing JWT.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.userId || !decoded.role) {
        return next(new Error("Invalid authentication token"));
      }

      socket.data.userId = String(decoded.userId);
      socket.data.role = decoded.role;

      return next();
    } catch {
      return next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.role === "admin") {
      socket.join("admins");
    } else {
      socket.join(`user:${socket.data.userId}`);
    }

    console.log("Realtime client connected:", socket.data.role);
  });

  return io;
};

const getUserId = (order) => {
  const user =
    order?.user && typeof order.user === "object"
      ? order.user._id
      : order?.user;

  return user?.toString();
};

const buildOrderPayload = (order) => ({
  orderId: order._id.toString(),
  status: order.status,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  orderSource: order.orderSource,
  totalAmount: Number(order.totalAmount || 0),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

export const emitOrderCreated = (order) => {
  if (!io || !order?._id) return;

  const payload = buildOrderPayload(order);

  // New order notifications go only to authenticated admins.
  io.to("admins").emit("order:new", payload);

  // Notify only the customer who owns this order.
  const userId = getUserId(order);

  if (userId) {
    io.to(`user:${userId}`).emit("order:updated", payload);
  }
};

export const emitOrderUpdated = (order) => {
  if (!io || !order?._id) return;

  const payload = buildOrderPayload(order);

  io.to("admins").emit("order:updated", payload);

  const userId = getUserId(order);

  if (userId) {
    io.to(`user:${userId}`).emit("order:updated", payload);
  }
};
