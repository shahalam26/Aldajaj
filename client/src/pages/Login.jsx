import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login({ navigate }) {
  const { requestOTP, verifyOTP } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const send = async () => {
    try { setBusy(true); setMessage(""); await requestOTP(phone); setSent(true); setMessage("OTP sent. Check your development server console."); }
    catch (e) { setMessage(e.message); } finally { setBusy(false); }
  };

  const verify = async () => {
    try { setBusy(true); setMessage(""); const d = await verifyOTP(phone, otp); navigate(d.user?.role === "admin" ? "/admin" : "/profile"); }
    catch (e) { setMessage(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-5 py-16">
      <div className="w-full rounded-3xl bg-white p-7 shadow-xl">
        <p className="text-xs font-bold tracking-[.18em] text-[#c62828]">DILLI CUTS</p>
        <h1 className="mt-3 text-3xl font-black">Login with phone</h1>
        <p className="mt-2 text-sm text-black/50">No password. We'll verify your number with OTP.</p>
        <label className="mt-7 block text-sm font-bold">Phone number</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} disabled={sent}
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#c62828]" placeholder="9876543210" />
        {!sent ? (
          <button disabled={busy || phone.length < 10} onClick={send} className="mt-4 w-full rounded-2xl bg-[#c62828] py-3.5 font-bold text-white disabled:opacity-40">{busy ? "Sending..." : "Send OTP"}</button>
        ) : (
          <>
            <label className="mt-5 block text-sm font-bold">OTP</label>
            <input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-center text-xl tracking-[.5em] outline-none" placeholder="••••••" />
            <button disabled={busy || otp.length !== 6} onClick={verify} className="mt-4 w-full rounded-2xl bg-[#171717] py-3.5 font-bold text-white disabled:opacity-40">{busy ? "Verifying..." : "Verify & Continue"}</button>
            <button onClick={() => setSent(false)} className="mt-3 w-full py-2 text-sm text-black/50">Change number</button>
          </>
        )}
        {message && <p className="mt-4 rounded-xl bg-black/5 p-3 text-sm">{message}</p>}
      </div>
    </div>
  );
}
