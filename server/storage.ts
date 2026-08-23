import { companies, staff, staffInvites, defaultBrandConfig, brandConfigSchema } from "@shared/schema";
import type {
  Company,
  InsertCompany,
  Staff,
  InsertStaff,
  StaffInvite,
  BrandConfig,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, asc, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

// On Render we mount a persistent disk at DATA_DIR (see render.yaml). If the
// mount is missing (e.g. disk not yet attached) we degrade to a writable
// ephemeral path so the service still boots — clearly logged so operators
// notice. Locally the default resolves to the working directory.
function pickDbPath(): string {
  const explicit = process.env.DATABASE_PATH;
  if (explicit) return explicit;
  const configured = process.env.DATA_DIR;
  if (configured) {
    if (existsSync(configured)) return `${configured}/data.db`;
    console.warn(
      `[storage] DATA_DIR=${configured} does not exist — falling back to ephemeral /tmp/data.db. Attach a Render disk mounted at ${configured} to persist data across deploys.`
    );
    return "/tmp/data.db";
  }
  return "./data.db";
}
const DB_PATH = pickDbPath();
try { mkdirSync(dirname(DB_PATH), { recursive: true }); } catch {}
console.log(`[storage] SQLite at ${DB_PATH}`);

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Ensure tables exist. Drizzle-kit push handles schema in dev, but for a
// zero-config first boot we create tables directly if they aren't there.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    brand_config TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    subscription_status TEXT NOT NULL DEFAULT 'none',
    stripe_customer_id TEXT NOT NULL DEFAULT '',
    stripe_subscription_id TEXT NOT NULL DEFAULT '',
    trial_ends_at INTEGER,
    current_period_end INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    full_name TEXT NOT NULL,
    job_title TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    mobile TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    photo_url TEXT NOT NULL DEFAULT '',
    pronouns TEXT NOT NULL DEFAULT '',
    booking_url TEXT NOT NULL DEFAULT '',
    linkedin TEXT NOT NULL DEFAULT '',
    twitter TEXT NOT NULL DEFAULT '',
    instagram TEXT NOT NULL DEFAULT '',
    facebook TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_staff_company ON staff(company_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_company_slug ON staff(company_id, slug);
  CREATE TABLE IF NOT EXISTS staff_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    expires_at INTEGER,
    used_at INTEGER,
    used_staff_id INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_token ON staff_invites(token);
  CREATE INDEX IF NOT EXISTS idx_invite_company ON staff_invites(company_id);
`);

// Idempotent migrations for existing databases that predate the billing
// columns. SQLite ALTER TABLE ADD COLUMN fails if the column already exists,
// so wrap each in a try/catch and rely on `duplicate column` being harmless.
function addColumnIfMissing(table: string, column: string, ddl: string) {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  } catch (e: any) {
    if (!String(e?.message || "").includes("duplicate column")) throw e;
  }
}
addColumnIfMissing("companies", "plan", "TEXT NOT NULL DEFAULT 'free'");
addColumnIfMissing("companies", "subscription_status", "TEXT NOT NULL DEFAULT 'none'");
addColumnIfMissing("companies", "stripe_customer_id", "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("companies", "stripe_subscription_id", "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("companies", "trial_ends_at", "INTEGER");
addColumnIfMissing("companies", "current_period_end", "INTEGER");

export interface IStorage {
  createCompany(
    input: InsertCompany & { password: string }
  ): Promise<Company>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  getCompany(id: number): Promise<Company | undefined>;
  verifyPassword(company: Company, password: string): Promise<boolean>;
  updateBrand(id: number, brand: BrandConfig): Promise<Company | undefined>;
  updateBilling(
    id: number,
    patch: Partial<{
      plan: string;
      subscriptionStatus: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      trialEndsAt: number | null;
      currentPeriodEnd: number | null;
    }>
  ): Promise<Company | undefined>;

  listStaff(companyId: number): Promise<Staff[]>;
  getStaff(companyId: number, id: number): Promise<Staff | undefined>;
  getStaffBySlug(companySlug: string, staffSlug: string): Promise<
    { company: Company; staff: Staff } | undefined
  >;
  createStaff(companyId: number, input: InsertStaff): Promise<Staff>;
  updateStaff(
    companyId: number,
    id: number,
    input: Partial<InsertStaff>
  ): Promise<Staff | undefined>;
  deleteStaff(companyId: number, id: number): Promise<boolean>;

  createInvite(companyId: number, opts: { label?: string; ttlDays?: number }): Promise<StaffInvite>;
  listInvites(companyId: number): Promise<StaffInvite[]>;
  getInviteByToken(token: string): Promise<StaffInvite | undefined>;
  consumeInvite(inviteId: number, staffId: number): Promise<void>;
  deleteInvite(companyId: number, id: number): Promise<boolean>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export class DatabaseStorage implements IStorage {
  async createCompany(
    input: InsertCompany & { password: string }
  ): Promise<Company> {
    const passwordHash = bcrypt.hashSync(input.password, 10);
    const row = db
      .insert(companies)
      .values({
        slug: input.slug,
        name: input.name,
        adminEmail: input.adminEmail,
        passwordHash,
        brandConfig: input.brandConfig ?? JSON.stringify(defaultBrandConfig),
        createdAt: Date.now(),
      })
      .returning()
      .get();
    return row;
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    return db.select().from(companies).where(eq(companies.slug, slug)).get();
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return db.select().from(companies).where(eq(companies.id, id)).get();
  }

  async verifyPassword(company: Company, password: string): Promise<boolean> {
    return bcrypt.compareSync(password, company.passwordHash);
  }

  async updateBilling(
    id: number,
    patch: Partial<{
      plan: string;
      subscriptionStatus: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      trialEndsAt: number | null;
      currentPeriodEnd: number | null;
    }>
  ): Promise<Company | undefined> {
    const row = db
      .update(companies)
      .set(patch as any)
      .where(eq(companies.id, id))
      .returning()
      .get();
    return row;
  }

  async updateBrand(id: number, brand: BrandConfig): Promise<Company | undefined> {
    const parsed = brandConfigSchema.parse(brand);
    return db
      .update(companies)
      .set({ brandConfig: JSON.stringify(parsed) })
      .where(eq(companies.id, id))
      .returning()
      .get();
  }

  async listStaff(companyId: number): Promise<Staff[]> {
    return db
      .select()
      .from(staff)
      .where(eq(staff.companyId, companyId))
      .orderBy(asc(staff.fullName))
      .all();
  }

  async getStaff(companyId: number, id: number): Promise<Staff | undefined> {
    return db
      .select()
      .from(staff)
      .where(and(eq(staff.companyId, companyId), eq(staff.id, id)))
      .get();
  }

  async getStaffBySlug(
    companySlug: string,
    staffSlug: string
  ): Promise<{ company: Company; staff: Staff } | undefined> {
    const company = await this.getCompanyBySlug(companySlug);
    if (!company) return undefined;
    const row = db
      .select()
      .from(staff)
      .where(and(eq(staff.companyId, company.id), eq(staff.slug, staffSlug)))
      .get();
    if (!row) return undefined;
    return { company, staff: row };
  }

  private async uniqueSlug(companyId: number, base: string): Promise<string> {
    let s = base || "member";
    let i = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = db
        .select()
        .from(staff)
        .where(and(eq(staff.companyId, companyId), eq(staff.slug, s)))
        .get();
      if (!existing) return s;
      i += 1;
      s = `${base}-${i}`;
    }
  }

  async createStaff(companyId: number, input: InsertStaff): Promise<Staff> {
    const baseSlug = slugify(input.fullName);
    const slug = await this.uniqueSlug(companyId, baseSlug);
    return db
      .insert(staff)
      .values({
        ...input,
        slug,
        companyId,
        createdAt: Date.now(),
      })
      .returning()
      .get();
  }

  async updateStaff(
    companyId: number,
    id: number,
    input: Partial<InsertStaff>
  ): Promise<Staff | undefined> {
    const current = await this.getStaff(companyId, id);
    if (!current) return undefined;
    return db
      .update(staff)
      .set({ ...input })
      .where(and(eq(staff.companyId, companyId), eq(staff.id, id)))
      .returning()
      .get();
  }

  async deleteStaff(companyId: number, id: number): Promise<boolean> {
    const res = db
      .delete(staff)
      .where(and(eq(staff.companyId, companyId), eq(staff.id, id)))
      .run();
    return res.changes > 0;
  }

  // ---------- Invites ----------
  async createInvite(
    companyId: number,
    opts: { label?: string; ttlDays?: number } = {}
  ): Promise<StaffInvite> {
    // 24 random bytes => 32-char URL-safe token. Enough entropy to be
    // unguessable while still fitting comfortably in a URL / QR code.
    const token = randomBytes(24).toString("base64url");
    const now = Date.now();
    const ttlDays = opts.ttlDays ?? 30;
    const expiresAt = ttlDays > 0 ? now + ttlDays * 24 * 60 * 60 * 1000 : null;
    return db
      .insert(staffInvites)
      .values({
        companyId,
        token,
        label: opts.label ?? "",
        expiresAt: expiresAt ?? undefined,
        createdAt: now,
      })
      .returning()
      .get();
  }

  async listInvites(companyId: number): Promise<StaffInvite[]> {
    return db
      .select()
      .from(staffInvites)
      .where(eq(staffInvites.companyId, companyId))
      .orderBy(desc(staffInvites.createdAt))
      .all();
  }

  async getInviteByToken(token: string): Promise<StaffInvite | undefined> {
    return db
      .select()
      .from(staffInvites)
      .where(eq(staffInvites.token, token))
      .get();
  }

  async consumeInvite(inviteId: number, staffId: number): Promise<void> {
    db.update(staffInvites)
      .set({ usedAt: Date.now(), usedStaffId: staffId })
      .where(eq(staffInvites.id, inviteId))
      .run();
  }

  async deleteInvite(companyId: number, id: number): Promise<boolean> {
    const res = db
      .delete(staffInvites)
      .where(and(eq(staffInvites.companyId, companyId), eq(staffInvites.id, id)))
      .run();
    return res.changes > 0;
  }
}

export const storage = new DatabaseStorage();

// Seed a default workspace on first boot so the site is usable immediately.
// Useful while iterating — remove or gate behind an env var for real deployments.
export async function seedDefaultWorkspace() {
  const existing = await storage.getCompanyBySlug("demo");
  if (existing) return existing;
  const company = await storage.createCompany({
    slug: "demo",
    name: "Demo Workspace",
    adminEmail: "admin@demo.local",
    brandConfig: JSON.stringify({
      ...defaultBrandConfig,
      companyDisplayName: "Demo Workspace",
      tagline: "Consistent signatures for every inbox",
      companyWebsite: "demo.local",
      companyAddress: "Brisbane, QLD",
      primaryColor: "#0f766e",
      accentColor: "#0f766e",
    }),
    password: "demo1234",
  });
  await storage.createStaff(company.id, {
    slug: "",
    fullName: "Jane Doe",
    jobTitle: "Managing Director",
    department: "",
    email: "jane@demo.local",
    phone: "+61 7 5000 1234",
    mobile: "+61 400 111 222",
    website: "demo.local",
    address: "",
    photoUrl: "",
    pronouns: "",
    bookingUrl: "",
    linkedin: "linkedin.com/in/janedoe",
    twitter: "",
    instagram: "",
    facebook: "",
  });
  await storage.createStaff(company.id, {
    slug: "",
    fullName: "Sam Rivera",
    jobTitle: "Head of Operations",
    department: "",
    email: "sam@demo.local",
    phone: "",
    mobile: "+61 400 555 000",
    website: "",
    address: "",
    photoUrl: "",
    pronouns: "they/them",
    bookingUrl: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
  });
  return company;
}
