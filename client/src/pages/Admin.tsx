import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { BrandConfig, Staff, InsertStaff } from "@shared/schema";
import { defaultBrandConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { SignaturePreview } from "@/components/SignaturePreview";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Link2,
  Copy,
  Palette,
  Users,
  Eye,
} from "lucide-react";

const emptyStaff: InsertStaff = {
  slug: "",
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

export default function Admin() {
  const { company, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!company) navigate("/");
  }, [company, navigate]);

  if (!company) return null;

  const [tab, setTab] = useState<"staff" | "brand">("staff");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const staffQuery = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const brandQuery = useQuery<BrandConfig>({ queryKey: ["/api/brand"] });

  const brand = brandQuery.data ?? defaultBrandConfig;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="text-sm font-semibold">{company.name}</div>
              <div className="text-xs text-muted-foreground font-mono">
                /{company.slug}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate("/");
            }}
            data-testid="button-logout"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "staff" | "brand")}>
          <TabsList className="mb-6">
            <TabsTrigger value="staff" data-testid="tab-staff" className="gap-2">
              <Users className="w-4 h-4" /> Staff
            </TabsTrigger>
            <TabsTrigger value="brand" data-testid="tab-brand" className="gap-2">
              <Palette className="w-4 h-4" /> Brand & template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl">Staff</h1>
                <p className="text-sm text-muted-foreground">
                  Each member gets a unique share link they can open to copy their signature.
                </p>
              </div>
              <Button onClick={() => setNewOpen(true)} data-testid="button-new-staff" className="gap-2">
                <Plus className="w-4 h-4" /> Add staff
              </Button>
            </div>

            {staffQuery.isLoading ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-lg bg-muted/50 animate-pulse border border-border"
                  />
                ))}
              </div>
            ) : (staffQuery.data ?? []).length === 0 ? (
              <EmptyState onAdd={() => setNewOpen(true)} />
            ) : (
              <div className="grid gap-3">
                {staffQuery.data!.map((s) => (
                  <StaffRow
                    key={s.id}
                    staff={s}
                    companySlug={company.slug}
                    onEdit={() => setEditingStaff(s)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="brand">
            <BrandEditor
              brand={brand}
              onChange={(b) => queryClient.setQueryData(["/api/brand"], b)}
              exampleStaff={
                staffQuery.data?.[0] ?? {
                  id: 0,
                  companyId: 0,
                  slug: "sample",
                  fullName: "Jane Doe",
                  jobTitle: "Managing Director",
                  department: "",
                  email: "jane@example.com",
                  phone: "+61 7 5000 0000",
                  mobile: "+61 400 000 000",
                  website: "example.com",
                  address: "Brisbane, QLD",
                  photoUrl: "",
                  pronouns: "",
                  bookingUrl: "",
                  linkedin: "",
                  twitter: "",
                  instagram: "",
                  facebook: "",
                  createdAt: 0,
                }
              }
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* New staff dialog */}
      <StaffDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        title="Add staff member"
        initial={emptyStaff}
        brand={brand}
        onSubmit={async (data) => {
          await apiRequest("POST", "/api/staff", data);
          queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
          setNewOpen(false);
          toast({ title: "Staff added" });
        }}
      />

      {/* Edit staff dialog */}
      <StaffDialog
        open={!!editingStaff}
        onOpenChange={(v) => !v && setEditingStaff(null)}
        title="Edit staff member"
        initial={editingStaff ?? emptyStaff}
        brand={brand}
        showDelete
        onDelete={async () => {
          if (!editingStaff) return;
          await apiRequest("DELETE", `/api/staff/${editingStaff.id}`);
          queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
          setEditingStaff(null);
          toast({ title: "Staff removed" });
        }}
        onSubmit={async (data) => {
          if (!editingStaff) return;
          await apiRequest("PUT", `/api/staff/${editingStaff.id}`, data);
          queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
          setEditingStaff(null);
          toast({ title: "Staff updated" });
        }}
      />
    </div>
  );
}

// ---------- Staff row ----------

function StaffRow({
  staff,
  companySlug,
  onEdit,
}: {
  staff: Staff;
  companySlug: string;
  onEdit: () => void;
}) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}${window.location.pathname}#/s/${companySlug}/${staff.slug}`;

  return (
    <div
      className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-4 hover:border-primary/40 transition-colors"
      data-testid={`row-staff-${staff.id}`}
    >
      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
        {staff.photoUrl ? (
          <img
            src={staff.photoUrl}
            alt={staff.fullName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          staff.fullName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate" data-testid={`text-name-${staff.id}`}>
          {staff.fullName}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {staff.jobTitle}
          {staff.email ? ` · ${staff.email}` : ""}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => {
          navigator.clipboard.writeText(shareUrl);
          toast({ title: "Share link copied", description: shareUrl });
        }}
        data-testid={`button-copy-link-${staff.id}`}
      >
        <Link2 className="w-4 h-4" />
        <span className="hidden sm:inline">Copy link</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          window.open(`#/s/${companySlug}/${staff.slug}`, "_blank")
        }
        data-testid={`button-view-${staff.id}`}
      >
        <Eye className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        data-testid={`button-edit-${staff.id}`}
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-12 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Users className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-xl mb-1">No staff yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add your first team member to generate their signature.
      </p>
      <Button onClick={onAdd} data-testid="button-empty-add" className="gap-2">
        <Plus className="w-4 h-4" /> Add first staff member
      </Button>
    </div>
  );
}

// ---------- Staff dialog ----------

function StaffDialog({
  open,
  onOpenChange,
  title,
  initial,
  brand,
  onSubmit,
  onDelete,
  showDelete = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial: InsertStaff | Staff;
  brand: BrandConfig;
  onSubmit: (data: InsertStaff) => Promise<void>;
  onDelete?: () => Promise<void>;
  showDelete?: boolean;
}) {
  const [form, setForm] = useState<InsertStaff>(emptyStaff);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const src: any = initial;
      setForm({
        slug: src.slug ?? "",
        fullName: src.fullName ?? "",
        jobTitle: src.jobTitle ?? "",
        department: src.department ?? "",
        email: src.email ?? "",
        phone: src.phone ?? "",
        mobile: src.mobile ?? "",
        website: src.website ?? "",
        address: src.address ?? "",
        photoUrl: src.photoUrl ?? "",
        pronouns: src.pronouns ?? "",
        bookingUrl: src.bookingUrl ?? "",
        linkedin: src.linkedin ?? "",
        twitter: src.twitter ?? "",
        instagram: src.instagram ?? "",
        facebook: src.facebook ?? "",
      });
    }
  }, [open, initial]);

  const previewStaff: Staff = {
    id: 0,
    companyId: 0,
    createdAt: 0,
    ...(form as any),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <FieldRow>
              <Field label="Full name">
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  data-testid="input-fullName"
                />
              </Field>
              <Field label="Pronouns">
                <Input
                  value={form.pronouns}
                  onChange={(e) => setForm({ ...form, pronouns: e.target.value })}
                  data-testid="input-pronouns"
                  placeholder="she/her"
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Job title">
                <Input
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  data-testid="input-jobTitle"
                />
              </Field>
              <Field label="Department">
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  data-testid="input-department"
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="input-email"
                />
              </Field>
              <Field label="Direct phone">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Mobile">
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  data-testid="input-mobile"
                />
              </Field>
              <Field label="Personal website">
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  data-testid="input-website"
                  placeholder="example.com"
                />
              </Field>
            </FieldRow>
            <Field label="Photo URL">
              <Input
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://…/headshot.jpg"
                data-testid="input-photoUrl"
              />
            </Field>
            <Field label="Address (overrides company address)">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                data-testid="input-address"
              />
            </Field>
            <Field label="Booking / calendar URL">
              <Input
                value={form.bookingUrl}
                onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })}
                placeholder="cal.com/jane"
                data-testid="input-bookingUrl"
              />
            </Field>

            <div className="pt-2 text-xs uppercase tracking-wider text-muted-foreground">
              Social
            </div>
            <FieldRow>
              <Field label="LinkedIn">
                <Input
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  data-testid="input-linkedin"
                  placeholder="linkedin.com/in/…"
                />
              </Field>
              <Field label="X / Twitter">
                <Input
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  data-testid="input-twitter"
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Instagram">
                <Input
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  data-testid="input-instagram"
                />
              </Field>
              <Field label="Facebook">
                <Input
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  data-testid="input-facebook"
                />
              </Field>
            </FieldRow>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Live preview
            </div>
            <SignaturePreview brand={brand} staff={previewStaff} showCopy={false} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {showDelete && onDelete && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm("Remove this staff member?")) {
                  setSaving(true);
                  try {
                    await onDelete();
                  } finally {
                    setSaving(false);
                  }
                }
              }}
              className="mr-auto gap-2"
              data-testid="button-delete-staff"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!form.fullName.trim()) {
                alert("Full name is required");
                return;
              }
              setSaving(true);
              try {
                await onSubmit(form);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            data-testid="button-save-staff"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 flex-1 min-w-0">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3">{children}</div>;
}

