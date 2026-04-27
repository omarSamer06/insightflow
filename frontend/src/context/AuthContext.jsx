import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    if (t) {
      const payload = decodeJwtPayload(t);
      setUser(payload?.id ? { id: payload.id } : null);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async ({ email, password }) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const newToken = res?.data?.data?.token;
      const newUser = res?.data?.data?.user;
      if (!newToken) throw new Error("Missing token in response");

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(newUser || (decodeJwtPayload(newToken)?.id ? { id: decodeJwtPayload(newToken).id } : null));
      return { ok: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed";
      return { ok: false, message };
    }
  };

  const register = async ({ name, email, password }) => {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const newToken = res?.data?.data?.token;
      if (newToken) {
        const newUser = res?.data?.data?.user;
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(
          newUser || (decodeJwtPayload(newToken)?.id ? { id: decodeJwtPayload(newToken).id } : null)
        );
      }
      return { ok: true, message: res?.data?.message || "" };
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "Registration failed";
      return { ok: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

