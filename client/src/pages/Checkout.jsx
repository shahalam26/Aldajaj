import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { openCashfreeCheckout } from "../services/cashfree";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const emptyAddress = {
  label: "HOME",
  addressLine: "",
  city: "Delhi",
  state: "Delhi",
  pincode: "",
  landmark: "",
  latitude: null,
  longitude: null,
  isDefault: false,
};

export default function Checkout({ navigate }) {
  const { user, setUser } = useAuth();
  const { items, total, clear } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const hydrateUser = async () => {
      try {
        setLoadingProfile(true);

        const data = await api("/users/me");

        if (!active) return;

        const nextUser = data.user;

        setUser(nextUser);
        const nextAddresses = nextUser?.addresses || [];

        setAddresses(nextAddresses);

        const defaultAddress =
          nextAddresses.find((address) => address.isDefault) ||
          nextAddresses[0];

        setAddressId(defaultAddress?._id || "");
      } catch (error) {
        if (active) {
          setMessage(error.message || "Unable to load your saved addresses.");
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    };

    hydrateUser();

    return () => {
      active = false;
    };
  }, [setUser]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.productData?.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [items]
  );

  const saveAddress = async () => {
    if (!addressForm.addressLine.trim()) {
      return setMessage("Enter your house, street or area.");
    }

    if (!addressForm.city.trim()) {
      return setMessage("Enter your city.");
    }

    if (!addressForm.state.trim()) {
      return setMessage("Enter your state.");
    }

    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      return setMessage("Enter a valid 6-digit pincode.");
    }

    try {
      setSavingAddress(true);
      setMessage("");

      const data = await api("/users/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...addressForm,
          addressLine: addressForm.addressLine.trim(),
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          pincode: addressForm.pincode.trim(),
          landmark: addressForm.landmark.trim(),
          isDefault: addresses.length === 0,
        }),
      });

      const nextAddresses = data.addresses || [];

      setAddresses(nextAddresses);
      setUser((current) =>
        current ? { ...current, addresses: nextAddresses } : current
      );

      const created = nextAddresses[nextAddresses.length - 1];

      setAddressId(
        created?._id ||
          nextAddresses.find((address) => address.isDefault)?._id ||
          ""
      );

      setAddressForm({ ...emptyAddress });
      setShowAddressForm(false);
      setMessage("Delivery address saved.");
    } catch (error) {
      setMessage(error.message || "Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    if (!items.length) {
      navigate("/cart");
      return;
    }

    if (!addressId) {
      setMessage("Please select a delivery address.");
      return;
    }

    try {
      setBusy(true);
      setMessage("");

      const payload = {
        items: items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
        paymentMethod,
        addressId,
      };

      const data = await api("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (paymentMethod === "COD") {
        clear();
        navigate(`/orders?placed=${data.order?._id || ""}`);
        return;
      }

      if (!data.payment?.paymentSessionId) {
        throw new Error("Payment session was not created.");
      }

      sessionStorage.setItem(
        "dilli_pending_order",
        data.order?._id || ""
      );

      await openCashfreeCheckout(
        data.payment.paymentSessionId
      );
    } catch (error) {
      setMessage(error.message || "Unable to place order.");
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    navigate("/cart");
    return null;
  }

  return (
    <section className="min-h-[75vh] bg-[#faf7f2] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/cart")}
          className="text-sm font-bold text-black/40 hover:text-[#c62828]"
        >
          ← Back to cart
        </button>

        <div className="mt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c62828]">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Almost there.
          </h1>
          <p className="mt-2 text-sm text-black/45">
            Choose where you'd like your fresh cuts delivered.
          </p>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/30">
                    Step 1
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Delivery address
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddressForm((value) => !value)}
                  className="rounded-xl bg-[#171717] px-3.5 py-2.5 text-xs font-black text-white"
                >
                  {showAddressForm ? "Close" : "+ New address"}
                </button>
              </div>

              {loadingProfile ? (
                <div className="mt-5 space-y-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-2xl bg-black/5"
                    />
                  ))}
                </div>
              ) : addresses.length ? (
                <div className="mt-5 space-y-2">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`block cursor-pointer rounded-2xl border p-4 transition ${
                        addressId === address._id
                          ? "border-[#c62828] bg-[#c62828]/[.035]"
                          : "border-black/7 hover:border-black/15"
                      }`}
                    >
                      <div className="flex gap-3">
                        <input
                          type="radio"
                          name="delivery-address"
                          checked={addressId === address._id}
                          onChange={() => setAddressId(address._id)}
                          className="mt-1 accent-[#c62828]"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black">
                              {address.label}
                            </span>
                            {address.isDefault && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-5 text-black/50">
                            {address.addressLine}, {address.city},{" "}
                            {address.state} — {address.pincode}
                          </p>
                          {address.landmark && (
                            <p className="mt-1 text-xs text-black/30">
                              Near {address.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#f7f6f3] p-5">
                  <p className="text-sm font-black">
                    No saved address yet.
                  </p>
                  <p className="mt-1 text-xs text-black/40">
                    Add your delivery address below.
                  </p>
                </div>
              )}

              {showAddressForm && (
                <div className="mt-5 rounded-[22px] bg-[#f7f6f3] p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {["HOME", "WORK", "OTHER"].map((label) => (
                      <button
                        key={label}
                        onClick={() =>
                          setAddressForm({
                            ...addressForm,
                            label,
                          })
                        }
                        className={`rounded-xl py-2.5 text-[10px] font-black ${
                          addressForm.label === label
                            ? "bg-black text-white"
                            : "bg-white text-black/45"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <input
                    value={addressForm.addressLine}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        addressLine: e.target.value,
                      })
                    }
                    placeholder="House / street / area"
                    className="mt-3 w-full rounded-2xl border border-black/7 bg-white px-4 py-3 text-sm outline-none"
                  />

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          city: e.target.value,
                        })
                      }
                      placeholder="City"
                      className="rounded-2xl border border-black/7 bg-white px-4 py-3 text-sm outline-none"
                    />
                    <input
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          state: e.target.value,
                        })
                      }
                      placeholder="State"
                      className="rounded-2xl border border-black/7 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      value={addressForm.pincode}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        })
                      }
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      className="rounded-2xl border border-black/7 bg-white px-4 py-3 text-sm outline-none"
                    />
                    <input
                      value={addressForm.landmark}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          landmark: e.target.value,
                        })
                      }
                      placeholder="Landmark"
                      className="rounded-2xl border border-black/7 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <button
                    onClick={saveAddress}
                    disabled={savingAddress}
                    className="mt-3 w-full rounded-2xl bg-[#171717] py-3 text-xs font-black text-white disabled:opacity-40"
                  >
                    {savingAddress ? "Saving..." : "Save address"}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-wider text-black/30">
                Step 2
              </p>
              <h2 className="mt-1 text-xl font-black">
                Payment method
              </h2>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setPaymentMethod("COD")}
                  className={`rounded-2xl border p-4 text-left ${
                    paymentMethod === "COD"
                      ? "border-[#c62828] bg-[#c62828]/[.035]"
                      : "border-black/7"
                  }`}
                >
                  <p className="text-sm font-black">Cash on Delivery</p>
                  <p className="mt-1 text-xs text-black/40">
                    Pay when your order arrives.
                  </p>
                </button>

                <button
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`rounded-2xl border p-4 text-left ${
                    paymentMethod === "ONLINE"
                      ? "border-[#c62828] bg-[#c62828]/[.035]"
                      : "border-black/7"
                  }`}
                >
                  <p className="text-sm font-black">Online payment</p>
                  <p className="mt-1 text-xs text-black/40">
                    Secure Cashfree checkout.
                  </p>
                </button>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-[28px] bg-[#171717] p-6 text-white lg:sticky lg:top-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Your order
            </p>

            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div
                  key={item.product}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white/75">
                      {item.productData?.name}
                    </p>
                    <p className="mt-1 text-[10px] text-white/30">
                      {item.quantity} × ₹{item.productData?.price}
                    </p>
                  </div>
                  <p className="text-xs font-black">
                    ₹
                    {Number(item.productData?.price || 0) *
                      Number(item.quantity || 0)}
                  </p>
                </div>
              ))}
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/45">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-white/45">
                <span>Delivery</span>
                <span>Included</span>
              </div>
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="flex items-end justify-between">
              <span className="text-xs text-white/40">Total</span>
              <span className="text-3xl font-black">₹{total}</span>
            </div>

            <button
              onClick={placeOrder}
              disabled={busy || !addressId || loadingProfile}
              className="mt-6 w-full rounded-2xl bg-[#c62828] py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              {busy
                ? "Processing..."
                : paymentMethod === "ONLINE"
                  ? "Proceed to secure payment →"
                  : "Place COD order →"}
            </button>

            <p className="mt-3 text-center text-[9px] leading-4 text-white/25">
              By placing the order, you confirm the selected delivery address
              and payment method.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
