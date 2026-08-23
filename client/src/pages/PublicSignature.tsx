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
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2">
          <Logo />
          <span className="font-serif text-lg">Signaturely</span>
          <span className="text-xs text-muted-foreground ml-2">
            for {company.name}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
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
            title="Outlook"
            steps={[
              "File → Options → Mail → Signatures",
              "New, name it, then paste in the editor",
              "Set as default for new emails and replies",
            ]}
          />
          <SetupCard
            title="Gmail"
            steps={[
              "Settings (gear) → See all settings",
              "General tab → Signature → Create new",
              "Paste, save changes at the bottom",
            ]}
          />
          <SetupCard
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
    </div>
  );
}

function SetupCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="font-semibold mb-2">{title}</div>
      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
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
