import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { PLANS } from "@shared/schema";
import type { PlanId } from "@shared/schema";

// Workspace signup — creates a workspace, hashes password server-side,
// starts a 14-day trial, then hands the user to /admin or Stripe checkout.
export default function Signup() {
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [, navigate] = useLocation();
  const { refresh, company } = useAuth();
  const { toast } = useToast();

  // Read ?plan=xxx off the hash querystring so we can send them to checkout
  // after signup if they clicked a paid plan.
  const desiredPlan = useMemo<PlanId | null>(() => {
    if (typeof window === "undefined") return null;
    const hashQuery = window.location.hash.split("?")[1] || "";
    const plan = new URLSearchParams(hashQuery).get("plan");
    return plan && plan in PLANS ? (plan as PlanId) : null;
  }, []);

  useEffect(() => {
    if (company) navigate("/admin");
  }, [company, navigate]);

  // Auto-derive slug from company name on first change so the field feels alive.
  function autoSlugFromName(v: string) {
    setCompanyName(v);
    if (!slug || slug === toSlug(companyName)) {
      setSlug(toSlug(v));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest("POST", "/api/auth/signup", {
        companyName,
        slug,
        adminEmail,
        password,
      });
      await refresh();

      // If they wanted a paid plan, take them straight to Stripe checkout.
      if (desiredPlan && desiredPlan !== "free") {
        try {
          const r = await apiRequest("POST", "/api/billing/checkout", {
            plan: desiredPlan,
          });
          const { url } = await r.json();
          if (url) {
            window.location.href = url;
            return;
          }
        } catch {
          // Fall through to /admin — user can upgrade from inside the app.
          toast({
            title: "Account created",
            description: "Checkout isn't wired up yet — you can subscribe from Settings.",
          });
        }
      }
      navigate("/admin");
    } catch (e: any) {
      toast({ title: "Couldn't sign up", description: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Create your workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          14 days free · no credit card · cancel anytime.
        </p>
        <Card className="mt-8">
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={submit}>
              <Field label="Company name">
                <Input
                  value={companyName}
                  onChange={(e) => autoSlugFromName(e.target.value)}
                  placeholder="Acme Pty Ltd"
                  required
                />
              </Field>
              <Field
                label="Workspace URL"
                hint="Used for your team's shareable signature links."
              >
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>signaturely.app/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(toSlug(e.target.value))}
                    placeholder="acme"
                    required
                  />
                </div>
              </Field>
              <Field label="Admin email">
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="you@acme.com"
                  required
                />
              </Field>
              <Field label="Password" hint="Minimum 6 characters.">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </Field>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-teal-700 hover:bg-teal-800"
              >
                {busy ? "Creating…" : desiredPlan && desiredPlan !== "free"
                  ? `Create workspace & subscribe to ${PLANS[desiredPlan].name}`
                  : "Create workspace"}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Already have one? <Link href="/login" className="underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1 block text-sm font-medium text-slate-700">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function TopBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Signaturely
        </Link>
        <div className="text-sm text-slate-500">
          Have an account?{" "}
          <Link href="/login" className="text-teal-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

function toSlug(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

