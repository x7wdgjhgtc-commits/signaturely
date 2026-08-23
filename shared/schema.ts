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
  createdAt: integer("created_at").notNull(),
});

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

// ---------- Brand / Signature Template ----------
// Not a DB table — this is the shape of the JSON stored on companies.brandConfig.
// Keep it explicit so both server and client can validate + render from it.
export const brandConfigSchema = z.object({
  layout: z
    .enum(["horizontal", "stacked", "compact", "photo-left", "banner"])
    .default("horizontal"),
  logoUrl: z.string().default(""),
  logoWidth: z.number().int().min(40).max(400).default(140),
  bannerUrl: z.string().default(""), // optional wide image under sig
  bannerHref: z.string().default(""),

  // Colors (hex)
  primaryColor: z.string().default("#0f766e"), // headings + name
  textColor: z.string().default("#111827"),
  mutedColor: z.string().default("#6b7280"),
  dividerColor: z.string().default("#e5e7eb"),
  accentColor: z.string().default("#0f766e"), // icons + links

  // Type
  fontFamily: z
    .enum(["Arial", "Helvetica", "Georgia", "Verdana", "Tahoma", "Trebuchet MS"])
    .default("Arial"),
  fontSize: z.number().int().min(10).max(18).default(13),
  nameBold: z.boolean().default(true),
  showPhoto: z.boolean().default(true),
  showDivider: z.boolean().default(true),
  showSocialIcons: z.boolean().default(true),

  // Labels
  phoneLabel: z.string().default("P"),
  mobileLabel: z.string().default("M"),
  emailLabel: z.string().default("E"),
  websiteLabel: z.string().default("W"),

  // Company block
  companyDisplayName: z.string().default(""),
  tagline: z.string().default(""),
  companyAddress: z.string().default(""),
  companyWebsite: z.string().default(""),
  companyPhone: z.string().default(""),

  // Disclaimer + CTA
  disclaimer: z.string().default(""),
  ctaText: z.string().default(""),
  ctaUrl: z.string().default(""),
});

export type BrandConfig = z.infer<typeof brandConfigSchema>;

export const defaultBrandConfig: BrandConfig = brandConfigSchema.parse({});
