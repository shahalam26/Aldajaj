
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

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export default function Checkout({ navigate }) {
  const { setUser } = useAuth();
  const { items, total, clear } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!items.length) {
      navigate("/cart");
    }
  }, [items.length, navigate]);

  useEffect(() => {
    let active = true;

    const hydrateUser = async () => {
      try {
        setLoadingProfile(true);
        setMessage("");

        const data = await api("/users/me");
        if (!active) return;

        const nextUser = data.user;
        const nextAddresses = nextUser?.addresses || [];

        setUser(nextUser);
        setAddresses(nextAddresses);

        const preferredAddress =
          nextAddresses.find((address) => address.isDefault) ||
          nextAddresses[0];

        setAddressId(preferredAddress?._id || "");

        // First-time customers should see the form immediately.
        setShowAddressForm(nextAddresses.length === 0);
      } catch (error) {
        if (active) {
          setMessage(
            error.message || "Unable to load your saved addresses."
          );
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

  const updateAddressForm = (field, value) => {
    setAddressForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveAddress = async () => {
    if (!addressForm.addressLine.trim()) {
      setMessage("Enter your house, street or area.");
      return;
    }

    if (!addressForm.city.trim()) {
      setMessage("Enter your city.");
      return;
    }

    if (!addressForm.state.trim()) {
      setMessage("Enter your state.");
      return;
    }

    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      setMessage("Enter a valid 6-digit pincode.");
      return;
    }

    try {
      setSavingAddress(true);
      setMessage("");

      const existingIds = new Set(addresses.map((address) => address._id));

      const data = await api("/users/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...addressForm,
          addressLine: addressForm.addressLine.trim(),
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          pincode: addressForm.pincode.trim(),
          landmark: addressForm.landmark.trim(),
          isDefault: addresses.length === 0 || addressForm.isDefault,
        }),
      });

      const nextAddresses = data.addresses || [];
      setAddresses(nextAddresses);

      setUser((current) =>
        current ? { ...current, addresses: nextAddresses } : current
      );

      // Select the newly created address, not simply the last array item.
      const createdAddress = nextAddresses.find(
        (address) => !existingIds.has(address._id)
      );

      const preferredAddress =
        createdAddress ||
        nextAddresses.find((address) => address.isDefault) ||
        nextAddresses[0];

      setAddressId(preferredAddress?._id || "");
      setAddressForm({ ...emptyAddress });
      setShowAddressForm(false);
      setMessage("Address saved and selected for checkout.");
    } catch (error) {
      setMessage(error.message || "Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddressForm((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setMessage("Location captured.");
      },
      () => setMessage("Location permission was denied.")
    );
  };

  const placeOrder = async () => {
    if (!items.length) {
      navigate("/cart");
      return;
    }

    if (!addressId) {
      setMessage("Please add or select a delivery address.");
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

      await openCashfreeCheckout(data.payment.paymentSessionId);
    } catch (error) {
      setMessage(error.message || "Unable to place order.");
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) return null;

  return (
    <section className="min-h-[75vh] bg-[#F7F4EF] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="text-sm font-semibold text-[#746B65] transition hover:text-[#751F2B]"
        >
          ← Back to cart
        </button>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#751F2B]">
            Secure checkout
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#292321] sm:text-4xl">
            Almost there.
          </h1>
          <p className="mt-2 text-sm text-[#746B65]">
            Select a saved address or add a new delivery address.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-[#E5DED5] bg-white px-4 py-3 text-sm text-[#514740]"
          >
            {message}
          </div>
        )}

        <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#E5DED5] bg-white p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A817A]">
                    Step 1
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[#292321]">
                    Delivery address
                  </h2>
                </div>

                {!showAddressForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setShowAddressForm(true);
                    }}
                    className="rounded-xl bg-[#751F2B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#5E1822]"
                  >
                    + Add new address
                  </button>
                )}
              </div>

              {loadingProfile ? (
                <div className="mt-5 space-y-3">
                  <div className="h-20 animate-pulse rounded-xl bg-[#F7F4EF]" />
                  <div className="h-20 animate-pulse rounded-xl bg-[#F7F4EF]" />
                </div>
              ) : addresses.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {addresses.map((address) => {
                    const selected = addressId === address._id;

                    return (
                      <label
                        key={address._id}
                        className={`block cursor-pointer rounded-xl border p-4 transition ${
                          selected
                            ? "border-[#751F2B] bg-[#751F2B]/[0.035] ring-1 ring-[#751F2B]/10"
                            : "border-[#E5DED5] hover:border-[#B8AAA0]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="delivery-address"
                            value={address._id}
                            checked={selected}
                            onChange={() => setAddressId(address._id)}
                            className="mt-1 accent-[#751F2B]"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-[#292321]">
                                {address.label || "ADDRESS"}
                              </span>

                              {address.isDefault && (
                                <span className="rounded-full bg-[#28734A]/10 px-2 py-1 text-[9px] font-bold text-[#28734A]">
                                  DEFAULT
                                </span>
                              )}

                              {selected && (
                                <span className="text-[10px] font-semibold text-[#751F2B]">
                                  SELECTED
                                </span>
                              )}
                            </div>

                            <p className="mt-1.5 text-sm leading-5 text-[#746B65]">
                              {address.addressLine}, {address.city},{" "}
                              {address.state} — {address.pincode}
                            </p>

                            {address.landmark && (
                              <p className="mt-1 text-xs text-[#8A817A]">
                                Landmark: {address.landmark}
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-[#F7F4EF] p-4">
                  <p className="text-sm font-semibold text-[#292321]">
                    No saved addresses yet
                  </p>
                  <p className="mt-1 text-sm text-[#746B65]">
                    Add your first delivery address to continue.
                  </p>
                </div>
              )}

              {showAddressForm && (
                <div className="mt-5 rounded-xl border border-[#E5DED5] bg-[#FCFAF7] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#292321]">
                        {addresses.length ? "Add another address" : "Add delivery address"}
                      </h3>
                      <p className="mt-1 text-xs text-[#746B65]">
                        Your address will be saved to your account.
                      </p>
                    </div>

                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setAddressForm({ ...emptyAddress });
                          setMessage("");
                        }}
                        className="text-xs font-semibold text-[#746B65] hover:text-[#751F2B]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["HOME", "WORK", "OTHER"].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => updateAddressForm("label", label)}
                        className={`rounded-lg border py-2.5 text-xs font-semibold transition ${
                          addressForm.label === label
                            ? "border-[#751F2B] bg-[#751F2B]/5 text-[#751F2B]"
                            : "border-[#E5DED5] bg-white text-[#746B65] hover:border-[#B8AAA0]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 block text-xs font-semibold text-[#514740]">
                    House / street / area
                  </label>
                  <input
                    value={addressForm.addressLine}
                    onChange={(event) =>
                      updateAddressForm("addressLine", event.target.value)
                    }
                    placeholder="House number, street and area"
                    autoComplete="street-address"
                    className="mt-2 w-full rounded-xl border border-[#E5DED5] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#751F2B]"
                  />

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#514740]">
                        City
                      </label>
                      <input
                        value={addressForm.city}
                        onChange={(event) =>
                          updateAddressForm("city", event.target.value)
                        }
                        placeholder="City"
                        autoComplete="address-level2"
                        className="mt-2 w-full rounded-xl border border-[#E5DED5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#751F2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#514740]">
                        State
                      </label>
                      <input
                        value={addressForm.state}
                        onChange={(event) =>
                          updateAddressForm("state", event.target.value)
                        }
                        placeholder="State"
                        autoComplete="address-level1"
                        className="mt-2 w-full rounded-xl border border-[#E5DED5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#751F2B]"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#514740]">
                        Pincode
                      </label>
                      <input
                        value={addressForm.pincode}
                        onChange={(event) =>
                          updateAddressForm(
                            "pincode",
                            event.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        placeholder="6-digit pincode"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        className="mt-2 w-full rounded-xl border border-[#E5DED5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#751F2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#514740]">
                        Landmark (optional)
                      </label>
                      <input
                        value={addressForm.landmark}
                        onChange={(event) =>
                          updateAddressForm("landmark", event.target.value)
                        }
                        placeholder="Nearby landmark"
                        className="mt-2 w-full rounded-xl border border-[#E5DED5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#751F2B]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={useLocation}
                    className="mt-3 text-xs font-semibold text-[#751F2B] hover:underline"
                  >
                    Use my current location
                  </button>

                  {addressForm.latitude != null &&
                    addressForm.longitude != null && (
                      <p className="mt-2 text-xs text-[#28734A]">
                        Location captured successfully.
                      </p>
                    )}

                  <button
                    type="button"
                    onClick={saveAddress}
                    disabled={savingAddress}
                    className="mt-4 w-full rounded-xl bg-[#751F2B] py-3.5 text-sm font-semibold text-white transition hover:bg-[#5E1822] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingAddress ? "Saving address..." : "Save and select address"}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#E5DED5] bg-white p-4 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A817A]">
                Step 2
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#292321]">
                Payment method
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`rounded-xl border p-4 text-left transition ${
                    paymentMethod === "COD"
                      ? "border-[#751F2B] bg-[#751F2B]/[0.035]"
                      : "border-[#E5DED5] hover:border-[#B8AAA0]"
                  }`}
                >
                  <span className="text-sm font-bold text-[#292321]">
                    Cash on Delivery
                  </span>
                  <p className="mt-1 text-xs leading-5 text-[#746B65]">
                    Pay when your order arrives.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`rounded-xl border p-4 text-left transition ${
                    paymentMethod === "ONLINE"
                      ? "border-[#751F2B] bg-[#751F2B]/[0.035]"
                      : "border-[#E5DED5] hover:border-[#B8AAA0]"
                  }`}
                >
                  <span className="text-sm font-bold text-[#292321]">
                    Online payment
                  </span>
                  <p className="mt-1 text-xs leading-5 text-[#746B65]">
                    Continue to secure Cashfree payment.
                  </p>
                </button>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl bg-[#292321] p-5 text-white sm:p-6 lg:sticky lg:top-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              Order summary
            </p>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/90">
                      {item.productData?.name || "Product"}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {item.quantity} × ₹{money(item.productData?.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    ₹
                    {money(
                      Number(item.productData?.price || 0) *
                        Number(item.quantity || 0)
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="my-5 border-t border-white/15" />

            <div className="flex justify-between text-sm text-white/65">
              <span>Subtotal</span>
              <span>₹{money(subtotal)}</span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-white/65">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>

            <div className="my-5 border-t border-white/15" />

            <div className="flex items-end justify-between gap-3">
              <span className="text-sm text-white/65">Total</span>
              <span className="text-2xl font-bold">₹{money(total)}</span>
            </div>

            {!loadingProfile && !addressId && (
              <p className="mt-4 rounded-lg bg-white/10 p-3 text-xs leading-5 text-white/75">
                Add and save a delivery address to continue.
              </p>
            )}

            <button
              type="button"
              onClick={placeOrder}
              disabled={busy || !addressId || loadingProfile || savingAddress}
              className="mt-6 w-full rounded-xl bg-[#751F2B] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#5E1822] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy
                ? "Processing order..."
                : paymentMethod === "ONLINE"
                  ? "Proceed to payment →"
                  : "Place COD order →"}
            </button>

            <p className="mt-3 text-center text-[10px] leading-5 text-white/40">
              Confirm your delivery address and payment method before placing
              your order.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}