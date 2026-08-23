import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { BrandConfig, Staff, InsertStaff, PlanId } from "@shared/schema";
import { defaultBrandConfig, PLANS } from "@shared/schema";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { SignaturePreview } from "@/components/SignaturePreview";
import { ImageEditModal } from "@/components/ImageEditModal";
import { ImageUploader } from "@/components/ImageUploader";
import {
  CONTACT_ICONS,
  SOCIAL_ICONS,
  socialById,
  contactIconById,
} from "@/lib/iconLibrary";
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
  Building2,
  Send,
  Check,
  X as XIcon,
  Upload,
  Download,
  FileSpreadsheet,
} from "lucide-react";

import type { StaffInvite } from "@shared/schema";

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
  const { company, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Detect the ?billing=success bounce back from Stripe Checkout so we can
  // show a confirmation toast. Cleared from the URL after we react to it.
  useEffect(() => {
    const hashQ = typeof window !== "undefined"
      ? window.location.hash.split("?")[1] || ""
      : "";
    const b = new URLSearchParams(hashQ).get("billing");
    if (b === "success") {
      toast({
        title: "You're subscribed – thank you.",
        description: "It may take a few seconds for your new plan to appear.",
      });
      window.location.hash = "#/admin";
    }
  }, [toast]);

  const [tab, setTab] = useState<"staff" | "company" | "brand">("staff");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const staffQuery = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    enabled: !!company,
  });
  const brandQuery = useQuery<BrandConfig>({
    queryKey: ["/api/brand"],
    enabled: !!company,
  });

  const brand = brandQuery.data ?? defaultBrandConfig;

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header — stacks on mobile so wordmark + workspace share row 1 and the
          action buttons wrap to row 2 without overflowing the viewport. */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 shrink-0">Signaturely</span>
            <div className="border-l border-slate-200 pl-3 sm:pl-4 min-w-0">
              <div className="text-sm font-semibold truncate">{company.name}</div>
              <div className="hidden sm:block text-xs text-muted-foreground font-mono truncate">
                /{company.slug}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="hidden sm:block">
              <PlanBadge
                plan={company.plan}
                status={company.subscriptionStatus}
                trialEndsAt={company.trialEndsAt}
              />
            </div>
            <Link href="/pricing">
              <Button
                size="sm"
                variant={company.plan === "free" ? "default" : "outline"}
                className={`${company.plan === "free" ? "bg-teal-700 hover:bg-teal-800" : ""} px-2 sm:px-3`}
              >
                {company.plan === "free" ? "Upgrade" : "Manage plan"}
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="gap-2 px-2 sm:px-3"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "staff" | "company" | "brand")}>
          {/* On phones the tab strip stretches to fill the viewport with tight
              padding so all three labels fit; on wider screens it reverts to
              a self-sized strip. */}
          <div className="mb-6">
            <TabsList className="w-full sm:w-max grid grid-cols-3 sm:inline-flex">
              <TabsTrigger
                value="staff"
                data-testid="tab-staff"
                className="gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Staff</span>
              </TabsTrigger>
              <TabsTrigger
                value="company"
                data-testid="tab-company"
                className="gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Company</span>
                <span className="hidden sm:inline">info</span>
              </TabsTrigger>
              <TabsTrigger
                value="brand"
                data-testid="tab-brand"
                className="gap-1.5 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Palette className="w-4 h-4 shrink-0" />
                <span className="truncate">Brand</span>
                <span className="hidden sm:inline">& template</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="staff" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl">Staff</h1>
                <p className="text-sm text-muted-foreground">
                  Each member gets a unique share link they can open to copy their signature.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setInvitesOpen(true)}
                  data-testid="button-invite-staff"
                  className="gap-2"
                >
                  <Send className="w-4 h-4" /> Invite link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                  data-testid="button-import-staff"
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" /> Import CSV
                </Button>
                <Button
                  onClick={() => setNewOpen(true)}
                  data-testid="button-new-staff"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Add staff
                </Button>
              </div>
            </div>

            {staffQuery.isLoading ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
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
              <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
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

          <TabsContent value="company">
            <CompanyEditor
              brand={brand}
              onChange={(b) => queryClient.setQueryData(["/api/brand"], b)}
            />
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

      {/* Invite links dialog */}
      <InvitesDialog open={invitesOpen} onOpenChange={setInvitesOpen} />

      {/* CSV import dialog */}
      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* New staff dialog */}
      <StaffDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        title="Add staff member"
        initial={emptyStaff}
        brand={brand}
        onSubmit={async (data) => {
          try {
            await apiRequest("POST", "/api/staff", data);
            queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
            setNewOpen(false);
            toast({ title: "Staff added" });
          } catch (e: any) {
            // 402 responses come back with a `code` in the JSON body so we
            // can nudge the user to upgrade rather than just showing an error.
            const msg = String(e?.message ?? "");
            if (msg.startsWith("402")) {
              toast({
                title: "You've hit your plan's staff limit.",
                description: "Upgrade to keep adding team members.",
              });
              navigate("/pricing");
              return;
            }
            toast({ title: "Couldn't add staff", description: msg });
          }
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
      className="bg-card border border-card-border rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:border-primary/40 transition-colors"
      data-testid={`row-staff-${staff.id}`}
    >
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-sm">
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
        <div className="text-xs sm:text-sm text-muted-foreground truncate">
          {staff.jobTitle}
          {staff.email ? ` · ${staff.email}` : ""}
        </div>
      </div>
      {/* Icon-only action group on mobile so all three actions fit; the
          copy button reveals its label from `sm` upward. */}
      <div className="flex items-center gap-0 sm:gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2 sm:px-3"
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            toast({ title: "Share link copied", description: shareUrl });
          }}
          data-testid={`button-copy-link-${staff.id}`}
          title="Copy share link"
        >
          <Link2 className="w-4 h-4" />
          <span className="hidden sm:inline">Copy link</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 sm:px-3"
          onClick={() =>
            window.open(`#/s/${companySlug}/${staff.slug}`, "_blank")
          }
          data-testid={`button-view-${staff.id}`}
          title="View signature"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 sm:px-3"
          onClick={onEdit}
          data-testid={`button-edit-${staff.id}`}
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
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
  const { company } = useAuth();
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
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-6">
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
            <Field label="Photo">
              <ImageUploader
                value={form.photoUrl}
                onChange={(v) => setForm({ ...form, photoUrl: v })}
                placeholder="Paste an image URL or upload a headshot"
                aspect={1}
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
            <SignaturePreview brand={brand} staff={previewStaff} showCopy={false} plan={company?.plan} />
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

