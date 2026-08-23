import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------- Companies (tenants) ----------
// Each company has admin credentials and a brand/template config.
// brandConfig is a JSON blob (SQLite has no JSON column) that stores everything
// needed to render a signature: colors, fonts, logo URL, layout, disclaimer, socials.
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(), // used for login + share URLs
  name: text("name").notNull(),
  adminEmail: text("admin_email").notNull(),
  passwordHash: text("password_hash").notNull(),
  brandConfig: text("brand_config").notNull(), // JSON string of BrandConfig
  // Billing / plan state. `plan` is the tier the workspace is currently on;
  // `stripeCustomerId` and `stripeSubscriptionId` link to Stripe;
  // `subscriptionStatus` mirrors Stripe's `status` field (trialing, active,
  // past_due, canceled, incomplete, etc.); `trialEndsAt` and `currentPeriodEnd`
  // are unix-ms timestamps used to gate access without hitting Stripe.
  plan: text("plan").notNull().default("free"), // free | starter | growth | business
  subscriptionStatus: text("subscription_status").notNull().default("none"),
  stripeCustomerId: text("stripe_customer_id").notNull().default(""),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().default(""),
  trialEndsAt: integer("trial_ends_at"),
  currentPeriodEnd: integer("current_period_end"),
  createdAt: integer("created_at").notNull(),
});

// ---------- Plans ----------
// Source of truth for what each plan costs and includes. Kept alongside the
// schema so both server (enforcement) and client (pricing page) read the same
// numbers. Prices are AUD; Stripe price IDs come from env vars at runtime.
// Flat monthly pricing (AUD). Every plan is a single flat rate independent
// of seat count — the seatCap is a hard limit on how many staff a workspace
// can hold, not a per-seat multiplier.
export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: 0,
    seatCap: 1,
    features: [
      "1 staff member",
      "All layouts",
      "Copy & paste anywhere",
      "Signaturely watermark",
    ],
  },
  starter: {
    id: "starter" as const,
    name: "Starter",
    price: 10,
    seatCap: 10,
    features: [
      "Up to 10 staff",
      "No watermark",
      "Custom brand colours & fonts",
      "Signature banner image",
      "Staff signup link",
      "Email support",
    ],
  },
  growth: {
    id: "growth" as const,
    name: "Growth",
    price: 20,
    seatCap: 50,
    features: [
      "Up to 50 staff",
      "Everything in Starter",
      "All 8 layouts",
      "Company-wide brand refresh in one click",
      "Priority email support",
      "Team invite links",
    ],
    highlight: true,
  },
  business: {
    id: "business" as const,
    name: "Business",
    price: 30,
    seatCap: 10000,
    features: [
      "Unlimited staff",
      "Everything in Growth",
      "Dedicated account manager",
      "Custom contract & DPA",
      "SSO on request",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Flat pricing — seats no longer change the bill. Kept as a function so
// callers written for the old shape don't break.
export function planMonthlyTotal(planId: PlanId, _seats?: number): number {
  return PLANS[planId].price;
}

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
});

// Signup payload (raw password, not hash)
export const signupSchema = z.object({
  companyName: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  adminEmail: z.string().email(),
  password: z.string().min(6).max(200),
});

