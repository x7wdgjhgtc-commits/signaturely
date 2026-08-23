import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Users, Copy, Palette } from "lucide-react";

export default function Landing() {
  const { setCompany, company } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [signupData, setSignupData] = useState({
    companyName: "",
    slug: "",
    adminEmail: "",
    password: "",
  });
  const [loginData, setLoginData] = useState({ slug: "", password: "" });

  const signup = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/auth/signup", signupData);
      return r.json();
    },
    onSuccess: (c) => {
      setCompany(c);
      navigate("/admin");
      toast({ title: "Workspace created", description: `Welcome, ${c.name}` });
    },
    onError: (e: Error) =>
      toast({ title: "Sign up failed", description: e.message, variant: "destructive" }),
  });

  const login = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/auth/login", loginData);
      return r.json();
    },
    onSuccess: (c) => {
      setCompany(c);
      navigate("/admin");
      toast({ title: "Signed in", description: `Welcome back, ${c.name}` });
    },
    onError: (e: Error) =>
      toast({ title: "Sign in failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl">Signaturely</span>
          </div>
          {company ? (
            <Button
              onClick={() => navigate("/admin")}
              data-testid="button-open-admin"
              size="sm"
            >
              Open admin
            </Button>
          ) : null}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
            <Sparkles className="w-3 h-3" /> Consistent signatures for your whole team
          </div>
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight text-foreground mb-6">
            One signature template.
            <br />
            <span className="text-primary italic">Every inbox on brand.</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg">
            Design your company signature once. Add your staff. Each person gets a
            personal copy-and-paste link — no IT tickets, no design drift.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Feature icon={<Palette className="w-4 h-4" />} text="Brand-locked template" />
            <Feature icon={<Users className="w-4 h-4" />} text="Unlimited staff" />
            <Feature icon={<Copy className="w-4 h-4" />} text="One-click copy" />
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
          <Tabs defaultValue="signup">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="signup" data-testid="tab-signup">
                Create workspace
              </TabsTrigger>
              <TabsTrigger value="login" data-testid="tab-login">
                Sign in
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="space-y-3">
              <div>
                <Label htmlFor="company">Company name</Label>
                <Input
                  id="company"
                  data-testid="input-company-name"
                  placeholder="Acme Pty Ltd"
                  value={signupData.companyName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setSignupData((d) => ({
                      ...d,
                      companyName: name,
                      slug:
                        d.slug ||
                        name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-+|-+$/g, "")
                          .slice(0, 40),
                    }));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="slug">Workspace URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">workspace/</span>
                  <Input
                    id="slug"
                    data-testid="input-slug"
                    placeholder="acme"
                    value={signupData.slug}
                    onChange={(e) =>
                      setSignupData((d) => ({
                        ...d,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Admin email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-admin-email"
                  placeholder="you@acme.com"
                  value={signupData.adminEmail}
                  onChange={(e) =>
                    setSignupData((d) => ({ ...d, adminEmail: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  placeholder="At least 6 characters"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData((d) => ({ ...d, password: e.target.value }))
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={() => signup.mutate()}
                disabled={signup.isPending}
                data-testid="button-submit-signup"
              >
                {signup.isPending ? "Creating…" : "Create workspace"}
              </Button>
            </TabsContent>

            <TabsContent value="login" className="space-y-3">
              <div>
                <Label htmlFor="login-slug">Workspace</Label>
                <Input
                  id="login-slug"
                  data-testid="input-login-slug"
                  placeholder="acme"
                  value={loginData.slug}
                  onChange={(e) =>
                    setLoginData((d) => ({ ...d, slug: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  data-testid="input-login-password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData((d) => ({ ...d, password: e.target.value }))
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={() => login.mutate()}
                disabled={login.isPending}
                data-testid="button-submit-login"
              >
                {login.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif text-3xl mb-10 text-foreground">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Design the template",
                body:
                  "Set your logo, colors, layout, disclaimer. This is your brand's signature — locked in and consistent for everyone.",
              },
              {
                n: "02",
                title: "Add your staff",
                body:
                  "Name, title, phone, email, photo. Each person gets a unique share link — no logins needed for them.",
              },
              {
                n: "03",
                title: "Copy and paste",
                body:
                  "Staff open their link, tap Copy, paste into Outlook, Gmail or Apple Mail. Done — pixel perfect.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-card border border-card-border rounded-xl p-6">
                <div className="text-xs font-mono text-primary mb-3">{s.n}</div>
                <h3 className="font-serif text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built for teams that care how their email looks.
      </footer>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      {text}
    </div>
  );
}

function Logo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Signaturely logo"
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 22 L14 10 L18 18 L24 12"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
