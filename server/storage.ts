import { companies, staff, defaultBrandConfig, brandConfigSchema } from "@shared/schema";
import type {
  Company,
  InsertCompany,
  Staff,
  InsertStaff,
  BrandConfig,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const sqlite = new Database("data.db");
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
`);

export interface IStorage {
  createCompany(
    input: InsertCompany & { password: string }
  ): Promise<Company>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  getCompany(id: number): Promise<Company | undefined>;
  verifyPassword(company: Company, password: string): Promise<boolean>;
  updateBrand(id: number, brand: BrandConfig): Promise<Company | undefined>;

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
}

export const storage = new DatabaseStorage();
