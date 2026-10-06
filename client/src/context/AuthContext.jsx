import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dilli_user") || "null"); } catch { return null; }
  });

  const saveSession = (data) => {
    localStorage.setItem("dilli_token", data.token);
    localStorage.setItem("dilli_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const requestOTP = (phone) => api("/auth/request-otp", {
    method: "POST", body: JSON.stringify({ phone }),
  });

  const verifyOTP = async (phone, otp) => {
    const data = await api("/auth/verify-otp", {
      method: "POST", body: JSON.stringify({ phone, otp }),
    });
    saveSession(data);
    return data;
  };

  const adminLogin = async (email, password) => {
    const data = await api("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    saveSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("dilli_token");
    localStorage.removeItem("dilli_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, requestOTP, verifyOTP, adminLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
