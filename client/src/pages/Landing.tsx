import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users, Palette, Zap, Shield, Mail } from "lucide-react";
import { PLANS, planMonthlyTotal, defaultBrandConfig } from "@shared/schema";
import type { PlanId, BrandConfig, Staff } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { SignaturePreview } from "@/components/SignaturePreview";

// Marketing / landing surface for logged-out visitors. Renders hero, feature
// grid, competitor comparison, pricing tiers, and CTAs. Signed-in users are
// bounced to /admin so returning customers always land on the app.
export default function Landing() {
  const { company, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && company) navigate("/admin");
  }, [loading, company, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <MarketingNav />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <CompetitorTable />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  );
}

// Anchors are broken under wouter's hash router (a href="#foo" replaces the
// route hash). This does the equivalent by finding the target section and
// scrolling to it manually.
function ScrollLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="text-inherit hover:text-slate-900"
      onClick={() => {
        const el = document.getElementById(to);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {children}
    </button>
  );
}

function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold text-slate-900">
          <span className="text-lg tracking-tight">Signaturely</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <ScrollLink to="features">Features</ScrollLink>
          <ScrollLink to="compare">Compare</ScrollLink>
          <ScrollLink to="pricing">Pricing</ScrollLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800">
              Start free trial
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function LogoMark_UNUSED() {
  // Removed per brand decision — wordmark only, no icon. Kept for reference.
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0f766e" />
      <path
        d="M11 12.5c0-2 1.7-3.5 4.5-3.5s4.5 1.4 4.5 3.2c0 1.6-1 2.6-3.4 3.3l-2.2.6c-2 .5-3.1 1.4-3.1 3 0 2 1.7 3.4 4.5 3.4 2.5 0 4.2-1 4.5-3"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M9 25h14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Hero() {
  // Kept intentionally flat — no gradient wash, no blurred blobs. White
  // canvas plus one hairline of teal in the accent card.
  return (
    <section className="relative bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="min-w-0">
          <Badge className="mb-4 bg-teal-50 text-teal-800 hover:bg-teal-50">
            <Sparkles className="mr-1 h-3 w-3" /> New: 8 layouts, unlimited banners
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
            Consistent email signatures for every person on your team.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-600">
            Design once, roll out to everyone. Signaturely gives your whole
            company one on-brand signature they can copy, paste and forget
            about — no IT tickets, no MailApp plug-ins, no surprise per-seat fees.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-teal-700 hover:bg-teal-800">
                Start 14-day free trial
              </Button>
            </Link>
            <TryDemoButton />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            No credit card. Cancel anytime. Australian owned.
          </p>
        </div>
        <div className="min-w-0">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

function TryDemoButton() {
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="lg"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await apiRequest("POST", "/api/auth/demo");
          await refresh();
          navigate("/admin");
        } catch (e: any) {
          toast({ title: "Demo unavailable", description: e.message });
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Loading demo…" : "Try the demo →"}
    </Button>
  );
}

// A properly-seeded example signature rendered through the *actual* template
// engine the app uses in production (SignaturePreview → renderSignatureHtml).
// That guarantees the marketing preview always matches what customers get,
// and any template improvements automatically flow through to the landing page.
const HERO_BRAND: BrandConfig = {
  ...defaultBrandConfig,
  layout: "horizontal", // logo | name+contact, banner rendered underneath
  logoUrl: "apple-logo.png",
  logoWidth: 120,
  logoAlign: "middle",
  logoHAlign: "left",
  bannerUrl: "apple-banner.png",
  bannerWidth: 520,
  bannerHref: "https://www.apple.com/iphone-15-pro/",

  primaryColor: "#000000",
  textColor: "#1d1d1f",
  mutedColor: "#6e6e73",
  dividerColor: "#d2d2d7",
  accentColor: "#0071e3",

  fontFamily: "Helvetica",
  fontSize: 13,
  nameSize: 18,
  nameBold: true,

  showPhoto: true,
  photoShape: "circle",
  photoSize: 88,
  photoAlign: "top",

  showDivider: true,
  showPhone: true,
  showMobile: false,
  showWebsite: true,
  showAddress: true,

  showSocialIcons: false,
  socialLinkedin: false,
  socialTwitter: false,
  socialInstagram: false,
  socialFacebook: false,

  companyDisplayName: "Apple Inc.",
  tagline: "Think different.",
  companyAddress: "One Apple Park Way, Cupertino, CA 95014",
  companyWebsite: "apple.com",
};

const HERO_STAFF: Staff = {
  id: 0,
  companyId: 0,
  slug: "steve-jobs",
  fullName: "Steve Jobs",
  jobTitle: "Chief Executive Officer",
  department: "",
  email: "sjobs@apple.com",
  phone: "+1 (408) 996-1010",
  mobile: "",
  website: "apple.com",
  address: "",
  photoUrl: "steve-jobs.jpg",
  pronouns: "",
  bookingUrl: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  facebook: "",
  createdAt: 0,
};

function HeroPreview() {
  // On phone viewports the whole "email" card (message body + signature)
  // scales down together so the fixed-pixel signature template fits without
  // clipping. Desktop keeps 1:1 dimensions.
  return (
    <div className="hero-email-scale relative">
      <Card className="relative overflow-hidden border-slate-200 shadow-xl">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-3 text-xs text-slate-500">
          To: board@apple.com &nbsp;·&nbsp; From: sjobs@apple.com
        </div>
        <CardContent className="space-y-4 p-6 text-sm text-slate-800">
          <div>Hi team,</div>
          <div className="text-slate-700">
            A quick note before Monday's keynote — the final build ships tonight.
            Excited to show everyone what we've been working on.
          </div>
          <div className="text-slate-500">Best,<br />Steve</div>

          {/* Real signature rendered by the production template engine.
              The template uses fixed pixel widths (as email clients require).
              On narrow viewports the preview stays at its natural desktop size
              and scrolls horizontally inside its own container so the layout
              matches what customers see in an inbox. */}
          <div className="pt-2">
            <SignaturePreview brand={HERO_BRAND} staff={HERO_STAFF} showCopy={false} />
          </div>
        </CardContent>
      </Card>
      <Card className="absolute -bottom-6 -left-4 hidden border-slate-200 shadow-lg md:block">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-teal-100 p-2 text-teal-700">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">Rolled out in one click</div>
            <div className="text-xs text-slate-500">Copy & paste — no plug-in</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Trust bar with real mail-client logos ----------

function TrustBar() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Works with every mail client your team already uses
        </div>
        <div className="mt-6 grid grid-cols-2 items-center gap-8 sm:grid-cols-4">
          <LogoTile label="Gmail" src="mail-logos/gmail.png" />
          <LogoTile label="Outlook" src="mail-logos/outlook.png" />
          <LogoTile label="Apple Mail" src="mail-logos/apple-mail.png" />
          <LogoTile label="Superhuman" src="mail-logos/superhuman.png" />
        </div>
      </div>
    </section>
  );
}

function LogoTile({ label, src }: { label: string; src: string }) {
  // Real vendor marks live in client/public/mail-logos/. Kept as PNGs of the
  // canonical brand SVGs so every browser renders them the same way.
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-10 items-center">
        <img
          src={src}
          alt={label}
          className="h-10 w-auto object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Palette,
    title: "8 professional layouts",
    body: "Horizontal, stacked, banner, card, divided, centered, photo-lead and compact. Every layout renders perfectly in Gmail, Outlook and Apple Mail.",
  },
  {
    icon: Users,
    title: "Manage your whole team",
    body: "Add every staff member manually or share a self-serve signup link. Photos, titles, phones and socials — all in one place.",
  },
  {
    icon: Zap,
    title: "Copy & paste — no plugin",
    body: "Each staff member gets their own share URL. One click to copy, one paste into any mail client. Nothing to install.",
  },
  {
    icon: Sparkles,
    title: "Match your brand",
    body: "Custom fonts, colors, icons, socials and CTAs. Upload a logo, add a banner, and every signature follows suit.",
  },
  {
    icon: Shield,
    title: "One source of truth",
    body: "Change your address, phone or logo once. Every staff member's live share URL updates instantly.",
  },
  {
    icon: Mail,
    title: "Signature-safe emails",
    body: "Table-based HTML that survives every mail client — including quirky ones like Outlook desktop and legacy Exchange.",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Everything you need to look consistent in every inbox.
        </h2>
        <p className="mt-4 text-slate-600">
          Built for growing businesses that care what their emails look like.
        </p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="border-slate-200">
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-lg bg-teal-50 p-2.5 text-teal-700">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold">{f.title}</div>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Create your workspace",
      body: "Sign up in seconds and pick your workspace name. Trial starts on day one — no card needed.",
    },
    {
      n: 2,
      title: "Design your signature",
      body: "Pick a layout, drop in your logo, set brand colors, and add contact rows. Preview updates live.",
    },
    {
      n: 3,
      title: "Roll it out to your team",
      body: "Add staff or share the invite link. Each person copies their signature into their mail client. Done.",
    },
  ];
  return (
    <section className="bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Onboard your team in minutes.
          </h2>
          <p className="mt-3 text-slate-400">
            Three steps between you and a consistent inbox for every person on payroll.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
              <div className="text-4xl font-semibold text-teal-400">{s.n}</div>
              <div className="mt-3 text-lg font-semibold">{s.title}</div>
              <p className="mt-2 text-sm text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Competitor comparison. Flat monthly for our Growth plan (A$20/mo,
// up to 50 staff) versus each vendor's cheapest published plan for a
// 10-seat team. Only vendors more expensive than our top tier are shown.
type Competitor = {
  name: string;
  logo: JSX.Element;
  monthly10: string;    // A$/mo for 10 seats on their cheapest plan
  note: string;
};

const COMPETITORS: Competitor[] = [
  {
    name: "WiseStamp",
    logo: <WiseStampLogo />,
    monthly10: "A$44",
    note: "A$19 base + A$1/user (billed monthly)",
  },
  {
    name: "Rocketseed",
    logo: <RocketseedLogo />,
    monthly10: "A$115",
    note: "A$75/mo minimum + per-user overage",
  },
];

function CompetitorTable() {
  const growthPrice = PLANS.growth.price;
  return (
    <section id="compare" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Flat pricing. No per-seat surprises.
        </h2>
        <p className="mt-3 text-slate-600">
          Below is what a 10-person team actually pays per month, based on each vendor's own
          published pricing. All figures in AUD.
        </p>
      </div>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3 pr-6 font-medium">Vendor</th>
              <th className="py-3 pr-6 font-medium">Cost for 10 staff</th>
              <th className="py-3 pr-6 font-medium">Pricing model</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 bg-teal-50/60">
              <td className="py-4 pr-6">
                <span className="font-semibold text-teal-800">Signaturely Growth</span>
              </td>
              <td className="py-4 pr-6 font-semibold text-teal-800">A${growthPrice}/mo</td>
              <td className="py-4 pr-6 text-slate-700">Flat rate · up to 50 staff</td>
            </tr>
            {COMPETITORS.map((c) => (
              <tr key={c.name} className="border-b border-slate-100 text-slate-700">
                <td className="py-4 pr-6">
                  <div className="flex items-center gap-3">
                    {c.logo}
                    <span>{c.name}</span>
                  </div>
                </td>
                <td className="py-4 pr-6 font-medium">{c.monthly10}</td>
                <td className="py-4 pr-6 text-slate-600">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Competitor prices from vendor pricing pages accessed August 2026. USD conversions to AUD
        approximate. Signaturely Growth is a flat A${growthPrice}/mo regardless of team size (up to 50 staff).
      </p>
    </section>
  );
}

// Competitor brand marks — monogram interpretations, not lifted assets.
function WiseStampLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-label="WiseStamp">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#00A3E0" />
      <path
        d="M6 10l4 12 3-8 3 8 4-12"
        stroke="white"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="11" r="2" fill="white" />
    </svg>
  );
}

function RocketseedLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-label="Rocketseed">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#FF5A1F" />
      <path
        d="M11 21c0-6 5-10 10-10-1 5-4 9-10 10z"
        fill="white"
      />
      <circle cx="18" cy="14" r="1.6" fill="#FF5A1F" />
      <path d="M8 24l3-3" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Pricing() {
  const [, navigate] = useLocation();
  const planIds: PlanId[] = ["free", "starter", "growth", "business"];
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Simple, flat pricing.</h2>
        <p className="mt-3 text-slate-600">
          One monthly price — no per-seat maths. All paid plans include a 14-day free trial. AUD, billed monthly.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {planIds.map((id) => (
          <PriceCard
            key={id}
            planId={id}
            onSelect={() => navigate(id === "free" ? "/signup" : `/signup?plan=${id}`)}
          />
        ))}
      </div>
    </section>
  );
}

export function PriceCard({
  planId,
  onSelect,
  ctaLabel,
  variant = "marketing",
}: {
  planId: PlanId;
  // Kept in the signature for backwards compatibility with in-app pricing
  // page callers written for the old per-seat model. Ignored now.
  seats?: number;
  onSelect?: () => void;
  ctaLabel?: string;
  variant?: "marketing" | "upgrade";
}) {
  const p = PLANS[planId];
  const monthly = useMemo(() => planMonthlyTotal(planId), [planId]);
  const highlight = (p as any).highlight;
  return (
    <Card
      className={`relative flex h-full flex-col ${
        highlight ? "border-teal-700 ring-2 ring-teal-700 shadow-lg" : "border-slate-200"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-700 px-3 py-1 text-xs font-medium text-white">
          Most popular
        </div>
      )}
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          {p.name}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-semibold">A${monthly}</span>
          <span className="text-sm text-slate-500">/mo</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {planId === "free"
            ? "Forever free"
            : `Flat rate · up to ${p.seatCap === 10000 ? "unlimited" : p.seatCap} staff`}
        </div>
        <ul className="mt-5 space-y-2 text-sm">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              <span className="text-slate-700">{f}</span>
            </li>
          ))}
        </ul>
        <div className="flex-1" />
        <Button
          className={`mt-6 w-full ${
            highlight ? "bg-teal-700 hover:bg-teal-800" : ""
          }`}
          variant={highlight ? "default" : "outline"}
          onClick={onSelect}
        >
          {ctaLabel ?? (planId === "free" ? "Start free" : "Start free trial")}
        </Button>
        {variant === "marketing" && planId !== "free" && (
          <p className="mt-2 text-center text-xs text-slate-400">14-day trial · no card</p>
        )}
      </CardContent>
    </Card>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-3xl bg-teal-800 p-12 text-white shadow-xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Look consistent by Friday.
          </h2>
          <p className="mt-3 text-teal-100">
            Sign up today, roll it out this week. Or take the demo for a spin — no signup needed.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-teal-800 hover:bg-slate-100">
                Start 14-day free trial
              </Button>
            </Link>
            <TryDemoButton />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <div className="font-semibold text-slate-700">
            <span>© {new Date().getFullYear()} Signaturely</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <ScrollLink to="features">Features</ScrollLink>
            <ScrollLink to="pricing">Pricing</ScrollLink>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/login" className="hover:text-slate-900">Sign in</Link>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          Signaturely is a product of <span className="font-medium text-slate-600">Elapid Group Pty Ltd</span> — an Australian company.
        </div>
      </div>
    </footer>
  );
}
