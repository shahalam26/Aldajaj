
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function StatusIcon({ status }) {
  if (status === "verifying") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#751F2B]/10">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#751F2B]/15 border-t-[#751F2B]" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            d="m5 12 4 4L19 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function getStatusContent(status) {
  const content = {
    verifying: {
      eyebrow: "Secure payment verification",
      title: "Confirming your payment",
      description:
        "We're checking your transaction securely. Please wait and avoid refreshing this page.",
    },
    success: {
      eyebrow: "Payment confirmed",
      title: "Thank you for your order!",
      description:
        "Your payment was received successfully and your order is confirmed.",
    },
    failed: {
      eyebrow: "Payment update",
      title: "Payment unsuccessful",
      description:
        "This payment attempt failed. Check your order status before attempting another payment.",
    },
    pending: {
      eyebrow: "Awaiting confirmation",
      title: "Your payment is taking longer",
      description:
        "The transaction hasn't been confirmed yet. Check My Orders before trying to pay again.",
    },
    notfound: {
      eyebrow: "Order lookup",
      title: "Let's find your order",
      description:
        "We couldn't identify this transaction. Your order may still exist, so check My Orders before attempting another payment.",
    },
    error: {
      eyebrow: "Transaction update",
      title: "We couldn't refresh your payment",
      description:
        "Please check My Orders before retrying. Your transaction may still need confirmation.",
    },
  };

  return content[status] || content.error;
}

export default function PaymentResult({ navigate }) {
  const { clear } = useCart();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState(
    "We're securely confirming your transaction."
  );
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const finish = (nextStatus, nextMessage, nextOrder = null) => {
      if (cancelled) return;

      setStatus(nextStatus);
      setMessage(nextMessage);

      if (nextOrder) setOrder(nextOrder);
    };

    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        let reference =
          sessionStorage.getItem("dilli_pending_order") ||
          params.get("local_order_id") ||
          params.get("order_id") ||
          params.get("orderId") ||
          params.get("cf_order_id");

        // Load only this customer's orders.
        const response = await api("/orders/my-orders");
        const orders = Array.isArray(response.orders)
          ? response.orders
          : [];

        // Match the local order or Cashfree order ID.
        let matchedOrder = reference
          ? orders.find(
              (item) =>
                item._id === reference ||
                item.cashfreeOrderId === reference
            )
          : null;

        // Fallback for a return URL without an order reference.
        if (!matchedOrder && !reference) {
          const cutoff = Date.now() - 30 * 60 * 1000;

          matchedOrder = [...orders]
            .filter(
              (item) =>
                item.paymentMethod === "ONLINE" &&
                new Date(item.createdAt).getTime() >= cutoff
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0];

          if (matchedOrder) {
            reference = matchedOrder._id;
          }
        }

        if (!matchedOrder) {
          finish(
            "notfound",
            "We couldn't identify this transaction. Your order may still exist—please check your orders before attempting another payment."
          );
          return;
        }

        const localOrderId = matchedOrder._id;

        // Verify against Cashfree through the existing backend.
        for (let attempt = 0; attempt < 10; attempt++) {
          if (cancelled) return;

          try {
            const result = await api(
              `/payment/verify/${encodeURIComponent(localOrderId)}`,
              { method: "POST" }
            );

            if (cancelled) return;

            if (result.paymentStatus === "PAID") {
              clear();
              sessionStorage.removeItem("dilli_pending_order");

              finish(
                "success",
                "Payment received successfully. Your order is confirmed.",
                matchedOrder
              );
              return;
            }

            if (result.paymentStatus === "FAILED") {
              finish(
                "failed",
                "This payment attempt failed. Please check your order status before trying again.",
                matchedOrder
              );
              return;
            }
          } catch (error) {
            console.error(
              "Payment verification attempt failed:",
              error.message
            );
          }

          if (attempt < 9) await sleep(2000);
        }

        finish(
          "pending",
          "Your payment is taking longer to confirm. Please check My Orders shortly and don't pay again until you verify the current order.",
          matchedOrder
        );
      } catch (error) {
        console.error("Payment result error:", error);

        finish(
          "error",
          "We couldn't refresh your transaction right now. Please check My Orders before retrying payment."
        );
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [clear]);

  const isSuccess = status === "success";
  const isVerifying = status === "verifying";
  const content = getStatusContent(status);

  const orderShortId = order?._id
    ? order._id.slice(-8).toUpperCase()
    : null;

  return (
    <main className="min-h-[65vh] bg-[#F7F4EF] px-4 py-7 sm:py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DED5] bg-white px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#751F2B]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#746B65]">
              Dilli Cuts · Checkout
            </span>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#E5DED5] bg-white shadow-[0_8px_28px_rgba(41,35,33,0.05)]">
          <div className="px-5 pb-6 pt-7 text-center sm:px-8 sm:pb-7 sm:pt-8">
            <div className="mx-auto flex justify-center">
              <StatusIcon status={status} />
            </div>

            <p
              className={`mt-4 text-[10px] font-bold uppercase tracking-[0.16em] ${
                isSuccess ? "text-emerald-700" : "text-[#751F2B]"
              }`}
            >
              {content.eyebrow}
            </p>

            <h1 className="mt-2 text-xl font-bold tracking-tight text-[#292321] sm:text-2xl">
              {content.title}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#746B65]">
              {message || content.description}
            </p>

            {isVerifying && (
              <p className="mt-3 text-[11px] text-[#8A817A]">
                This may take a few moments.
              </p>
            )}

            {isSuccess && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <span aria-hidden="true">✓</span>
                Secure payment verified
              </div>
            )}
          </div>

          {order && (
            <div className="mx-3 mb-3 rounded-xl border border-[#E5DED5] bg-[#FAF8F5] p-3.5 sm:mx-5 sm:mb-5 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8A817A]">
                    Order reference
                  </p>

                  <p className="mt-1 font-mono text-base font-bold tracking-wide text-[#292321]">
                    #{orderShortId}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-700"
                      : status === "failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {isSuccess
                    ? "PAID"
                    : status === "failed"
                      ? "FAILED"
                      : order.paymentStatus || "PENDING"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 border-t border-dashed border-[#E5DED5] pt-3">
                <div>
                  <p className="text-[11px] text-[#8A817A]">
                    Product types
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#292321]">
                    {order.items?.length || 0}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-[#8A817A]">Order total</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-[#292321]">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[#E5DED5] bg-white p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F4EF] text-[#751F2B]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 7h11v11H3zM14 11h4l3 3v4h-7z"
                      strokeLinejoin="round"
                    />
                    <circle cx="7.5" cy="18" r="1.5" />
                    <circle cx="17.5" cy="18" r="1.5" />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#292321]">
                    What's next?
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-[#746B65]">
                    Track your order status from the My Orders page.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2.5 px-3 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#751F2B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#5E1822] focus:outline-none focus:ring-2 focus:ring-[#751F2B]/30 focus:ring-offset-2"
            >
              View my orders
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="min-h-10 rounded-xl border border-[#E5DED5] bg-white px-4 py-2.5 text-xs font-semibold text-[#514740] transition hover:border-[#B8AAA0] hover:bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#751F2B]/20 focus:ring-offset-2"
            >
              Continue shopping
            </button>
          </div>
        </section>

        <p className="mt-4 text-center text-[10px] leading-5 text-[#8A817A]">
          Keep your order reference for support.
          <br />
          Dilli Cuts · Fresh cuts, thoughtfully delivered.
        </p>
      </div>
    </main>
  );
}
