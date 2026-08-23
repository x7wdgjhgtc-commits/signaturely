import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Sign-in for existing workspaces. Uses slug + password. Once the session is
// established, we hand off to /admin.
export default function Login() {
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [, navigate] = useLocation();
  const { refresh, company } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (company) navigate("/admin");
  }, [company, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest("POST", "/api/auth/login", { slug, password });
      await refresh();
      navigate("/admin");
    } catch (e: any) {
      toast({ title: "Sign in failed", description: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            Signaturely
          </Link>
          <div className="text-sm text-slate-500">
            New here?{" "}
            <Link href="/signup" className="text-teal-700 hover:underline">
              Create a workspace
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to your workspace.</p>
        <Card className="mt-8">
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <Label className="mb-1 block text-sm font-medium text-slate-700">
                  Workspace
                </Label>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>signaturely.app/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="acme"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-teal-700 hover:bg-teal-800"
              >
                {busy ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Not you? <Link href="/signup" className="underline">Create a workspace</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
