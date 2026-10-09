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

  const load = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
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

  return (
    <section className="min-h-[75vh] bg-[#faf7f2] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
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
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-xl border border-black/7 bg-white px-4 py-2.5 text-xs font-black shadow-sm disabled:opacity-40"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

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
          <div className="mt-8 rounded-[30px] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f4eee8] text-3xl">
              🍗
            </div>
            <h2 className="mt-5 text-xl font-black">
              No orders yet
            </h2>
            <p className="mt-2 text-sm text-black/40">
              Your first order will appear here.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 rounded-2xl bg-[#171717] px-6 py-3 text-sm font-black text-white"
            >
              Start shopping →
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const currentIndex = statusSteps.indexOf(order.status);
              const cancelled = order.status === "CANCELLED";

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-black/30">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <h2 className="mt-1 text-lg font-black">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h2>
                      </div>

                      <div className="flex gap-2">
                        <span className="rounded-full bg-black/[.045] px-3 py-1.5 text-[9px] font-black">
                          {order.paymentMethod}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1.5 text-[9px] font-black ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : order.paymentStatus === "FAILED"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {cancelled ? (
                      <div className="mt-6 rounded-2xl bg-red-50 p-4">
                        <p className="text-sm font-black text-red-700">
                          Order cancelled
                        </p>
                        <p className="mt-1 text-xs text-red-700/55">
                          This order will not be delivered.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-7">
                        <div className="relative">
                          <div className="absolute left-2 right-2 top-2 h-0.5 bg-black/7" />
                          <div
                            className="absolute left-2 top-2 h-0.5 bg-[#c62828] transition-all"
                            style={{
                              width:
                                currentIndex <= 0
                                  ? "0%"
                                  : `${(currentIndex / (statusSteps.length - 1)) * 100}%`,
                            }}
                          />

                          <div className="relative flex justify-between">
                            {statusSteps.map((step, index) => {
                              const done = index <= currentIndex;
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
                                      done ? "text-black/70" : "text-black/25"
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

                    <div className="mt-7 border-t border-black/6 pt-5">
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div
                            key={`${order._id}-${index}`}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-black/55">
                              {item.product?.name || "Product"} × {item.quantity}
                            </span>
                            <span className="font-black">
                              ₹{Number(item.price || 0) * Number(item.quantity || 0)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-4 border-t border-black/6 pt-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-black/30">
                            Delivery to
                          </p>
                          <p className="mt-1 max-w-md text-xs leading-5 text-black/50">
                            {order.deliveryAddress?.addressLine},{" "}
                            {order.deliveryAddress?.city},{" "}
                            {order.deliveryAddress?.state} —{" "}
                            {order.deliveryAddress?.pincode}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-[9px] font-black uppercase tracking-wider text-black/30">
                            Total
                          </p>
                          <p className="mt-1 text-2xl font-black">
                            ₹{order.totalAmount}
                          </p>
                        </div>
                      </div>
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