export const loginSchema = z.object({
  slug: z.string().min(1),
  password: z.string().min(1),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// ---------- Staff ----------
export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull(),
  slug: text("slug").notNull(), // e.g. jane-doe, used in /s/:companySlug/:staffSlug
  fullName: text("full_name").notNull(),
  jobTitle: text("job_title").notNull().default(""),
  department: text("department").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  mobile: text("mobile").notNull().default(""),
  website: text("website").notNull().default(""),
  address: text("address").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  pronouns: text("pronouns").notNull().default(""),
  bookingUrl: text("booking_url").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  twitter: text("twitter").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  facebook: text("facebook").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  companyId: true,
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

// ---------- Staff invite tokens ----------
// A staff-invite is a shareable, single-use URL a company admin gives out so
// the recipient can fill in their own staff profile without needing a login.
export const staffInvites = sqliteTable("staff_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull(),
  token: text("token").notNull(),
  label: text("label").notNull().default(""),
  expiresAt: integer("expires_at"),
  usedAt: integer("used_at"),
  usedStaffId: integer("used_staff_id"),
  createdAt: integer("created_at").notNull(),
});

export type StaffInvite = typeof staffInvites.$inferSelect;

// What we accept from the public join form. Slug is derived server-side from
// full name, so we omit it here.
export const publicJoinSchema = insertStaffSchema.omit({ slug: true }).extend({
  fullName: z.string().trim().min(1, "Full name is required"),
});
export type PublicJoin = z.infer<typeof publicJoinSchema>;

// ---------- Brand / Signature Template ----------
// Not a DB table — this is the shape of the JSON stored on companies.brandConfig.
// Keep it explicit so both server and client can validate + render from it.
export const brandConfigSchema = z.object({
  layout: z
    .enum([
      "horizontal", // logo left, name + contact right
      "stacked", // everything centered/left in a single column
      "compact", // one-liner-style row for small footprints
      "photo-left", // portrait leads, contact stack right of it
      "banner", // horizontal + banner block underneath
      "card", // bordered rounded box wrapping the whole signature
      "divided", // logo | vertical rule | text block
      "centered", // portrait-first, everything center-aligned
    ])
    .default("horizontal"),
  logoUrl: z.string().default(""),
  logoWidth: z.number().int().min(40).max(400).default(140),
  // How the logo image sits vertically next to the text column when the text
  // is taller than the logo. `top` (default) keeps legacy behaviour; `middle`
  // pins it centred so tall bios don’t leave a visible gap under a small logo.
  logoAlign: z.enum(["top", "middle"]).default("top"),
  // Horizontal alignment of the logo image inside its cell (or its own row in
  // the stacked layout). Lets a small logo be centred over/beside the text.
  logoHAlign: z.enum(["left", "center", "right"]).default("left"),
  bannerUrl: z.string().default(""), // optional wide image under sig
  bannerWidth: z.number().min(120).max(720).default(520),
  bannerHref: z.string().default(""),

  // Optional 1:1 certification / accreditation badges rendered as a small row
  // beneath the banner. Up to 6 badges. Each badge is a square image plus an
  // optional link target and alt text ("ISO 9001 certified" etc).
  certBadges: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().default(""),
        href: z.string().default(""),
      })
    )
    .max(10)
    .default([]),
  certBadgeSize: z.number().int().min(32).max(96).default(56),

  // Colors (hex)
  primaryColor: z.string().default("#0f766e"), // headings + name
  textColor: z.string().default("#111827"),
  mutedColor: z.string().default("#6b7280"),
  dividerColor: z.string().default("#e5e7eb"),
  accentColor: z.string().default("#0f766e"), // icons + links

  // Type
  fontFamily: z
    .enum([
      "Arial",
      "Helvetica",
      "Georgia",
      "Verdana",
      "Tahoma",
      "Trebuchet MS",
      "Times New Roman",
      "Courier New",
    ])
    .default("Arial"),
  fontSize: z.number().int().min(10).max(18).default(13),
  nameSize: z.number().int().min(12).max(24).default(16),
  nameBold: z.boolean().default(true),
  titleBold: z.boolean().default(false),
  showPhoto: z.boolean().default(true),
  photoShape: z.enum(["circle", "rounded", "square"]).default("circle"),
  photoSize: z.number().int().min(48).max(140).default(72),
  photoAlign: z.enum(["top", "middle"]).default("top"),
  showDivider: z.boolean().default(true),
  showSocialIcons: z.boolean().default(true),
  socialIconStyle: z.enum(["filled", "outlined", "minimal", "color"]).default("filled"),

  // Which contact rows to show (email always visible)
  showPhone: z.boolean().default(true),
  showMobile: z.boolean().default(true),
  showWebsite: z.boolean().default(true),
  showAddress: z.boolean().default(false),
  showPronouns: z.boolean().default(false),

  // Which social networks to show when the row is on (legacy toggles)
  socialLinkedin: z.boolean().default(true),
  socialTwitter: z.boolean().default(true),
  socialInstagram: z.boolean().default(true),
  socialFacebook: z.boolean().default(true),

  // Extended social list: pick any supported network and paste its URL.
  socials: z
    .array(z.object({ network: z.string(), url: z.string() }))
    .default([]),

  // Contact row indicator: either an icon or a custom text label.
  // If the label is a non-empty string it wins and no icon is drawn.
  phoneLabel: z.string().default(""),
  mobileLabel: z.string().default(""),
  emailLabel: z.string().default(""),
  websiteLabel: z.string().default(""),
  // Icon variants per contact row. Free-form string so we can extend the catalog.
  phoneIcon: z.string().default("phone"),
  mobileIcon: z.string().default("mobile"),
  emailIcon: z.string().default("mail"),
  websiteIcon: z.string().default("globe"),

  // Company block
  companyDisplayName: z.string().default(""),
  tagline: z.string().default(""),
  companyAddress: z.string().default(""),
  companyWebsite: z.string().default(""),
  companyPhone: z.string().default(""),

  // Disclaimer + CTAs (multiple buttons supported)
  disclaimer: z.string().default(""),
  ctaText: z.string().default(""),
  ctaUrl: z.string().default(""),
  ctas: z
    .array(
      z.object({
        text: z.string(),
        url: z.string(),
        style: z.enum(["solid", "outline", "link"]).default("solid"),
      })
    )
    .default([]),
});

export type BrandConfig = z.infer<typeof brandConfigSchema>;

export const defaultBrandConfig: BrandConfig = brandConfigSchema.parse({});
