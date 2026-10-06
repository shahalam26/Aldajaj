let cashfreePromise;

async function loadCashfree() {
  if (!cashfreePromise) {
    cashfreePromise = import("@cashfreepayments/cashfree-js")
      .then(({ load }) => load({ mode: import.meta.env.VITE_CASHFREE_MODE || "sandbox" }));
  }
  return cashfreePromise;
}

export async function openCashfreeCheckout(paymentSessionId) {
  const cashfree = await loadCashfree();
  return cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_self",
  });
}
