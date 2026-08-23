import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import {
  signupSchema,
  loginSchema,
  brandConfigSchema,
  insertStaffSchema,
  defaultBrandConfig,
} from "@shared/schema";
import type { BrandConfig, Company, Staff } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    companyId?: number;
  }
}

// Shape returned to the client (never leak the password hash).
function publicCompany(c: Company) {
  const brand = safeParseBrand(c.brandConfig);
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    adminEmail: c.adminEmail,
    brand,
  };
}

function safeParseBrand(raw: string): BrandConfig {
  try {
    return brandConfigSchema.parse(JSON.parse(raw));
  } catch {
    return defaultBrandConfig;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.companyId) {
    return res.status(401).json({ message: "Not signed in" });
  }
  next();
}

export async function registerRoutes(
  httpServer: ReturnType<typeof createServer>,
  app: Express
): Promise<Server> {
  const MemoryStore = createMemoryStore(session);
  app.use(
    session({
      name: "sig.sid",
      secret: process.env.SESSION_SECRET || "dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      },
    })
  );

  // --- Auth ---
  app.post("/api/auth/signup", async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }
    const existing = await storage.getCompanyBySlug(parsed.data.slug);
    if (existing) {
      return res.status(409).json({ message: "That workspace slug is taken" });
    }
    const company = await storage.createCompany({
      slug: parsed.data.slug,
      name: parsed.data.companyName,
      adminEmail: parsed.data.adminEmail,
      brandConfig: JSON.stringify({
        ...defaultBrandConfig,
        companyDisplayName: parsed.data.companyName,
      }),
      password: parsed.data.password,
    });
    req.session.companyId = company.id;
    res.json(publicCompany(company));
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }
    const company = await storage.getCompanyBySlug(parsed.data.slug);
    if (!company) {
      return res.status(401).json({ message: "Invalid workspace or password" });
    }
    const ok = await storage.verifyPassword(company, parsed.data.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid workspace or password" });
    }
    req.session.companyId = company.id;
    res.json(publicCompany(company));
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("sig.sid");
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.companyId) return res.status(401).json({ message: "Not signed in" });
    const company = await storage.getCompany(req.session.companyId);
    if (!company) return res.status(401).json({ message: "Not signed in" });
    res.json(publicCompany(company));
  });

  // --- Brand config ---
  app.get("/api/brand", requireAuth, async (req, res) => {
    const company = await storage.getCompany(req.session.companyId!);
    if (!company) return res.status(404).json({ message: "Not found" });
    res.json(safeParseBrand(company.brandConfig));
  });

  app.put("/api/brand", requireAuth, async (req, res) => {
    const parsed = brandConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid brand config" });
    }
    const updated = await storage.updateBrand(req.session.companyId!, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(safeParseBrand(updated.brandConfig));
  });

  // --- Staff CRUD ---
  app.get("/api/staff", requireAuth, async (req, res) => {
    const list = await storage.listStaff(req.session.companyId!);
    res.json(list);
  });

  app.post("/api/staff", requireAuth, async (req, res) => {
    const parsed = insertStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }
    const row = await storage.createStaff(req.session.companyId!, parsed.data);
    res.json(row);
  });

  app.put("/api/staff/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const parsed = insertStaffSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }
    const row = await storage.updateStaff(req.session.companyId!, id, parsed.data);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });

  app.delete("/api/staff/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const ok = await storage.deleteStaff(req.session.companyId!, id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // --- Public share endpoint (no auth) ---
  // Used by /#/s/:companySlug/:staffSlug pages so staff can grab their sig.
  app.get("/api/public/:companySlug/:staffSlug", async (req, res) => {
    const found = await storage.getStaffBySlug(
      req.params.companySlug,
      req.params.staffSlug
    );
    if (!found) return res.status(404).json({ message: "Not found" });
    res.json({
      brand: safeParseBrand(found.company.brandConfig),
      staff: found.staff,
      company: { name: found.company.name, slug: found.company.slug },
    });
  });

  return httpServer;
}
