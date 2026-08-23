import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "./queryClient";
import type { BrandConfig } from "@shared/schema";

export interface AuthedCompany {
  id: number;
  slug: string;
  name: string;
  adminEmail: string;
  brand: BrandConfig;
}

interface AuthState {
  loading: boolean;
  company: AuthedCompany | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setCompany: (c: AuthedCompany | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<AuthedCompany | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch(
        ("__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__") + "/api/auth/me",
        { credentials: "include" }
      );
      if (res.ok) {
        setCompany(await res.json());
      } else {
        setCompany(null);
      }
    } catch {
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await apiRequest("POST", "/api/auth/logout");
    setCompany(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ company, loading, refresh, logout, setCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