// ---------- Staff invite links ----------
// Admin surface to mint / copy / revoke share-once join links. The recipient
// opens the URL and fills their own profile — no login required on their end.
function InvitesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const invitesQuery = useQuery<StaffInvite[]>({
    queryKey: ["/api/invites"],
    enabled: open,
  });
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const inviteUrl = (token: string) =>
    `${window.location.origin}${window.location.pathname}#/join/${token}`;

  async function create() {
    setCreating(true);
    try {
      const r = await apiRequest("POST", "/api/invites", { label: newLabel });
      const invite: StaffInvite = await r.json();
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      setNewLabel("");
      // Auto-copy the fresh link so it’s immediately paste-ready.
      try {
        await navigator.clipboard.writeText(inviteUrl(invite.token));
        setCopiedId(invite.id);
        toast({ title: "Invite link created", description: "Copied to clipboard." });
        window.setTimeout(() => setCopiedId(null), 1600);
      } catch {
        toast({ title: "Invite link created" });
      }
    } catch (e: any) {
      toast({ title: "Couldn’t create invite", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: number) {
    if (!confirm("Revoke this invite link?")) return;
    try {
      await apiRequest("DELETE", `/api/invites/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      toast({ title: "Invite revoked" });
    } catch (e: any) {
      toast({ title: "Couldn’t revoke", description: e.message, variant: "destructive" });
    }
  }

  async function copy(inv: StaffInvite) {
    try {
      await navigator.clipboard.writeText(inviteUrl(inv.token));
      setCopiedId(inv.id);
      toast({ title: "Copied to clipboard" });
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  const invites = invitesQuery.data ?? [];
  const active = invites.filter((i) => !i.usedAt);
  const used = invites.filter((i) => !!i.usedAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite staff to add themselves</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Create a link, share it with a team member, and they can fill in their
          own profile without needing a login. Each link works once and expires
          after 30 days.
        </p>

        <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            New invite
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Optional note — e.g. ‘Sarah, marketing’"
              data-testid="input-invite-label"
              className="flex-1"
            />
            <Button
              onClick={create}
              disabled={creating}
              data-testid="button-create-invite"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {creating ? "Creating…" : "Create link"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Active links ({active.length})
          </div>
          {invitesQuery.isLoading ? (
            <div className="h-16 rounded-lg bg-muted/50 animate-pulse border border-border" />
          ) : active.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4 text-center">
              No active invites yet.
            </div>
          ) : (
            <div className="space-y-2">
              {active.map((inv) => (
                <InviteRow
                  key={inv.id}
                  invite={inv}
                  url={inviteUrl(inv.token)}
                  copied={copiedId === inv.id}
                  onCopy={() => copy(inv)}
                  onRevoke={() => revoke(inv.id)}
                />
              ))}
            </div>
          )}
        </div>

        {used.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Used / expired
            </div>
            <div className="space-y-2">
              {used.slice(0, 6).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 text-sm border border-border rounded-lg p-3 bg-card/50"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {inv.label || "Unlabelled invite"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Used {inv.usedAt ? new Date(inv.usedAt).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(inv.id)}
                    className="gap-1 text-muted-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteRow({
  invite,
  url,
  copied,
  onCopy,
  onRevoke,
}: {
  invite: StaffInvite;
  url: string;
  copied: boolean;
  onCopy: () => void;
  onRevoke: () => void;
}) {
  const created = new Date(invite.createdAt).toLocaleDateString();
  const expires = invite.expiresAt
    ? new Date(invite.expiresAt).toLocaleDateString()
    : null;
  return (
    <div
      className="bg-card border border-card-border rounded-lg p-3 space-y-2"
      data-testid={`row-invite-${invite.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">
            {invite.label || "Unlabelled invite"}
          </div>
          <div className="text-xs text-muted-foreground">
            Created {created}
            {expires ? ` · expires ${expires}` : ""}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRevoke}
          className="gap-1 text-muted-foreground"
          data-testid={`button-revoke-invite-${invite.id}`}
        >
          <XIcon className="w-3.5 h-3.5" /> Revoke
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input value={url} readOnly className="font-mono text-xs" />
        <Button
          variant={copied ? "default" : "outline"}
          size="sm"
          onClick={onCopy}
          className="gap-1 shrink-0"
          data-testid={`button-copy-invite-${invite.id}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
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
  // Stacks on mobile so two inputs don't blow past the viewport width.
  return <div className="flex flex-col sm:flex-row gap-3">{children}</div>;
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
  const { company } = useAuth();
  const [local, setLocal] = useState<BrandConfig>(brand);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => setLocal(brand), [brand]);

  function update<K extends keyof BrandConfig>(k: K, v: BrandConfig[K]) {
    const next = { ...local, [k]: v };
    setLocal(next);
    onChange(next);
  }

  // Some editors (CTA) need to update multiple fields at once.
  const setLocalDirect = (updater: (s: BrandConfig) => BrandConfig) => {
    setLocal((s) => {
      const next = updater(s);
      return next;
    });
  };

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

  const [section, setSection] = useState<
    | "layout"
    | "colors"
    | "type"
    | "logo"
    | "contact"
    | "social"
    | "company"
    | "cta"
    | "disclaimer"
  >("layout");

  const SECTIONS = [
    ["layout", "Layout"],
    ["colors", "Colors"],
    ["type", "Typography"],
    ["logo", "Photo, logo, banner & badges"],
    ["contact", "Contact rows"],
    ["social", "Social"],
    ["company", "Company details"],
    ["cta", "Call to action"],
    ["disclaimer", "Disclaimer"],
  ] as const;

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      {/* MOBILE: preview at the top so users see their changes without
          scrolling. Hidden on desktop — desktop uses the sticky preview
          on the right. */}
      <div className="lg:hidden order-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Preview — using {exampleStaff.fullName}
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm overflow-x-auto">
          <SignaturePreview
            brand={local}
            staff={exampleStaff}
            showCopy={false}
            plan={company?.plan}
            onResizeLogo={(px) => update("logoWidth", px)}
            onResizeBanner={(px) => update("bannerWidth", px)}
            onResizePhoto={(px) => update("photoSize", px)}
            onResizeCertBadge={(px) => update("certBadgeSize", px)}
          />
        </div>
      </div>

      {/* MOBILE: Save template button directly under the preview so it's
          always in reach without scrolling to the bottom of the form. */}
      <div className="lg:hidden order-2">
        <Button
          onClick={save}
          disabled={saving}
          className="w-full"
          data-testid="button-save-brand-mobile"
        >
          {saving ? "Saving…" : "Save template"}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Changes preview live. Save applies them to every staff signature.
        </p>
      </div>

      {/* MOBILE: section dropdown — replaces the vertical rail so the
          selected section's inputs get all the horizontal space. */}
      <div className="lg:hidden order-3">
        <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Edit section
        </label>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value as typeof section)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="select-brand-section"
        >
          {SECTIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* DESKTOP: section rail. Hidden below `lg`. */}
      <nav className="hidden lg:block lg:sticky lg:top-20 space-y-1 order-3 lg:order-none">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
              section === id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid={`nav-${id}`}
          >
            {label}
          </button>
        ))}

        <div className="pt-4">
          <Button
            onClick={save}
            disabled={saving}
            className="w-full"
            data-testid="button-save-brand"
          >
            {saving ? "Saving…" : "Save template"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Changes preview live. Save applies them to every staff signature.
          </p>
        </div>
      </nav>

      {/* Editor panel (fields for the selected section). */}
      <div className="min-w-0 order-4 lg:order-none">
        <h2 className="font-serif text-xl mb-1 hidden lg:block">Signature template</h2>
        <p className="text-sm text-muted-foreground mb-5 hidden lg:block">
          These settings apply to every staff signature.
        </p>

        <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
          {section === "layout" && (
            <>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Layout style
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {LAYOUT_TILES.map((t) => (
                    <LayoutTile
                      key={t.id}
                      selected={local.layout === t.id}
                      onClick={() => update("layout", t.id)}
                      label={t.label}
                      diagram={t.diagram}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                {["horizontal", "compact", "card", "banner"].includes(
                  local.layout,
                ) && (
                  <ToggleRow
                    label="Divider between logo & info"
                    value={local.showDivider}
                    onChange={(v) => update("showDivider", v)}
                    testId="switch-showDivider"
                  />
                )}
              </div>
            </>
          )}

          {section === "colors" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorField label="Primary (name & headings)" value={local.primaryColor} onChange={(v) => update("primaryColor", v)} />
              <ColorField label="Accent (links & icons)" value={local.accentColor} onChange={(v) => update("accentColor", v)} />
              <ColorField label="Body text" value={local.textColor} onChange={(v) => update("textColor", v)} />
              <ColorField label="Muted text" value={local.mutedColor} onChange={(v) => update("mutedColor", v)} />
              <ColorField label="Divider line" value={local.dividerColor} onChange={(v) => update("dividerColor", v)} />
            </div>
          )}

          {section === "type" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Font family (email-safe)">
                  <Select
                    value={local.fontFamily}
                    onValueChange={(v) =>
                      update("fontFamily", v as BrandConfig["fontFamily"])
                    }
                  >
                    <SelectTrigger data-testid="select-fontFamily">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Arial",
                        "Helvetica",
                        "Georgia",
                        "Verdana",
                        "Tahoma",
                        "Trebuchet MS",
                        "Times New Roman",
                        "Courier New",
                      ].map((f) => (
                        <SelectItem key={f} value={f}>
                          <span style={{ fontFamily: f }}>{f}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={`Body size: ${local.fontSize}px`}>
                  <Slider
                    min={10}
                    max={18}
                    step={1}
                    value={[local.fontSize]}
                    onValueChange={(v) => update("fontSize", v[0])}
                    data-testid="slider-fontSize"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={`Name size: ${local.nameSize}px`}>
                  <Slider
                    min={12}
                    max={24}
                    step={1}
                    value={[local.nameSize]}
                    onValueChange={(v) => update("nameSize", v[0])}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <ToggleRow
                    label="Bold name"
                    value={local.nameBold}
                    onChange={(v) => update("nameBold", v)}
                    testId="switch-nameBold"
                  />
                  <ToggleRow
                    label="Bold title"
                    value={local.titleBold}
                    onChange={(v) => update("titleBold", v)}
                  />
                </div>
              </div>
            </div>
          )}

          {section === "logo" && (
            <div className="space-y-4">
              {/* --- Staff photo (per-signature) --- */}
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Staff photo
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Each staff member's headshot is set on their profile in the
                  Staff tab. These controls change how every photo looks across
                  the whole workspace.
                </p>
                <div className="space-y-4">
                  <ToggleRow
                    label="Show staff photo"
                    value={local.showPhoto}
                    onChange={(v) => update("showPhoto", v)}
                    testId="switch-showPhoto"
                  />
                  {local.showPhoto && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Photo shape">
                        <Select
                          value={local.photoShape}
                          onValueChange={(v) =>
                            update("photoShape", v as BrandConfig["photoShape"])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="rounded">Rounded square</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={`Photo size: ${local.photoSize}px`}>
                        <Slider
                          min={48}
                          max={140}
                          step={2}
                          value={[local.photoSize]}
                          onValueChange={(v) => update("photoSize", v[0])}
                        />
                      </Field>
                      <Field label="Photo vertical alignment">
                        <Select
                          value={local.photoAlign}
                          onValueChange={(v) =>
                            update("photoAlign", v as BrandConfig["photoAlign"])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Top (align with name)</SelectItem>
                            <SelectItem value="middle">Center vertically</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  )}
                </div>
              </div>

              {/* --- Company logo --- */}
              <div className="pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Company logo
                </div>
                <div className="space-y-4">
              <Field label="Logo image">
                <ImageUploader
                  value={local.logoUrl}
                  onChange={(v) => update("logoUrl", v)}
                  placeholder="Paste an image URL or upload"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Logo vertical alignment">
                  <Select
                    value={local.logoAlign}
                    onValueChange={(v) =>
                      update("logoAlign", v as BrandConfig["logoAlign"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top (align with name)</SelectItem>
                      <SelectItem value="middle">Center vertically</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Logo horizontal alignment">
                  <Select
                    value={local.logoHAlign}
                    onValueChange={(v) =>
                      update("logoHAlign", v as BrandConfig["logoHAlign"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
                </div>
              </div>

              {/* --- Banner --- */}
              <div className="pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Banner
                </div>
                <div className="space-y-4">
                <Field label="Banner image (optional — shown under signature)">
                  <ImageUploader
                    value={local.bannerUrl}
                    onChange={(v) => update("bannerUrl", v)}
                    placeholder="Paste a banner image URL or upload"
                    aspect={3}
                  />
                </Field>
                {local.bannerUrl && (
                  <Field label={`Banner width: ${local.bannerWidth}px`}>
                    <Slider
                      min={120}
                      max={720}
                      step={10}
                      value={[local.bannerWidth]}
                      onValueChange={(v) => update("bannerWidth", v[0])}
                    />
                  </Field>
                )}
                <Field label="Banner click-through URL">
                  <Input
                    value={local.bannerHref}
                    onChange={(e) => update("bannerHref", e.target.value)}
                    placeholder="example.com/promo"
                    data-testid="input-bannerHref"
                  />
                </Field>
                </div>
              </div>

              {/* --- Certification badges --- */}
              <div className="pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Certification badges
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Small 1:1 squares shown under the banner — ISO, ACS, industry
                  accreditations, member logos, awards. Up to 6.
                </p>
                <div className="space-y-4">
                  <Field label={`Badge size: ${local.certBadgeSize}px`}>
                    <Slider
                      min={32}
                      max={96}
                      step={2}
                      value={[local.certBadgeSize]}
                      onValueChange={(v) => update("certBadgeSize", v[0])}
                      data-testid="slider-certBadgeSize"
                    />
                  </Field>
                  <div className="space-y-3">
                    {(local.certBadges || []).map((badge, idx) => (
                      <div
                        key={idx}
                        className="rounded-md border border-border p-3 space-y-3"
                        data-testid={`row-cert-badge-${idx}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-muted-foreground">
                            Badge {idx + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...(local.certBadges || [])];
                              next.splice(idx, 1);
                              update("certBadges", next);
                            }}
                            className="text-xs text-destructive hover:underline"
                            data-testid={`button-remove-cert-badge-${idx}`}
                          >
                            Remove
                          </button>
                        </div>
                        <Field label="Badge image (square)">
                          <ImageUploader
                            value={badge.url}
                            onChange={(v) => {
                              const next = [...(local.certBadges || [])];
                              next[idx] = { ...next[idx], url: v };
                              update("certBadges", next);
                            }}
                            placeholder="Paste image URL or upload"
                            aspect={1}
                          />
                        </Field>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Field label="Alt text">
                            <Input
                              value={badge.alt || ""}
                              onChange={(e) => {
                                const next = [...(local.certBadges || [])];
                                next[idx] = {
                                  ...next[idx],
                                  alt: e.target.value,
                                };
                                update("certBadges", next);
                              }}
                              placeholder="ISO 9001 certified"
                            />
                          </Field>
                          <Field label="Link (optional)">
                            <Input
                              value={badge.href || ""}
                              onChange={(e) => {
                                const next = [...(local.certBadges || [])];
                                next[idx] = {
                                  ...next[idx],
                                  href: e.target.value,
                                };
                                update("certBadges", next);
                              }}
                              placeholder="iso.org/9001"
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(local.certBadges || []).length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        update("certBadges", [
                          ...(local.certBadges || []),
                          { url: "", alt: "", href: "" },
                        ])
                      }
                      data-testid="button-add-cert-badge"
                    >
                      + Add certification badge
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === "contact" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Toggle which rows appear on each staff signature, and choose an icon or a custom text label as the indicator. Email is always shown.
              </p>
              <ContactRowEditor
                enabled={local.showPhone}
                onEnabledChange={(v) => update("showPhone", v)}
                rowName="Phone"
                iconRow="phone"
                iconValue={local.phoneIcon}
                onIconChange={(v) => update("phoneIcon", v)}
                labelValue={local.phoneLabel}
                onLabelChange={(v) => update("phoneLabel", v)}
              />
              <ContactRowEditor
                enabled={local.showMobile}
                onEnabledChange={(v) => update("showMobile", v)}
                rowName="Mobile"
                iconRow="mobile"
                iconValue={local.mobileIcon}
                onIconChange={(v) => update("mobileIcon", v)}
                labelValue={local.mobileLabel}
                onLabelChange={(v) => update("mobileLabel", v)}
              />
              <ContactRowEditor
                enabled={true}
                onEnabledChange={() => {}}
                enabledDisabled
                rowName="Email"
                iconRow="email"
                iconValue={local.emailIcon}
                onIconChange={(v) => update("emailIcon", v)}
                labelValue={local.emailLabel}
                onLabelChange={(v) => update("emailLabel", v)}
              />
              <ContactRowEditor
                enabled={local.showWebsite}
                onEnabledChange={(v) => update("showWebsite", v)}
                rowName="Website"
                iconRow="website"
                iconValue={local.websiteIcon}
                onIconChange={(v) => update("websiteIcon", v)}
                labelValue={local.websiteLabel}
                onLabelChange={(v) => update("websiteLabel", v)}
              />
              <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ToggleRow label="Address row" value={local.showAddress} onChange={(v) => update("showAddress", v)} />
                <ToggleRow label="Pronouns beside name" value={local.showPronouns} onChange={(v) => update("showPronouns", v)} />
              </div>
            </div>
          )}

          {section === "social" && (
            <div className="space-y-4">
              <ToggleRow
                label="Show social icons"
                value={local.showSocialIcons}
                onChange={(v) => update("showSocialIcons", v)}
                testId="switch-showSocials"
              />
              {local.showSocialIcons && (
                <>
                  <div className="pt-3 border-t border-border">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Icon style
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {([
                        { value: "filled", label: "Filled (accent)" },
                        { value: "color", label: "Full brand color" },
                        { value: "outlined", label: "Outlined" },
                        { value: "minimal", label: "Minimal" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update("socialIconStyle", opt.value)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition ${
                            local.socialIconStyle === opt.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-input text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <SocialsEditor
                      value={local.socials as { network: string; url: string }[]}
                      onChange={(v) => update("socials", v as any)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {section === "company" && (
            <div className="space-y-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              </div>
            </div>
          )}

          {section === "cta" && (
            <CtaEditor
              value={mergedCtas(local)}
              onChange={(next) =>
                setLocalDirect((s) => {
                  const n = { ...s, ctas: next, ctaText: "", ctaUrl: "" };
                  onChange(n);
                  return n;
                })
              }
            />
          )}

          {section === "disclaimer" && (
            <Field label="Legal disclaimer">
              <Textarea
                value={local.disclaimer}
                onChange={(e) => update("disclaimer", e.target.value)}
                rows={5}
                placeholder="This email and any attachments are confidential…"
                data-testid="textarea-disclaimer"
              />
            </Field>
          )}
        </div>
      </div>

      {/* DESKTOP: sticky preview column. Hidden below `lg`; mobile uses the
          top-of-page preview instead. */}
      <div className="hidden lg:block lg:sticky lg:top-20 min-w-0 order-none">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Preview — using {exampleStaff.fullName}
        </div>
        <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm overflow-x-auto">
          <SignaturePreview
            brand={local}
            staff={exampleStaff}
            showCopy={false}
            plan={company?.plan}
            onResizeLogo={(px) => update("logoWidth", px)}
            onResizeBanner={(px) => update("bannerWidth", px)}
            onResizePhoto={(px) => update("photoSize", px)}
            onResizeCertBadge={(px) => update("certBadgeSize", px)}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Preview updates instantly. Save applies these changes to every staff signature.
        </p>
      </div>
    </div>
  );
}

// Small SVG diagrams for the visual layout picker.
const LAYOUT_TILES: {
  id: BrandConfig["layout"];
  label: string;
  diagram: React.ReactNode;
}[] = [
  {
    id: "horizontal",
    label: "Horizontal",
    diagram: (
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <rect x="6" y="10" width="22" height="20" rx="2" className="fill-muted" />
        <rect x="33" y="12" width="36" height="3" rx="1" className="fill-foreground/70" />
        <rect x="33" y="18" width="28" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="33" y="23" width="32" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="33" y="27" width="24" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "stacked",
    label: "Stacked",
    diagram: (
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <rect x="6" y="6" width="30" height="8" rx="2" className="fill-muted" />
        <rect x="6" y="18" width="48" height="3" rx="1" className="fill-foreground/70" />
        <rect x="6" y="24" width="36" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="6" y="29" width="42" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "compact",
    label: "Compact",
    diagram: (
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <rect x="6" y="14" width="14" height="14" rx="2" className="fill-muted" />
        <rect x="24" y="15" width="30" height="3" rx="1" className="fill-foreground/70" />
        <rect x="24" y="22" width="46" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "photo-left",
    label: "Photo left",
    diagram: (
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <circle cx="16" cy="20" r="10" className="fill-muted" />
        <rect x="32" y="11" width="36" height="3" rx="1" className="fill-foreground/70" />
        <rect x="32" y="17" width="28" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="32" y="22" width="32" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="32" y="27" width="20" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "banner",
    label: "Banner on top",
    diagram: (
      // Banner is the loudest element: sits above the whole signature.
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <rect x="6" y="5" width="64" height="11" rx="2" className="fill-primary/30" />
        <rect x="6" y="20" width="14" height="14" rx="2" className="fill-muted" />
        <rect x="24" y="22" width="34" height="3" rx="1" className="fill-foreground/70" />
        <rect x="24" y="28" width="28" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "card",
    label: "Card",
    diagram: (
      // Rounded bordered frame wrapping the whole signature.
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <rect x="3" y="4" width="74" height="32" rx="4" className="fill-none stroke-muted-foreground" strokeWidth={1} />
        <rect x="9" y="11" width="18" height="18" rx="2" className="fill-muted" />
        <rect x="31" y="12" width="36" height="3" rx="1" className="fill-foreground/70" />
        <rect x="31" y="18" width="28" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="31" y="23" width="30" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "divided",
    label: "Divided",
    diagram: (
      // Strong vertical rule between logo and text + horizontal rules.
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <rect x="6" y="9" width="18" height="22" rx="2" className="fill-muted" />
        <rect x="27" y="8" width="1.5" height="24" className="fill-muted-foreground" />
        <rect x="33" y="10" width="36" height="3" rx="1" className="fill-foreground/70" />
        <rect x="33" y="17" width="36" height="1" className="fill-muted" />
        <rect x="33" y="20" width="28" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="33" y="25" width="32" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "centered",
    label: "Centered",
    diagram: (
      // Portrait on top, then logo, name, contact — all centered.
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <circle cx="40" cy="12" r="6" className="fill-muted" />
        <rect x="26" y="22" width="28" height="3" rx="1" className="fill-foreground/70" />
        <rect x="30" y="28" width="20" height="2" rx="1" className="fill-muted-foreground" />
        <rect x="28" y="32" width="24" height="2" rx="1" className="fill-muted-foreground" />
      </svg>
    ),
  },
];

function LayoutTile({
  selected,
  onClick,
  label,
  diagram,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  diagram: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group border rounded-lg p-2 text-left transition ${
        selected
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <div className="aspect-[2/1] bg-background rounded border border-border/60 flex items-center justify-center overflow-hidden">
        {diagram}
      </div>
      <div
        className={`text-xs mt-2 font-medium ${
          selected ? "text-primary" : "text-foreground"
        }`}
      >
        {label}
      </div>
    </button>
  );
}

// ---------- Company info editor ----------
// A dedicated top-level page for the company’s identity fields: display name,
// tagline, address, phone, website, and legal disclaimer. Same brand-config
// storage as the template editor, but presented on its own so admins can find
// it without hunting through the styling controls.
function CompanyEditor({
  brand,
  onChange,
}: {
  brand: BrandConfig;
  onChange: (b: BrandConfig) => void;
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
      toast({ title: "Company info saved" });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const dirty = JSON.stringify(local) !== JSON.stringify(brand);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 items-start">
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl">Company info</h1>
          <p className="text-sm text-muted-foreground">
            These details appear on every staff signature. Staff can override
            phone, website, and address on their own profile.
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm mb-3">Identity</h2>
            <div className="space-y-3">
              <Field label="Display name">
                <Input
                  value={local.companyDisplayName}
                  onChange={(e) => update("companyDisplayName", e.target.value)}
                  placeholder="Elapid Group Pty Ltd"
                  data-testid="input-company-name"
                />
              </Field>
              <Field label="Tagline">
                <Input
                  value={local.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="Wildlife management for the real world"
                  data-testid="input-company-tagline"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm mb-3">Company logo</h2>
            <p className="text-xs text-muted-foreground -mt-2 mb-3">
              Appears in every staff signature. Fine-tune size and alignment
              from Brand & template → Photo, logo & banners.
            </p>
            <Field label="Logo image">
              <ImageUploader
                value={local.logoUrl}
                onChange={(v) => update("logoUrl", v)}
                placeholder="Paste an image URL or upload"
              />
            </Field>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm mb-3">Contact</h2>
            <div className="space-y-3">
              <Field label="Company address">
                <Input
                  value={local.companyAddress}
                  onChange={(e) => update("companyAddress", e.target.value)}
                  placeholder="123 Example Street, Brisbane QLD 4000"
                  data-testid="input-company-address"
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Phone">
                  <Input
                    value={local.companyPhone}
                    onChange={(e) => update("companyPhone", e.target.value)}
                    placeholder="+61 7 5000 0000"
                    data-testid="input-company-phone"
                  />
                </Field>
                <Field label="Website">
                  <Input
                    value={local.companyWebsite}
                    onChange={(e) => update("companyWebsite", e.target.value)}
                    placeholder="example.com"
                    data-testid="input-company-website"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm mb-3">Legal disclaimer</h2>
            <Field label="Text that appears below every signature">
              <Textarea
                value={local.disclaimer}
                onChange={(e) => update("disclaimer", e.target.value)}
                rows={6}
                placeholder="This email and any attachments are confidential…"
                data-testid="textarea-company-disclaimer"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sticky bottom-4">
          <div className="text-xs text-muted-foreground">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </div>
          <Button
            onClick={save}
            disabled={saving || !dirty}
            data-testid="button-save-company"
          >
            {saving ? "Saving…" : "Save company info"}
          </Button>
        </div>
      </div>

      {/* Right column: at-a-glance summary card. */}
      <div className="lg:sticky lg:top-20">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Summary
        </div>
        <div className="bg-card border border-card-border rounded-lg p-5 space-y-3">
          {local.logoUrl ? (
            <div className="flex items-center justify-center bg-muted/30 rounded-md py-4">
              <img
                src={local.logoUrl}
                alt="Company logo preview"
                className="max-h-20 max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-muted/30 rounded-md py-6 text-xs text-muted-foreground italic">
              No logo uploaded yet
            </div>
          )}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Display name
            </div>
            <div className="text-lg font-semibold">
              {local.companyDisplayName || (
                <span className="text-muted-foreground italic font-normal">
                  Not set
                </span>
              )}
            </div>
            {local.tagline && (
              <div className="text-sm italic text-muted-foreground">
                {local.tagline}
              </div>
            )}
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <SummaryRow label="Phone" value={local.companyPhone} />
            <SummaryRow label="Website" value={local.companyWebsite} />
            <SummaryRow label="Address" value={local.companyAddress} />
          </div>
          {local.disclaimer && (
            <div className="border-t border-border pt-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Disclaimer
              </div>
              <div className="text-xs text-muted-foreground line-clamp-4">
                {local.disclaimer}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Head to Brand & template to preview these fields inside a full
          signature layout.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </div>
      <div className="text-sm text-right truncate">
        {value || <span className="text-muted-foreground italic">Not set</span>}
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

// Logo icon removed per brand decision — wordmark only.

// -- Contact row editor -------------------------------------------------------
// Renders an SVG icon inline using dangerouslySetInnerHTML — the icon library
// returns raw SVG strings so the picker and the copied HTML use the same art.
function SvgIconInline({ svg, size = 20 }: { svg: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function ContactRowEditor(props: {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  enabledDisabled?: boolean;
  rowName: string;
  iconRow: "phone" | "mobile" | "email" | "website";
  iconValue: string;
  onIconChange: (v: string) => void;
  labelValue: string;
  onLabelChange: (v: string) => void;
}) {
  const {
    enabled,
    onEnabledChange,
    enabledDisabled,
    rowName,
    iconRow,
    iconValue,
    onIconChange,
    labelValue,
    onLabelChange,
  } = props;
  const mode: "icon" | "label" = labelValue.trim() ? "label" : "icon";
  const options = CONTACT_ICONS[iconRow] || [];
  const current = contactIconById(iconRow, iconValue) || options[0];
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-sm">{rowName} row</div>
        {enabledDisabled ? (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Always on</span>
        ) : (
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        )}
      </div>
      {enabled && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onLabelChange("")}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                mode === "icon"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input text-muted-foreground hover:text-foreground"
              }`}
            >
              Icon
            </button>
            <button
              type="button"
              onClick={() => onLabelChange(labelValue || rowName.slice(0, 1).toUpperCase())}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                mode === "label"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input text-muted-foreground hover:text-foreground"
              }`}
            >
              Text label
            </button>
          </div>
          {mode === "icon" ? (
            <Select value={iconValue || (current?.id ?? "")} onValueChange={onIconChange}>
              <SelectTrigger className="w-full max-w-[320px]" data-testid={`select-icon-${iconRow}`}>
                <SelectValue asChild>
                  <div className="flex items-center gap-2 text-sm">
                    {current ? <SvgIconInline svg={current.svg("currentColor")} size={18} /> : null}
                    <span>{current?.label ?? "Choose icon"}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    <div className="flex items-center gap-2">
                      <SvgIconInline svg={o.svg("currentColor")} size={18} />
                      <span>{o.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={labelValue}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder={`e.g. ${rowName === "Email" ? "Email:" : rowName.slice(0, 1) + ":"}`}
              maxLength={16}
              className="max-w-[220px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

// -- Socials editor -----------------------------------------------------------
// A single flat list where users add rows, pick a network from the dropdown
// (with brand icon preview), and paste the profile URL.
function SocialsEditor({
  value,
  onChange,
}: {
  value: { network: string; url: string }[];
  onChange: (v: { network: string; url: string }[]) => void;
}) {
  const list = value || [];
  const update = (i: number, patch: Partial<{ network: string; url: string }>) =>
    onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => {
    // Suggest the first unused network so the picker isn't parked on a duplicate.
    const used = new Set(list.map((r) => r.network));
    const next = SOCIAL_ICONS.find((s) => !used.has(s.id)) || SOCIAL_ICONS[0];
    onChange([...list, { network: next.id, url: "" }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Social profiles
        </Label>
        <span className="text-[11px] text-muted-foreground">{list.length} added</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose from {SOCIAL_ICONS.length} networks. Paste the full profile URL for each row.
      </p>
      {list.length === 0 && (
        <div className="text-sm text-muted-foreground italic py-6 text-center border border-dashed border-border rounded-lg">
          No profiles yet. Click “Add network” below to start.
        </div>
      )}
      {list.map((row, i) => {
        const def = socialById(row.network);
        return (
          <div key={i} className="flex items-start gap-2">
            <div className="w-[190px] shrink-0">
              <Select value={row.network} onValueChange={(v) => update(i, { network: v })}>
                <SelectTrigger>
                  <SelectValue asChild>
                    <div className="flex items-center gap-2 text-sm">
                      {def ? (
                        <SvgIconInline
                          svg={def.svg(def.brandColor || "currentColor")}
                          size={18}
                        />
                      ) : null}
                      <span>{def?.label ?? "Pick network"}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {SOCIAL_ICONS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <SvgIconInline
                          svg={s.svg(s.brandColor || "currentColor")}
                          size={18}
                        />
                        <span>{s.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              value={row.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder={`https://…`}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="h-9 px-2 text-xs text-destructive hover:underline"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <Button type="button" variant="outline" onClick={add} className="w-full">
        + Add network
      </Button>
    </div>
  );
}

// -- CTA editor ---------------------------------------------------------------
type Cta = { text: string; url: string; style: "solid" | "outline" | "link" };
export function mergedCtas(b: BrandConfig): Cta[] {
  const legacy: Cta[] =
    b.ctaText && b.ctaUrl ? [{ text: b.ctaText, url: b.ctaUrl, style: "solid" }] : [];
  const list = (b.ctas as Cta[]) || [];
  return [...legacy, ...list];
}
function CtaEditor({ value, onChange }: { value: Cta[]; onChange: (v: Cta[]) => void }) {
  const update = (i: number, patch: Partial<Cta>) =>
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...value, { text: "", url: "", style: "solid" }]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add one or more call-to-action buttons. Each staff signature shows all of them.
      </p>
      {value.length === 0 && (
        <div className="text-sm text-muted-foreground italic py-6 text-center border border-dashed border-border rounded-lg">
          No buttons yet
        </div>
      )}
      {value.map((c, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">Button {i + 1}</div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
          </div>
          <FieldRow>
            <Field label="Text">
              <Input
                value={c.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="Book a call"
              />
            </Field>
            <Field label="URL">
              <Input
                value={c.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="cal.com/…"
              />
            </Field>
          </FieldRow>
          <div>
            <Label className="text-xs text-muted-foreground">Style</Label>
            <div className="flex gap-2 mt-1">
              {(["solid", "outline", "link"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update(i, { style: s })}
                  className={`text-xs px-3 py-1 rounded-full border capitalize transition ${
                    c.style === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add} className="w-full">
        + Add button
      </Button>
    </div>
  );
}

// Small badge shown in the admin header that tells the user which plan
// they're on. Trialing workspaces get a countdown chip so it never feels
// like the trial is hidden away.
function PlanBadge({
  plan,
  status,
  trialEndsAt,
}: {
  plan: PlanId;
  status: string;
  trialEndsAt: number | null;
}) {
  const p = PLANS[plan] ?? PLANS.free;
  const now = Date.now();
  const trialing = trialEndsAt && trialEndsAt > now && plan === "free";
  const days =
    trialEndsAt && trialEndsAt > now
      ? Math.ceil((trialEndsAt - now) / (24 * 60 * 60 * 1000))
      : 0;
  return (
    <div className="hidden md:flex items-center gap-2 text-xs">
      <span
        className={`rounded-full px-2.5 py-1 font-medium ${
          plan === "free"
            ? "bg-slate-100 text-slate-600"
            : "bg-teal-50 text-teal-700"
        }`}
      >
        {p.name}
      </span>
      {trialing && (
        <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
          Trial · {days}d left
        </span>
      )}
      {status === "past_due" && (
        <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
          Payment failed
        </span>
      )}
    </div>
  );
}

// Bulk staff import — admins download a CSV template, fill it in with their
// team, then re-upload. Matches on email so re-imports update existing rows
// instead of duplicating. All heavy lifting is on the server
// (POST /api/staff/import); this dialog is just a thin file-picker + result
// summary.
type ImportResult = {
  created: number;
  updated: number;
  skipped: { row: number; reason: string }[];
  cap: number;
  total: number;
};

function ImportCsvDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Reset local state whenever the dialog is reopened so users don't see the
  // previous run's summary bleed into a fresh import.
  useEffect(() => {
    if (open) {
      setFile(null);
      setResult(null);
    }
  }, [open]);

  const importMutation = useMutation({
    mutationFn: async (csv: string) => {
      const r = await apiRequest("POST", "/api/staff/import", { csv });
      return (await r.json()) as ImportResult;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: `Imported ${data.created + data.updated} staff`,
        description:
          data.skipped.length > 0
            ? `${data.created} added, ${data.updated} updated, ${data.skipped.length} skipped.`
            : `${data.created} added, ${data.updated} updated.`,
      });
    },
    onError: (e: any) => {
      toast({
        title: "Import failed",
        description: e?.message ?? "Please check the CSV and try again.",
        variant: "destructive",
      });
    },
  });

  const handleImport = async () => {
    if (!file) return;
    const csv = await file.text();
    importMutation.mutate(csv);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Import staff from CSV
          </DialogTitle>
          <DialogDescription>
            Download the template, fill it in with your team, then upload. Rows
            that match an existing email will update that staff member; new
            emails create new rows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
            <div className="text-sm font-medium mb-1">1. Download template</div>
            <p className="text-xs text-muted-foreground mb-3">
              Includes an example row and every supported column.
            </p>
            <a
              href="/api/staff/csv-template"
              download="signaturely-staff-template.csv"
              className="inline-flex"
            >
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-download-template">
                <Download className="w-4 h-4" /> signaturely-staff-template.csv
              </Button>
            </a>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
            <div className="text-sm font-medium mb-1">2. Upload filled file</div>
            <p className="text-xs text-muted-foreground mb-3">
              CSV only. Header row must stay on line 1.
            </p>
            <label className="block">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-800"
                data-testid="input-csv-file"
              />
            </label>
            {file && (
              <div className="mt-2 text-xs text-muted-foreground truncate">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>

          {result && (
            <div className="rounded-lg border border-border bg-background p-3 sm:p-4 space-y-2">
              <div className="text-sm font-medium">Import summary</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-emerald-700">Added: {result.created}</span>
                <span className="text-slate-700">Updated: {result.updated}</span>
                <span className="text-amber-700">
                  Skipped: {result.skipped.length}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Workspace now has {result.total} / {result.cap} seats used.
              </div>
              {result.skipped.length > 0 && (
                <ul className="text-xs text-amber-700 list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
                  {result.skipped.map((s, i) => (
                    <li key={i}>
                      Row {s.row}: {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {result ? "Done" : "Cancel"}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
            className="w-full sm:w-auto gap-2 bg-teal-700 hover:bg-teal-800"
            data-testid="button-run-import"
          >
            <Upload className="w-4 h-4" />
            {importMutation.isPending ? "Importing…" : "Import staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
