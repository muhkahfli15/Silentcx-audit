import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = anon, obj = authed
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sx_token");
    if (!token) { setUser(false); setReady(true); return; }
    api.me().then((u) => setUser(u)).catch(() => { localStorage.removeItem("sx_token"); setUser(false); })
      .finally(() => setReady(true));
  }, []);

  const persist = (data) => {
    localStorage.setItem("sx_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const value = {
    user, ready,
    login: async (body) => persist(await api.login(body)),
    register: async (body) => persist(await api.register(body)),
    shopperRegister: async (body) => persist(await api.shopperRegister(body)),
    refresh: async () => { const u = await api.me(); setUser(u); return u; },
    logout: () => { localStorage.removeItem("sx_token"); setUser(false); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
