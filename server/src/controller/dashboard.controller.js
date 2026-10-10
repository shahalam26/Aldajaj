import Order from "../model/order.model.js";
import Product from "../model/product.model.js";
import User from "../model/user.model.js";

// =====================================================
// GET TODAY DASHBOARD - ADMIN
// =====================================================

const getTodayDashboard = async (req, res) => {
  try {
    // =====================================================
    // TODAY DATE RANGE
    // =====================================================

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // =====================================================
    // TODAY'S ORDERS
    // =====================================================

    const orders = await Order.find({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    const todayOrders = orders.length;

    // =====================================================
    // TODAY'S SALES
    // =====================================================

    const todaySales = orders
  .filter(
    (order) =>
      order.status !== "CANCELLED" &&
      order.paymentStatus === "PAID"
  )
  .reduce((total, order) => {
    return total + Number(order.totalAmount || 0);
  }, 0);

    // =====================================================
    // PENDING ORDERS
    // =====================================================

    const pendingOrders = orders.filter((order) =>
      [
        "PLACED",
        "ACCEPTED",
        "PROCESSING",
        "PACKED",
        "OUT_FOR_DELIVERY",
      ].includes(order.status)
    ).length;

    // =====================================================
    // TOTAL CUSTOMERS
    // =====================================================

    const totalCustomers = await User.countDocuments({
      role: "user",
    });

    // =====================================================
    // NEW CUSTOMERS TODAY
    // =====================================================

    const newCustomersToday = await User.countDocuments({
      role: "user",
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    // =====================================================
    // LOW STOCK PRODUCTS
    // Stock between 0 and 5
    // =====================================================

    const lowStockProducts = await Product.countDocuments({
      stock: {
        $gte: 0,
        $lte: 5,
      },
    });

    // =====================================================
    // NEGATIVE STOCK PRODUCTS
    // =====================================================

    const negativeStockProducts = await Product.countDocuments({
      stock: {
        $lt: 0,
      },
    });

    // =====================================================
    // ORDER STATUS BREAKDOWN
    // =====================================================

    const orderStatus = {
      PLACED: 0,
      ACCEPTED: 0,
      PROCESSING: 0,
      PACKED: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((order) => {
      if (orderStatus[order.status] !== undefined) {
        orderStatus[order.status]++;
      }
    });

    // =====================================================
    // ONLINE VS POS ORDERS
    // =====================================================

    const onlineOrders = orders.filter(
      (order) => order.orderSource === "ONLINE"
    ).length;

    const posOrders = orders.filter(
      (order) => order.orderSource === "POS"
    ).length;

    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(200).json({
      success: true,

      dashboard: {
        // Sales
        todayOrders,
        todaySales,

        // Order activity
        pendingOrders,

        // Customers
        totalCustomers,
        newCustomersToday,

        // Inventory
        lowStockProducts,
        negativeStockProducts,

        // Order status
        orderStatus,

        // Order source
        onlineOrders,
        posOrders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { getTodayDashboard };