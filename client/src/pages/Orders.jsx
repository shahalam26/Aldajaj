
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

const statusShortLabel = {
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  PROCESSING: "Preparing",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getPaymentStatusStyle(status) {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  }

  if (status === "FAILED") {
    return "bg-red-50 text-red-700 ring-red-600/10";
  }

  return "bg-amber-50 text-amber-800 ring-amber-600/10";
}

function getOrderStatusStyle(status) {
  if (status === "DELIVERED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "CANCELLED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-[#F7F4EF] text-[#751F2B]";
}

function OrderTimeline({ status }) {
  const currentIndex = statusSteps.indexOf(status);

  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm font-bold text-red-700">Order cancelled</p>
        <p className="mt-1 text-xs leading-5 text-red-700/75">
          This order will not be delivered.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-[#FAF8F5] px-3 py-5 sm:px-5">
      <div className="relative">
        <div className="absolute left-[7%] right-[7%] top-[11px] h-[2px] bg-[#E5DED5]" />

        <div
          className="absolute left-[7%] top-[11px] h-[2px] bg-[#751F2B] transition-all duration-500"
          style={{
            width:
              currentIndex <= 0
                ? "0%"
                : `${(currentIndex / (statusSteps.length - 1)) * 86}%`,
          }}
        />

        <div className="relative flex justify-between">
          {statusSteps.map((step, index) => {
            const done = currentIndex >= 0 && index <= currentIndex;
            const active = index === currentIndex;

            return (
              <div
                key={step}
                className="flex w-[14.3%] min-w-0 flex-col items-center"
              >
                <div
                  className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                    done
                      ? "border-[#751F2B] bg-[#751F2B] text-white"
                      : "border-[#D8CEC4] bg-white text-transparent"
                  } ${active ? "ring-4 ring-[#751F2B]/10" : ""}`}
                >
                  {done ? (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-3 w-3"
                      aria-hidden="true"
                    >
                      <path
                        d="m3.5 8 3 3 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </div>

                <span
                  className={`mt-2 text-center text-[9px] leading-3 sm:text-[10px] ${
                    done
                      ? "font-bold text-[#751F2B]"
                      : "font-medium text-[#A39A92]"
                  }`}
                >
                  {statusShortLabel[step]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 border-t border-[#E5DED5] pt-3 text-xs leading-5 text-[#746B65]">
        {currentIndex >= 0
          ? `Current status: ${statusLabel[status]}.`
          : "Your order status will update here."}
      </p>
    </div>
  );
}

function EmptyOrders({ navigate }) {
  return (
    <div className="mt-8 rounded-3xl border border-[#E5DED5] bg-white px-5 py-14 text-center sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7F4EF] text-[#751F2B]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path
            d="M4 7.5h16l-1.5 12h-13L4 7.5Z"
            strokeLinejoin="round"
          />
          <path
            d="M9 8V6a3 3 0 0 1 6 0v2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 className="mt-5 text-xl font-bold tracking-tight text-[#292321]">
        No orders yet
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#746B65]">
        Your orders will appear here once you place your first order.
      </p>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#751F2B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5E1822] focus:outline-none focus:ring-2 focus:ring-[#751F2B]/30 focus:ring-offset-2"
      >
        Explore products
        <span className="ml-2" aria-hidden="true">→</span>
      </button>
    </div>
  );
}

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

      if (data.order) {
        setOrders((previousOrders) =>
          previousOrders.map((item) =>
            item._id === order._id ? data.order : item
          )
        );
      } else {
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
    <section className="min-h-[75vh] bg-[#F7F4EF] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#751F2B]">
              Your account
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#292321] sm:text-4xl">
              My orders
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-[#746B65]">
              Follow your order from confirmation to delivery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing || Boolean(cancellingOrderId)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E5DED5] bg-white px-4 py-2.5 text-xs font-semibold text-[#514740] transition hover:border-[#B8AAA0] hover:text-[#751F2B] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            >
              <path
                d="M20 7v5h-5M4 17v-5h5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5a7 7 0 0 0 11.7-2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh orders"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            <span className="font-bold">!</span>
            <p className="flex-1 leading-5">{error}</p>
            <button
              type="button"
              onClick={() => load(true)}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 font-bold">
              ✓
            </span>
            {success}
          </div>
        )}

        {loading ? (
          <div className="mt-8 space-y-5" aria-label="Loading orders">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[#E5DED5] bg-white p-5 sm:p-6"
              >
                <div className="h-3 w-28 rounded bg-[#EAE4DD]" />
                <div className="mt-3 h-5 w-44 rounded bg-[#EAE4DD]" />
                <div className="mt-7 h-16 rounded-xl bg-[#F7F4EF]" />
                <div className="mt-5 h-14 rounded-xl bg-[#F7F4EF]" />
              </div>
            ))}
          </div>
        ) : !orders.length ? (
          <EmptyOrders navigate={navigate} />
        ) : (
          <div className="mt-7 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#746B65]">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
            </div>

            {orders.map((order) => {
              const cancelled = order.status === "CANCELLED";

              // Preserve the existing customer cancellation eligibility.
              const canCancel =
                order.orderSource === "ONLINE" &&
                order.paymentMethod === "COD" &&
                order.paymentStatus !== "PAID" &&
                order.status === "PLACED";

              const isCancelling = cancellingOrderId === order._id;

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-2xl border border-[#E5DED5] bg-white shadow-[0_2px_12px_rgba(41,35,33,0.025)] transition hover:border-[#D8C9BE]"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A817A]">
                          {formatDate(order.createdAt)}
                        </p>

                        <h2 className="mt-1.5 text-lg font-bold tracking-tight text-[#292321]">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${getOrderStatusStyle(order.status)}`}
                        >
                          {statusLabel[order.status] || order.status}
                        </span>

                        <span className="rounded-full bg-[#F7F4EF] px-3 py-1.5 text-[10px] font-semibold text-[#514740]">
                          {order.paymentMethod}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ring-1 ring-inset ${getPaymentStatusStyle(order.paymentStatus)}`}
                        >
                          {order.paymentStatus || "PENDING"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <OrderTimeline status={order.status} />
                    </div>

                    <div className="mt-5 border-t border-[#EEE8E1] pt-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A817A]">
                        Items ordered
                      </p>

                      <div className="mt-3 space-y-3">
                        {order.items?.map((item, index) => (
                          <div
                            key={`${order._id}-${index}`}
                            className="flex items-start justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#292321]">
                                {item.product?.name || "Product"}
                              </p>
                              <p className="mt-1 text-xs text-[#8A817A]">
                                Quantity: {item.quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-semibold text-[#292321]">
                              {formatCurrency(
                                Number(item.price || 0) *
                                  Number(item.quantity || 0)
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {cancelled && (
                      <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-700">
                          This order has been cancelled
                        </p>
                        <p className="mt-1 text-xs leading-5 text-red-700/75">
                          The order will not be delivered.
                        </p>
                      </div>
                    )}

                    <div className="mt-5 grid gap-4 border-t border-[#EEE8E1] pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A817A]">
                          Delivery address
                        </p>

                        <p className="mt-1.5 text-xs leading-5 text-[#746B65]">
                          {[
                            order.deliveryAddress?.addressLine,
                            order.deliveryAddress?.city,
                            order.deliveryAddress?.state,
                            order.deliveryAddress?.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Address details unavailable"}
                        </p>
                      </div>

                      <div className="border-t border-dashed border-[#E5DED5] pt-3 sm:border-0 sm:pt-0 sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A817A]">
                          Order total
                        </p>

                        <p className="mt-1 text-2xl font-bold tracking-tight text-[#292321]">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {canCancel && (
                      <div className="mt-5 flex flex-col gap-3 border-t border-[#EEE8E1] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-[#746B65]">
                          Cancellation is available while your order is awaiting
                          acceptance.
                        </p>

                        <button
                          type="button"
                          onClick={() => cancelOrder(order)}
                          disabled={Boolean(cancellingOrderId)}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCancelling ? "Cancelling..." : "Cancel order"}
                        </button>
                      </div>
                    )}
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
