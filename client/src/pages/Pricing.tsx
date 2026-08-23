import { useState } from "react";

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PLANS } from "@shared/schema";
import type { PlanId } from "@shared/schema";
import { PriceCard } from "./Landing";

// In-app pricing / upgrade page. Signed-in users hit this from the "Upgrade"
// buttons in Admin. Clicking a paid plan hits /api/billing/checkout which
// returns a Stripe hosted-checkout URL to redirect to.
export default function Pricing() {
  const { company, refresh } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [busy, setBusy] = useState<PlanId | null>(null);

  async function choose(plan: PlanId) {
    if (!company) {
      navigate(plan === "free" ? "/signup" : `/signup?plan=${plan}`);
      return;
    }
    if (plan === "free") {
      toast({
        title: "You're already able to use the free plan.",
        description:
          "To downgrade an existing paid subscription, use Manage billing.",
      });
      return;
    }
    setBusy(plan);
    try {
      const r = await apiRequest("POST", "/api/billing/checkout", { plan });
      const { url } = await r.json();
      if (url) window.location.href = url;
    } catch (e: any) {
      toast({ title: "Checkout unavailable", description: e.message });
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  async function openPortal() {
    setBusy("business");
    try {
      const r = await apiRequest("POST", "/api/billing/portal", {});
      const { url } = await r.json();
      if (url) window.location.href = url;
    } catch (e: any) {
      toast({ title: "Billing portal unavailable", description: e.message });
    } finally {
      setBusy(null);
    }
  }

  const planIds: PlanId[] = ["free", "starter", "growth", "business"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href={company ? "/admin" : "/"} className="text-lg font-semibold tracking-tight text-slate-900">
            Signaturely
          </Link>
          <div className="text-sm">
            {company ? (
              <Link href="/admin" className="text-teal-700 hover:underline">
                ← Back to admin
              </Link>
            ) : (
              <Link href="/login" className="text-teal-700 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {company ? `Upgrade ${company.name}` : "Simple pricing."}
          </h1>
          <p className="mt-3 text-slate-600">
            All plans include a 14-day free trial. Prices in AUD, billed monthly.
          </p>
          {company && (
            <div className="mt-4 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                Current plan: <b className="text-slate-900">{PLANS[company.plan]?.name ?? "Free"}</b>
                {company.subscriptionStatus !== "none" && (
                  <span className="ml-2 text-xs uppercase tracking-widest text-slate-500">
                    {company.subscriptionStatus}
                  </span>
                )}
              </span>
              {company.plan !== "free" && (
                <Button
                  variant="link"
                  size="sm"
                  className="ml-3 text-teal-700"
                  onClick={openPortal}
                >
                  Manage billing →
                </Button>
              )}
            </div>
          )}
          <p className="mt-6 text-sm text-slate-500">
            Flat monthly rates. No per-seat maths.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {planIds.map((id) => (
            <PriceCard
              key={id}
              planId={id}
              variant="upgrade"
              ctaLabel={
                busy === id
                  ? "Loading…"
                  : company?.plan === id
                  ? "Current plan"
                  : id === "free"
                  ? "Free forever"
                  : "Choose plan"
              }
              onSelect={() => choose(id)}
            />
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          Payments processed securely by Stripe. Prices in AUD, ex-GST if applicable.
        </p>
      </div>
    </div>
  );
}
