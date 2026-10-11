
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function getSafeDestination(returnTo, hasCartItems) {
  // An explicit protected-route destination takes priority.
  if (
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
  ) {
    const path = returnTo.split(/[?#]/)[0];

    if (
      path !== "/admin" &&
      !path.startsWith("/admin/") &&
      path !== "/admin-login"
    ) {
      return returnTo;
    }
  }

  // Direct login: resume shopping when the cart has items.
  return hasCartItems ? "/checkout" : "/profile";
}

export default function Login({ navigate, returnTo = null }) {
  const { requestOTP, verifyOTP } = useAuth();
  const { items } = useCart();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const send = async () => {
    try {
      setBusy(true);
      setMessage("");

      await requestOTP(phone);

      setSent(true);
      setMessage("OTP sent. Enter the code to continue.");
    } catch (error) {
      setMessage(error.message || "Unable to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    try {
      setBusy(true);
      setMessage("");

      await verifyOTP(phone, otp);

      const destination = getSafeDestination(
        returnTo,
        items.length > 0
      );

      navigate(destination);
    } catch (error) {
      setMessage(error.message || "OTP verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex min-h-[75vh] items-center justify-center bg-[#F7F4EF] px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-3xl border border-[#E5DED5] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold tracking-[0.2em] text-[#751F2B]">
          DILLI CUTS
        </p>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#292321] sm:text-3xl">
          Welcome back
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#746B65]">
          Sign in with your phone number to continue shopping and manage your
          delivery addresses.
        </p>

        <label className="mt-7 block text-sm font-semibold text-[#292321]">
          Phone number
        </label>

        <input
          value={phone}
          onChange={(event) =>
            setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
          }
          disabled={sent || busy}
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          placeholder="10-digit mobile number"
          className="mt-2 w-full rounded-xl border border-[#E5DED5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#751F2B] focus:ring-2 focus:ring-[#751F2B]/10 disabled:bg-[#F7F4EF]"
        />

        {!sent ? (
          <button
            type="button"
            disabled={busy || phone.length !== 10}
            onClick={send}
            className="mt-4 w-full rounded-xl bg-[#751F2B] py-3.5 text-sm font-semibold text-white transition hover:bg-[#5E1822] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Sending OTP..." : "Send OTP"}
          </button>
        ) : (
          <>
            <label className="mt-5 block text-sm font-semibold text-[#292321]">
              Enter OTP
            </label>

            <input
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              className="mt-2 w-full rounded-xl border border-[#E5DED5] px-4 py-3 text-center text-xl tracking-[0.5em] outline-none transition focus:border-[#751F2B] focus:ring-2 focus:ring-[#751F2B]/10"
            />

            <button
              type="button"
              disabled={busy || otp.length !== 6}
              onClick={verify}
              className="mt-4 w-full rounded-xl bg-[#292321] py-3.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Verifying..." : "Verify & Continue"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSent(false);
                setOtp("");
                setMessage("");
              }}
              className="mt-3 w-full py-2 text-sm font-medium text-[#746B65] transition hover:text-[#292321] disabled:opacity-50"
            >
              Change phone number
            </button>
          </>
        )}

        {message && (
          <p
            role="status"
            className="mt-4 rounded-xl bg-[#F7F4EF] p-3 text-sm leading-5 text-[#514740]"
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-[#8A817A]">
          Secure sign-in for your orders and saved addresses.
        </p>
      </div>
    </section>
  );
}
