
import { useEffect, useState } from "react";
import { api } from "../services/api";

const statusSteps = [
  "PLACED",
  "ACCEPTED",
  "PROCESSING",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const statusLabel = {
  PLACED: "Order placed",
  ACCEPTED: "Accepted",
  PROCESSING: "Preparing",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function Orders({ navigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState("");

  const load = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await api("/orders/my-orders");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancelOrder = async (order) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${order._id
        .slice(-8)
        .toUpperCase()}?`
    );

    if (!confirmed) return;

    try {
      setCancellingOrderId(order._id);
      setError("");
      setSuccess("");

      const data = await api(`/orders/${order._id}/cancel`, {
        method: "PATCH",
      });

      // Update the order immediately using the response from the backend.
      if (data.order) {
        setOrders((previousOrders) =>
          previousOrders.map((item) =>
            item._id === order._id ? data.order : item
          )
        );
      } else {
        // Fallback if the API returns success without the updated order.
        await load(true);
      }

      setSuccess("Your order has been cancelled successfully.");
    } catch (err) {
      setError(err.message || "Unable to cancel this order.");
    } finally {
      setCancellingOrderId("");
    }
  };

  return (
    <section className="min-h-[75vh] bg-[#faf7f2] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c62828]">
              Your account
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              My orders
            </h1>

            <p className="mt-2 text-sm text-black/45">
              Track every fresh cut from our kitchen to your door.
            </p>
          </div>

          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing || Boolean(cancellingOrderId)}
            className="rounded-xl border border-black/7 bg-white px-4 py-2.5 text-xs font-black shadow-sm disabled:opacity-40"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            role="status"
            className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
          >
            {success}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-[28px] bg-black/5"
              />
            ))}
          </div>
        ) : !orders.length ? (
          /* Empty state */
          <div className="mt-8 rounded-[30px] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f4eee8] text-3xl">
              🍗
            </div>

            <h2 className="mt-5 text-xl font-black">No orders yet</h2>

            <p className="mt-2 text-sm text-black/40">
              Your first order will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 rounded-2xl bg-[#171717] px-6 py-3 text-sm font-black text-white transition hover:bg-[#c62828]"
            >
              Start shopping →
            </button>
          </div>
        ) : (
          /* Orders list */
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const currentIndex = statusSteps.indexOf(order.status);
              const cancelled = order.status === "CANCELLED";

              // Only show cancellation for eligible customer COD orders.
              // The backend remains the final authority on cancellation.
              const canCancel =
                order.orderSource === "ONLINE" &&
                order.paymentMethod === "COD" &&
                order.paymentStatus !== "PAID" &&
                order.status === "PLACED";

              const isCancelling = cancellingOrderId === order._id;

              const paymentStatusClass =
                order.paymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-700"
                  : order.paymentStatus === "FAILED"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700";

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    {/* Order header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-black/30">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>

                        <h2 className="mt-1 text-lg font-black">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h2>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-black/[.045] px-3 py-1.5 text-[9px] font-black">
                          {order.paymentMethod}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-[9px] font-black ${paymentStatusClass}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Cancelled state */}
                    {cancelled ? (
                      <div className="mt-6 rounded-2xl bg-red-50 p-4">
                        <p className="text-sm font-black text-red-700">
                          Order cancelled
                        </p>

                        <p className="mt-1 text-xs text-red-700/70">
                          This order will not be delivered.
                        </p>
                      </div>
                    ) : (
                      /* Order progress tracker */
                      <div className="mt-7">
                        <div className="relative">
                          <div className="absolute left-2 right-2 top-2 h-0.5 bg-black/7" />

                          <div
                            className="absolute left-2 top-2 h-0.5 bg-[#c62828] transition-all"
                            style={{
                              width:
                                currentIndex <= 0
                                  ? "0%"
                                  : `${
                                      (currentIndex /
                                        (statusSteps.length - 1)) *
                                      100
                                    }%`,
                            }}
                          />

                          <div className="relative flex justify-between">
                            {statusSteps.map((step, index) => {
                              const done =
                                currentIndex >= 0 && index <= currentIndex;

                              return (
                                <div
                                  key={step}
                                  className="flex w-10 flex-col items-center"
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                      done
                                        ? "border-[#c62828] bg-[#c62828]"
                                        : "border-black/10 bg-white"
                                    }`}
                                  >
                                    {done && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                    )}
                                  </div>

                                  <span
                                    className={`mt-2 text-center text-[8px] font-bold leading-3 ${
                                      done
                                        ? "text-black/70"
                                        : "text-black/25"
                                    }`}
                                  >
                                    {statusLabel[step]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order items */}
                    <div className="mt-7 border-t border-black/6 pt-5">
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div
                            key={`${order._id}-${index}`}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span className="text-black/55">
                              {item.product?.name || "Product"} ×{" "}
                              {item.quantity}
                            </span>

                            <span className="shrink-0 font-black">
                              ₹
                              {(
                                Number(item.price || 0) *
                                Number(item.quantity || 0)
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery address and total */}
                      <div className="mt-5 flex flex-col gap-4 border-t border-black/6 pt-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-black/30">
                            Delivery to
                          </p>

                          <p className="mt-1 max-w-md text-xs leading-5 text-black/50">
                            {order.deliveryAddress?.addressLine}
                            {order.deliveryAddress?.city
                              ? `, ${order.deliveryAddress.city}`
                              : ""}
                            {order.deliveryAddress?.state
                              ? `, ${order.deliveryAddress.state}`
                              : ""}
                            {order.deliveryAddress?.pincode
                              ? ` — ${order.deliveryAddress.pincode}`
                              : ""}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-[9px] font-black uppercase tracking-wider text-black/30">
                            Total
                          </p>

                          <p className="mt-1 text-2xl font-black">
                            ₹
                            {Number(order.totalAmount || 0).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Customer cancellation action */}
                      {canCancel && (
                        <div className="mt-5 flex flex-col gap-3 border-t border-black/6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs leading-5 text-black/45">
                            You can cancel this COD order while it is still
                            awaiting acceptance.
                          </p>

                          <button
                            type="button"
                            onClick={() => cancelOrder(order)}
                            disabled={Boolean(cancellingOrderId)}
                            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isCancelling ? "Cancelling..." : "Cancel order"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
