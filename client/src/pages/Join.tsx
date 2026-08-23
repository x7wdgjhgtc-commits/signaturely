import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { BrandConfig, Staff } from "@shared/schema";
import { SignaturePreview } from "@/components/SignaturePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

// ---------- Public self-serve join flow ----------
// A recipient opens /#/join/:token, sees the company brand, fills their own
// profile, and after submit gets the same share link an admin would get for
// them. No login required on this page — the invite token is the credential.

interface JoinContext {
  company: { name: string; slug: string };
  brand: BrandConfig;
  invite: { label: string; expiresAt: number | null };
}

interface EmptyForm {
  fullName: string;
  jobTitle: string;
  department: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  address: string;
  photoUrl: string;
  pronouns: string;
  bookingUrl: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  facebook: string;
}

const emptyForm: EmptyForm = {
  fullName: "",
  jobTitle: "",
  department: "",
  email: "",
  phone: "",
  mobile: "",
  website: "",
  address: "",
  photoUrl: "",
  pronouns: "",
  bookingUrl: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  facebook: "",
};

export default function Join() {
  const [, params] = useRoute("/join/:token");
  const token = params?.token ?? "";

  const ctxQuery = useQuery<JoinContext>({
    queryKey: [`/api/public/invite/${token}`],
    enabled: !!token,
    retry: false,
  });

  const [form, setForm] = useState<EmptyForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ staff: Staff; shareUrl: string } | null>(
    null,
  );
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const brand = ctxQuery.data?.brand;

  async function submit() {
    if (!form.fullName.trim()) {
      toast({
        title: "Please add your full name",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const r = await apiRequest("POST", `/api/public/invite/${token}`, form);
      const data: { staff: Staff; company: { slug: string; name: string } } =
        await r.json();
      const shareUrl = `${window.location.origin}${window.location.pathname}#/s/${data.company.slug}/${data.staff.slug}`;
      setDone({ staff: data.staff, shareUrl });
    } catch (e: any) {
      toast({
        title: "Couldn’t submit",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyShareUrl() {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(done.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no-op */
    }
  }

  // Sensible defaults for the live preview when the form is still empty.
  const previewStaff: Staff = {
    id: 0,
    companyId: 0,
    slug: "preview",
    createdAt: 0,
    fullName: form.fullName || "Your name",
    jobTitle: form.jobTitle || "Your role",
    department: form.department,
    email: form.email || "you@example.com",
    phone: form.phone,
    mobile: form.mobile,
    website: form.website,
    address: form.address,
    photoUrl: form.photoUrl,
    pronouns: form.pronouns,
    bookingUrl: form.bookingUrl,
    linkedin: form.linkedin,
    twitter: form.twitter,
    instagram: form.instagram,
    facebook: form.facebook,
  };

  // Loading + error gates.
  if (!token) return <NotFoundState />;
  if (ctxQuery.isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading invite…</div>
      </div>
    );
  }
  if (ctxQuery.isError || !ctxQuery.data) {
    const msg =
      (ctxQuery.error as any)?.message?.split(": ").slice(1).join(": ") ||
      "This invite is no longer valid.";
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center space-y-2">
          <h1 className="font-serif text-2xl">Invite unavailable</h1>
          <p className="text-sm text-muted-foreground">{msg}</p>
          <p className="text-xs text-muted-foreground">
            Ask the person who sent this link to generate a fresh one.
          </p>
        </Card>
      </div>
    );
  }

  const ctx = ctxQuery.data;

  // Success state — recipient has submitted and now has their own share link.
  if (done) {
    return (
      <div className="min-h-screen bg-muted/30">
        <BrandedHeader company={ctx.company} brand={ctx.brand} />
        <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
          <div>
            <h1 className="font-serif text-3xl mb-2">
              You’re on the team, {done.staff.fullName.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground">
              Your signature is ready. Bookmark the link below — you can revisit
              it anytime to grab your signature or send it to a new device.
            </p>
          </div>

          <Card className="p-4 space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Your signature link
            </Label>
            <div className="flex items-center gap-2">
              <Input value={done.shareUrl} readOnly className="font-mono text-xs" />
              <Button
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={copyShareUrl}
                className="gap-1 shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </Card>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Preview
            </div>
            <SignaturePreview brand={ctx.brand} staff={done.staff} />
          </div>

          <div className="text-center">
            <a
              href={done.shareUrl}
              className="text-sm underline text-primary"
            >
              Open my signature page →
            </a>
          </div>
        </main>
        <PoweredBy />
      </div>
    );
  }

  // Form state.
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <BrandedHeader company={ctx.company} brand={ctx.brand} />
      <BrandedHero company={ctx.company} brand={ctx.brand} />
      <main className="max-w-5xl w-full mx-auto px-6 py-8 flex-1">

        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 items-start">
          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              <SectionHeading>Basics</SectionHeading>
              <Row>
                <Field label="Full name" required>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Jane Doe"
                    data-testid="join-fullName"
                  />
                </Field>
                <Field label="Pronouns">
                  <Input
                    value={form.pronouns}
                    onChange={(e) => setForm({ ...form, pronouns: e.target.value })}
                    placeholder="she/her"
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Job title">
                  <Input
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    placeholder="Managing Director"
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Operations"
                  />
                </Field>
              </Row>
              <Field label="Photo">
                <ImageUploader
                  value={form.photoUrl}
                  onChange={(v) => setForm({ ...form, photoUrl: v })}
                  placeholder="Upload a headshot (optional)"
                  aspect={1}
                />
              </Field>
            </Card>

            <Card className="p-5 space-y-3">
              <SectionHeading>How people reach you</SectionHeading>
              <Row>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                  />
                </Field>
                <Field label="Direct phone">
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+61 7 5000 0000"
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Mobile">
                  <Input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="+61 400 000 000"
                  />
                </Field>
                <Field label="Personal website">
                  <Input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="example.com"
                  />
                </Field>
              </Row>
              <Field label="Address (overrides company address)">
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Brisbane, QLD"
                />
              </Field>
              <Field label="Booking / calendar URL">
                <Input
                  value={form.bookingUrl}
                  onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })}
                  placeholder="cal.com/you"
                />
              </Field>
            </Card>

            <Card className="p-5 space-y-3">
              <SectionHeading>Social</SectionHeading>
              <Row>
                <Field label="LinkedIn">
                  <Input
                    value={form.linkedin}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/…"
                  />
                </Field>
                <Field label="X / Twitter">
                  <Input
                    value={form.twitter}
                    onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Instagram">
                  <Input
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  />
                </Field>
                <Field label="Facebook">
                  <Input
                    value={form.facebook}
                    onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  />
                </Field>
              </Row>
            </Card>

            <div className="flex items-center justify-end gap-3 sticky bottom-4">
              <Button
                onClick={submit}
                disabled={submitting}
                data-testid="button-submit-join"
              >
                {submitting ? "Submitting…" : "Create my signature"}
              </Button>
            </div>
          </div>

          {/* Sticky live preview */}
          <div className="lg:sticky lg:top-6 min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Live preview
            </div>
            {brand ? (
              <SignaturePreview
                brand={brand}
                staff={previewStaff}
                showCopy={false}
              />
            ) : null}
          </div>
        </div>
      </main>
      <PoweredBy />
    </div>
  );
}

