import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin({ navigate }) {
  const { adminLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      setMessage("Username and password are required.");
      return;
    }

    try {
      setBusy(true);
      setMessage("");

      const data = await adminLogin(username, password);

      if (data.user?.role !== "admin") {
        setMessage("Admin access required.");
        return;
      }

      navigate("/admin");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111] px-5 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c62828] text-2xl font-black text-white">
            DC
          </div>

          <p className="mt-5 text-xs font-bold tracking-[0.25em] text-[#c62828]">
            DILLI CUTS
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Admin Panel
          </h1>

          <p className="mt-2 text-sm text-black/50">
            Authorized administrators only
          </p>
        </div>

        <form onSubmit={submit}>
          <label className="block text-sm font-bold">
            Username
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="Enter admin username"
            className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-[#c62828]"
          />

          <label className="mt-5 block text-sm font-bold">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Enter admin password"
            className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-[#c62828]"
          />

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-2xl bg-[#c62828] py-3.5 font-bold text-white transition hover:bg-[#a91f1f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Login to Admin Panel"}
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            {message}
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-5 w-full text-sm text-black/45 hover:text-black"
        >
          ← Back to Dilli Cuts
        </button>
      </div>
    </div>
  );
}