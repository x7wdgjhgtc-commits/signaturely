import { QueryClient, QueryFunction } from "@tanstack/react-query";

// deploy_website text-replaces __PORT_5000__ with a *relative* path fragment
// ("port/5000") that the deployed static site forwards to the sandbox port.
// The fragment must be resolved relative to the current document URL, so we
// build a full absolute URL from document.baseURI to keep it stable across
// hash-routed pages. In local dev the token stays literal and we fall back
// to same-origin.
const PORT_TOKEN = "__PORT_5000__";
function resolveApiBase(): string {
  if (PORT_TOKEN.startsWith("__PORT_")) return ""; // dev: same origin
  if (typeof document !== "undefined") {
    // e.g. https://sites.pplx.app/.../signaturely/dist/public/port/5000
    return new URL(PORT_TOKEN, document.baseURI).toString().replace(/\/$/, "");
  }
  return PORT_TOKEN;
}
const API_BASE = resolveApiBase();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
