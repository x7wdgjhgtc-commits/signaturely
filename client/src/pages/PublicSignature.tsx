import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BrandConfig, Staff } from "@shared/schema";
import { SignaturePreview } from "@/components/SignaturePreview";
import { Card } from "@/components/ui/card";

interface PublicResponse {
  brand: BrandConfig;
  staff: Staff;
  company: { name: string; slug: string };
  plan?: string;
}

export default function PublicSignature() {
  const [, params] = useRoute("/s/:companySlug/:staffSlug");
  const q = useQuery<PublicResponse>({
    queryKey: [`/api/public/${params?.companySlug}/${params?.staffSlug}`],
    enabled: !!params,
  });

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <h1 className="font-serif text-2xl mb-2">Signature not found</h1>
          <p className="text-sm text-muted-foreground">
            The link may be incorrect, or this staff member has been removed.
          </p>
        </Card>
      </div>
    );
  }

  const { brand, staff, company, plan } = q.data;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <BrandedHeader company={company} brand={brand} />

      <main className="max-w-3xl w-full mx-auto px-6 py-10 space-y-8 flex-1">
        <div>
          <h1 className="font-serif text-3xl mb-2">
            Hey {staff.fullName.split(" ")[0]} — here's your signature
          </h1>
          <p className="text-muted-foreground">
            Click <strong>Copy signature</strong> below, then paste it into your email
            client's signature settings.
          </p>
        </div>

        <SignaturePreview brand={brand} staff={staff} plan={plan} />

        <div className="grid md:grid-cols-3 gap-4">
          <SetupCard
            logo="/mail-logos/outlook.png"
            title="Outlook"
            steps={[
              "File → Options → Mail → Signatures",
              "New, name it, then paste in the editor",
              "Set as default for new emails and replies",
            ]}
          />
          <SetupCard
            logo="/mail-logos/gmail.png"
            title="Gmail"
            steps={[
              "Settings (gear) → See all settings",
              "General tab → Signature → Create new",
              "Paste, save changes at the bottom",
            ]}
          />
          <SetupCard
            logo="/mail-logos/apple-mail.png"
            title="Apple Mail"
            steps={[
              "Mail → Settings → Signatures",
              "Select account, click +, paste in signature",
              "Choose it under the account's default signature",
            ]}
          />
        </div>

        <div className="text-xs text-muted-foreground text-center border-t border-border pt-6">
          Details wrong? Ask your admin at {company.name} to update your profile.
        </div>
      </main>
      <PoweredBy />
    </div>
  );
}

// Business-first header — uses the company's logo + primary brand color so the
// recipient feels like this page came from their employer. Signaturely gets a
// small, non-intrusive attribution in the footer instead.
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
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
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
          <div
            className="font-serif text-lg leading-tight truncate"
            style={{ color: primary }}
          >
            {company.name}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Email signature
          </div>
        </div>
      </div>
    </header>
  );
}

function PoweredBy() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
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

function SetupCard({ logo, title, steps }: { logo?: string; title: string; steps: string[] }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {logo && (
          <img
            src={logo}
            alt={`${title} logo`}
            className="w-6 h-6 object-contain"
            loading="lazy"
          />
        )}
        <div className="font-semibold">{title}</div>
      </div>
      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
