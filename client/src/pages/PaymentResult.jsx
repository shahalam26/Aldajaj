import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";

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

        // Cashfree's order ID can be used to find our local order.
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

        // Verify against Cashfree through our authenticated backend.
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

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const orderShortId = order?._id
    ? order._id.slice(-8).toUpperCase()
    : null;

  return (
    <main className="relative min-h-[85vh] overflow-hidden bg-[#11110f] px-4 py-12 text-white sm:px-6 sm:py-16">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-500/10 blur-[110px]" />

      <div className="relative mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Dilli Cuts · Secure Checkout
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#1b1b18] shadow-2xl shadow-black/30">
          <div className="px-6 pb-9 pt-10 text-center sm:px-12 sm:pb-12 sm:pt-12">
            {/* Transaction status icon */}
            <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              {isVerifying ? (
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-amber-400" />
              ) : isSuccess ? (
                <div className="flex h-16 w-16 animate-[pop_0.35s_ease-out] items-center justify-center rounded-full bg-emerald-400 text-3xl font-black text-[#10271b] shadow-lg shadow-emerald-500/20">
                  ✓
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 text-3xl font-bold text-amber-300">
                  !
                </div>
              )}
            </div>

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
              {isVerifying
                ? "Verifying transaction"
                : isSuccess
                ? "Transaction complete"
                : status === "pending"
                ? "Confirmation pending"
                : "Transaction update"}
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {isVerifying
                ? "Almost there..."
                : isSuccess
                ? "Payment successful!"
                : status === "failed"
                ? "Payment unsuccessful"
                : status === "notfound"
                ? "Let's find your order"
                : "We're checking your payment"}
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/60">
              {message}
            </p>

            {isSuccess && (
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                <span>✓</span>
                Secure payment verified
              </div>
            )}
          </div>

          {/* Receipt details */}
          {order && (
            <div className="mx-5 mb-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:mx-8 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Order reference
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold tracking-wider">
                    #{orderShortId}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                    isSuccess
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {isSuccess ? "Paid" : order.paymentStatus}
                </span>
              </div>

              <div className="flex items-end justify-between border-t border-dashed border-white/10 pt-5">
                <div>
                  <p className="text-xs text-white/45">
                    Amount
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/80">
                    {order.items?.length || 0} product type(s)
                  </p>
                </div>

                <p className="text-2xl font-black tracking-tight sm:text-3xl">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-lg">
                  🛵
                </div>
                <div>
                  <p className="text-sm font-bold">
                    What's next?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Track your order status from your orders page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid gap-3 px-5 pb-7 sm:grid-cols-2 sm:px-8 sm:pb-8">
            <button
              onClick={() => navigate("/orders")}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f4c66a] px-5 py-4 text-sm font-black text-[#21190b] transition hover:bg-[#ffda8d] active:scale-[0.98]"
            >
              View my orders
              <span aria-hidden="true">→</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="min-h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white transition hover:bg-white/[0.08] active:scale-[0.98]"
            >
              Continue shopping
            </button>
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-6 text-white/35">
          Please keep your order reference for support.
          <br />
          Dilli Cuts · Freshness you can trust.
        </p>
      </div>

      <style>{`
        @keyframes pop {
          0% { transform: scale(.65); opacity: .3; }
          75% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </main>
  );
}