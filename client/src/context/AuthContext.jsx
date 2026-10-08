import { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("dilli_user") || "null"
      );
    } catch {
      return null;
    }
  });

  const saveSession = (data) => {
    localStorage.setItem("dilli_token", data.token);
    localStorage.setItem(
      "dilli_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);
  };

  // -----------------------------
  // CUSTOMER AUTH
  // -----------------------------

  const requestOTP = (phone) =>
    api("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });

  const verifyOTP = async (phone, otp) => {
    const data = await api("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        phone,
        otp,
      }),
    });

    saveSession(data);

    return data;
  };

  // -----------------------------
  // ADMIN AUTH
  // -----------------------------

  const adminLogin = async (username, password) => {
    const data = await api("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });

    // Extra frontend-side protection.
    // Backend must also enforce role === "admin".
    if (data.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    saveSession(data);

    return data;
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------

  const logout = () => {
    localStorage.removeItem("dilli_token");
    localStorage.removeItem("dilli_user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        requestOTP,
        verifyOTP,
        adminLogin,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);