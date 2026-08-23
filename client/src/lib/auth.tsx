import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "./queryClient";
import type { BrandConfig, PlanId } from "@shared/schema";

export interface AuthedCompany {
  id: number;
  slug: string;
  name: string;
  adminEmail: string;
  brand: BrandConfig;
  plan: PlanId;
  subscriptionStatus: string;
  trialEndsAt: number | null;
  currentPeriodEnd: number | null;
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

  // See queryClient.ts — deploy_website text-replaces the token below with
  // a relative proxy path ("port/5000") that we resolve against document.baseURI
  // so it works under the sandboxed deploy path. Local dev keeps the literal
  // and falls back to same-origin.
  const PORT_TOKEN = "__PORT_5000__";
  const API_BASE = PORT_TOKEN.startsWith("__PORT_")
    ? ""
    : new URL(PORT_TOKEN, document.baseURI).toString().replace(/\/$/, "");

  async function refresh() {
    // Hard 4s cap so a hanging request can never trap RequireAuth on the
    // “Loading…” splash. AbortController would be cleaner but we don’t need
    // to cancel the underlying request — we just need `loading` to flip.
    const bailTimer = setTimeout(() => {
      console.warn("auth refresh timed out; unblocking UI");
      setLoading(false);
    }, 4000);
    try {
      const res = await fetch(API_BASE + "/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        setCompany(await res.json());
      } else {
        setCompany(null);
      }
    } catch (e) {
      console.error("auth refresh failed", e);
      setCompany(null);
    } finally {
      clearTimeout(bailTimer);
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