// ---------- Brand editor ----------

function BrandEditor({
  brand,
  onChange,
  exampleStaff,
}: {
  brand: BrandConfig;
  onChange: (b: BrandConfig) => void;
  exampleStaff: Staff;
}) {
  const [local, setLocal] = useState<BrandConfig>(brand);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => setLocal(brand), [brand]);

  function update<K extends keyof BrandConfig>(k: K, v: BrandConfig[K]) {
    const next = { ...local, [k]: v };
    setLocal(next);
    onChange(next);
  }

  async function save() {
    setSaving(true);
    try {
      const r = await apiRequest("PUT", "/api/brand", local);
      const saved = await r.json();
      queryClient.setQueryData(["/api/brand"], saved);
      toast({ title: "Brand saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6">
      {/* Editor */}
      <div className="space-y-5">
        <div>
          <h2 className="font-serif text-xl mb-1">Signature template</h2>
          <p className="text-sm text-muted-foreground">
            These settings apply to every staff signature.
          </p>
        </div>

        <Section title="Layout">
          <div className="space-y-3">
            <Field label="Layout style">
              <Select
                value={local.layout}
                onValueChange={(v) => update("layout", v as BrandConfig["layout"])}
              >
                <SelectTrigger data-testid="select-layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal (logo + info side by side)</SelectItem>
                  <SelectItem value="stacked">Stacked (logo above info)</SelectItem>
                  <SelectItem value="compact">Compact (single row)</SelectItem>
                  <SelectItem value="photo-left">Photo left</SelectItem>
                  <SelectItem value="banner">Banner promo</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <ToggleRow
              label="Show staff photo"
              value={local.showPhoto}
              onChange={(v) => update("showPhoto", v)}
              testId="switch-showPhoto"
            />
            <ToggleRow
              label="Vertical divider between logo & info"
              value={local.showDivider}
              onChange={(v) => update("showDivider", v)}
              testId="switch-showDivider"
            />
            <ToggleRow
              label="Show social icons"
              value={local.showSocialIcons}
              onChange={(v) => update("showSocialIcons", v)}
              testId="switch-showSocials"
            />
          </div>
        </Section>

        <Section title="Logo & banner">
          <Field label="Logo URL">
            <Input
              value={local.logoUrl}
              onChange={(e) => update("logoUrl", e.target.value)}
              placeholder="https://…/logo.png"
              data-testid="input-logoUrl"
            />
          </Field>
          <Field label={`Logo width: ${local.logoWidth}px`}>
            <Slider
              min={40}
              max={300}
              step={5}
              value={[local.logoWidth]}
              onValueChange={(v) => update("logoWidth", v[0])}
              data-testid="slider-logoWidth"
            />
          </Field>
          <Field label="Banner image URL (optional)">
            <Input
              value={local.bannerUrl}
              onChange={(e) => update("bannerUrl", e.target.value)}
              placeholder="https://…/banner.png"
              data-testid="input-bannerUrl"
            />
          </Field>
          <Field label="Banner link URL">
            <Input
              value={local.bannerHref}
              onChange={(e) => update("bannerHref", e.target.value)}
              placeholder="example.com/promo"
              data-testid="input-bannerHref"
            />
          </Field>
        </Section>

        <Section title="Colors">
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Primary" value={local.primaryColor} onChange={(v) => update("primaryColor", v)} />
            <ColorField label="Accent" value={local.accentColor} onChange={(v) => update("accentColor", v)} />
            <ColorField label="Text" value={local.textColor} onChange={(v) => update("textColor", v)} />
            <ColorField label="Muted" value={local.mutedColor} onChange={(v) => update("mutedColor", v)} />
            <ColorField label="Divider" value={local.dividerColor} onChange={(v) => update("dividerColor", v)} />
          </div>
        </Section>

        <Section title="Type">
          <Field label="Font family (email-safe)">
            <Select
              value={local.fontFamily}
              onValueChange={(v) => update("fontFamily", v as BrandConfig["fontFamily"])}
            >
              <SelectTrigger data-testid="select-fontFamily">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Arial", "Helvetica", "Georgia", "Verdana", "Tahoma", "Trebuchet MS"].map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={`Font size: ${local.fontSize}px`}>
            <Slider
              min={10}
              max={18}
              step={1}
              value={[local.fontSize]}
              onValueChange={(v) => update("fontSize", v[0])}
              data-testid="slider-fontSize"
            />
          </Field>
          <ToggleRow
            label="Bold name"
            value={local.nameBold}
            onChange={(v) => update("nameBold", v)}
            testId="switch-nameBold"
          />
        </Section>

        <Section title="Company details">
          <Field label="Display name">
            <Input
              value={local.companyDisplayName}
              onChange={(e) => update("companyDisplayName", e.target.value)}
              data-testid="input-companyDisplayName"
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={local.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              data-testid="input-tagline"
            />
          </Field>
          <Field label="Company address">
            <Input
              value={local.companyAddress}
              onChange={(e) => update("companyAddress", e.target.value)}
              data-testid="input-companyAddress"
            />
          </Field>
          <FieldRow>
            <Field label="Company phone">
              <Input
                value={local.companyPhone}
                onChange={(e) => update("companyPhone", e.target.value)}
                data-testid="input-companyPhone"
              />
            </Field>
            <Field label="Company website">
              <Input
                value={local.companyWebsite}
                onChange={(e) => update("companyWebsite", e.target.value)}
                data-testid="input-companyWebsite"
              />
            </Field>
          </FieldRow>
        </Section>

        <Section title="Labels">
          <FieldRow>
            <Field label="Phone">
              <Input value={local.phoneLabel} onChange={(e) => update("phoneLabel", e.target.value)} />
            </Field>
            <Field label="Mobile">
              <Input value={local.mobileLabel} onChange={(e) => update("mobileLabel", e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Email">
              <Input value={local.emailLabel} onChange={(e) => update("emailLabel", e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={local.websiteLabel} onChange={(e) => update("websiteLabel", e.target.value)} />
            </Field>
          </FieldRow>
        </Section>

        <Section title="Call to action">
          <FieldRow>
            <Field label="Button text">
              <Input
                value={local.ctaText}
                onChange={(e) => update("ctaText", e.target.value)}
                placeholder="Book a call"
                data-testid="input-ctaText"
              />
            </Field>
            <Field label="Button URL">
              <Input
                value={local.ctaUrl}
                onChange={(e) => update("ctaUrl", e.target.value)}
                placeholder="cal.com/…"
                data-testid="input-ctaUrl"
              />
            </Field>
          </FieldRow>
        </Section>

        <Section title="Disclaimer">
          <Textarea
            value={local.disclaimer}
            onChange={(e) => update("disclaimer", e.target.value)}
            rows={4}
            placeholder="This email and any attachments are confidential…"
            data-testid="textarea-disclaimer"
          />
        </Section>

        <div className="sticky bottom-4 bg-background/95 backdrop-blur border border-border rounded-lg p-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Changes are previewed live. Save to apply to all staff signatures.
          </span>
          <Button onClick={save} disabled={saving} data-testid="button-save-brand">
            {saving ? "Saving…" : "Save template"}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Preview (using {exampleStaff.fullName})
        </div>
        <SignaturePreview brand={local} staff={exampleStaff} showCopy={false} />
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          This is how every staff member's signature will look with the current template.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} data-testid={testId} />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded border border-input cursor-pointer bg-transparent"
          data-testid={`color-${label.toLowerCase()}`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
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