// A branded header that leads with the *business* — their logo (if uploaded)
// and name in their primary brand color. Signaturely stays out of the way here
// (the small "Powered by" mark appears once in the footer), so the recipient
// feels like the invite came from their employer, not from us.
function BrandedHeader({
  company,
  brand,
}: {
  company: { name: string; slug: string };
  brand: BrandConfig;
}) {
  const initials = company.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const primary = brand.primaryColor || "#0f766e";
  return (
    <header
      className="border-b border-border bg-card"
      style={{ borderTopColor: primary, borderTopWidth: 3, borderTopStyle: "solid" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={company.name}
            className="h-9 w-auto max-w-[180px] object-contain"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center font-semibold text-sm text-white"
            style={{ backgroundColor: primary }}
          >
            {initials || "·"}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-serif text-lg leading-tight truncate" style={{ color: primary }}>
            {company.name}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Team email signature
          </div>
        </div>
      </div>
    </header>
  );
}

// Hero band styled with the company's brand colour, framing the form as an
// action *from* the business.
function BrandedHero({
  company,
  brand,
}: {
  company: { name: string; slug: string };
  brand: BrandConfig;
}) {
  const primary = brand.primaryColor || "#0f766e";
  return (
    <section
      className="border-b border-border"
      style={{ backgroundColor: `${primary}10` }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-xs uppercase tracking-wider" style={{ color: primary }}>
          Welcome to {company.name}
        </div>
        <h1 className="font-serif text-3xl mt-2 mb-2">
          Set up your email signature
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Your team’s brand and layout are already configured — just add your
          personal details and you’ll get a copy-and-paste signature link at
          the end.
        </p>
      </div>
    </section>
  );
}

// Small, non-intrusive attribution — required so we get credit while keeping
// the page feeling like the business’s own.
function PoweredBy() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>Powered by</span>
        <a
          href="/#/"
          className="font-serif text-sm text-foreground hover:underline"
        >
          Signaturely
        </a>
      </div>
    </footer>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="p-8 max-w-md text-center">
        <h1 className="font-serif text-2xl mb-2">Invite unavailable</h1>
        <p className="text-sm text-muted-foreground">
          The invite link is missing or malformed.
        </p>
      </Card>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5 flex-1 min-w-0">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col md:flex-row gap-3">{children}</div>;
}
