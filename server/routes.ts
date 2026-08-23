import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage, seedDefaultWorkspace } from "./storage";
import {
  signupSchema,
  loginSchema,
  brandConfigSchema,
  insertStaffSchema,
  publicJoinSchema,
  defaultBrandConfig,
  PLANS,
} from "@shared/schema";
import type { BrandConfig, Company, Staff, PlanId } from "@shared/schema";
import Stripe from "stripe";

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
    plan: c.plan as PlanId,
    subscriptionStatus: c.subscriptionStatus,
    trialEndsAt: c.trialEndsAt,
    currentPeriodEnd: c.currentPeriodEnd,
  };
}

// A workspace can use the app if it is on the free plan (with seat cap
// enforcement applied elsewhere) OR has an active subscription. New
// workspaces default to the free plan; paid features unlock only after
// checkout completes and Stripe reports `active`.
function isEntitled(c: Company): boolean {
  if (c.plan === "free") return true;
  if (c.subscriptionStatus === "active") return true;
  return false;
}

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-06-20" as any });
}

function safeParseBrand(raw: string): BrandConfig {
  try {
    return brandConfigSchema.parse(JSON.parse(raw));
  } catch {
    return defaultBrandConfig;
  }
}

// While DEMO_MODE=true, treat any unauthenticated request as if the visitor
// were signed into the seeded demo workspace. Bypasses cross-site cookie
// restrictions in the sandbox-preview iframe so /admin is reachable during
// preview testing without a real login. Flip DEMO_MODE off before shipping.
const DEMO_MODE = (process.env.DEMO_MODE ?? "true") !== "false";

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.companyId && DEMO_MODE) {
    const demo = await storage.getCompanyBySlug("demo");
    if (demo) {
      req.session.companyId = demo.id;
    }
  }
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
  // Trust the sandbox / Perplexity reverse proxy so req.secure reflects the
  // client-side TLS termination and secure cookies get emitted correctly.
  app.set("trust proxy", 1);
  app.use(
    session({
      name: "sig.sid",
      secret: process.env.SESSION_SECRET || "dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: {
        httpOnly: true,
        // Cross-site iframe (Perplexity host) needs SameSite=None + Secure for the
        // session cookie to be sent with fetch({credentials:'include'}).
        sameSite: "none",
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      },
      proxy: true, // trust the reverse proxy that terminates TLS in front of us
    })
  );

  // Seed the demo workspace on first request (idempotent). Handy for the
  // "Try the demo" button on the landing page — grants read-only-feel access
  // to a workspace populated with sample staff.
  await seedDefaultWorkspace().catch((e) =>
    console.error("seed failed:", e)
  );

  // --- Demo login ---
  // Public one-click into the seeded demo workspace. Kept for the landing
  // page's "Try the demo" CTA so people can see the app before signing up.
  app.post("/api/auth/demo", async (req, res) => {
    const company = await storage.getCompanyBySlug("demo");
    if (!company) return res.status(500).json({ message: "Demo workspace not seeded" });
    req.session.companyId = company.id;
    res.json(publicCompany(company));
  });

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
    // New workspaces start on the Free plan. If they clicked a paid plan
    // CTA, the client hands them straight to Stripe checkout after signup.
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
    // DEMO_MODE: if no session, transparently bind to the demo workspace so
    // the client's initial /me call reports a signed-in state.
    if (!req.session.companyId && DEMO_MODE) {
      const demo = await storage.getCompanyBySlug("demo");
      if (demo) {
        req.session.companyId = demo.id;
        return res.json(publicCompany(demo));
      }
    }
    if (!req.session.companyId) {
      return res.status(401).json({ message: "Not signed in" });
    }
    const company = await storage.getCompany(req.session.companyId);
    if (!company) return res.status(401).json({ message: "Not signed in" });
    res.json(publicCompany(company));
  });

  // --- Health check (public, unauth) ---
  // Used by Render for health probes and by anyone verifying the service is up.
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  // --- Plans (public) ---
  // Static pricing catalog. Server renders it so pricing lives in one place.
  app.get("/api/plans", (_req, res) => {
    res.json({ plans: PLANS, currency: "AUD" });
  });

  // --- Stripe: create a Checkout session ---
  app.post("/api/billing/checkout", requireAuth, async (req, res) => {
    const stripe = stripeClient();
    if (!stripe) {
      return res
        .status(503)
        .json({ message: "Payments not configured. Set STRIPE_SECRET_KEY." });
    }
    const plan = String(req.body?.plan || "") as PlanId;
    if (!(plan in PLANS) || plan === "free") {
      return res.status(400).json({ message: "Unknown plan" });
    }
    const priceEnvKey = `STRIPE_PRICE_${plan.toUpperCase()}`;
    const priceId = process.env[priceEnvKey];
    if (!priceId) {
      return res
        .status(503)
        .json({ message: `Missing ${priceEnvKey}. Configure a Stripe price ID for the ${plan} plan.` });
    }
    const company = await storage.getCompany(req.session.companyId!);
    if (!company) return res.status(404).json({ message: "Not found" });

    // Reuse an existing Stripe customer id if we have one; otherwise let
    // Checkout create one via `customer_email`.
    const base = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: company.stripeCustomerId || undefined,
      customer_email: company.stripeCustomerId ? undefined : company.adminEmail,
      client_reference_id: String(company.id),
      metadata: { companyId: String(company.id), plan },
      subscription_data: {
        metadata: { companyId: String(company.id), plan },
        trial_period_days: 14,
      },
      success_url: `${base}/#/admin?billing=success`,
      cancel_url: `${base}/#/pricing?billing=cancelled`,
      allow_promotion_codes: true,
    });
    res.json({ url: session.url });
  });

  // --- Stripe: open the customer billing portal ---
  app.post("/api/billing/portal", requireAuth, async (req, res) => {
    const stripe = stripeClient();
    if (!stripe) return res.status(503).json({ message: "Payments not configured" });
    const company = await storage.getCompany(req.session.companyId!);
    if (!company?.stripeCustomerId) {
      return res.status(400).json({ message: "No Stripe customer for this workspace yet" });
    }
    const base = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
    const portal = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${base}/#/admin`,
    });
    res.json({ url: portal.url });
  });

  // --- Stripe: webhook ---
  // Mounted with a raw-body parser at server/index.ts so signature
  // verification works against the untouched payload.
  app.post("/api/billing/webhook", async (req, res) => {
    const stripe = stripeClient();
    const sig = req.headers["stripe-signature"] as string | undefined;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret || !sig) {
      return res.status(200).json({ ok: true, skipped: "unconfigured" });
    }
    let event: Stripe.Event;
    try {
      const raw = (req as any).rawBody;
      const payload = Buffer.isBuffer(raw)
        ? raw
        : typeof raw === "string"
        ? Buffer.from(raw)
        : Buffer.from(JSON.stringify(req.body || {}));
      event = stripe.webhooks.constructEvent(payload, sig, secret);
    } catch (err: any) {
      return res.status(400).json({ message: `Webhook signature failed: ${err.message}` });
    }
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const sess = event.data.object as Stripe.Checkout.Session;
          const companyId = Number(sess.client_reference_id);
          const plan = (sess.metadata?.plan as PlanId) || "starter";
          if (Number.isFinite(companyId)) {
            await storage.updateBilling(companyId, {
              plan,
              stripeCustomerId: String(sess.customer || ""),
              stripeSubscriptionId: String(sess.subscription || ""),
              subscriptionStatus: "active",
            });
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.created":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const companyId = Number(sub.metadata?.companyId);
          const plan = (sub.metadata?.plan as PlanId) || undefined;
          if (Number.isFinite(companyId)) {
            await storage.updateBilling(companyId, {
              subscriptionStatus: sub.status,
              currentPeriodEnd: sub.current_period_end
                ? sub.current_period_end * 1000
                : null,
              ...(plan ? { plan } : {}),
              ...(sub.status === "canceled" ? { plan: "free" } : {}),
            });
          }
          break;
        }
      }
    } catch (e) {
      console.error("webhook handler error:", e);
    }
    res.json({ ok: true });
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
    // Seat-cap enforcement: free workspaces can only have 1 staff member, and
    // paid workspaces are capped at their plan's seatCap.
    const company = await storage.getCompany(req.session.companyId!);
    if (!company) return res.status(404).json({ message: "Workspace not found" });
    const existing = await storage.listStaff(company.id);
    const cap = PLANS[(company.plan as PlanId) ?? "free"]?.seatCap ?? 1;
    if (existing.length >= cap) {
      return res.status(402).json({
        message: `Your ${company.plan} plan is limited to ${cap} staff. Upgrade to add more.`,
        code: "seat_cap",
        plan: company.plan,
        cap,
      });
    }
    if (!isEntitled(company)) {
      return res.status(402).json({
        message: "Your subscription isn't active. Complete checkout to keep adding staff.",
        code: "subscription_inactive",
      });
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

  // --- Staff invites (auth) ---
  // Admins mint a shareable single-use link that lets the recipient add
  // themselves as a staff member without needing a login.
  app.get("/api/invites", requireAuth, async (req, res) => {
    const list = await storage.listInvites(req.session.companyId!);
    res.json(list);
  });

  app.post("/api/invites", requireAuth, async (req, res) => {
    const label = typeof req.body?.label === "string" ? req.body.label.slice(0, 120) : "";
    const invite = await storage.createInvite(req.session.companyId!, { label });
    res.json(invite);
  });

  app.delete("/api/invites/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const ok = await storage.deleteInvite(req.session.companyId!, id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // --- Public invite (no auth) ---
  // Recipient opens /#/join/:token, reads the invite context, then submits
  // their staff profile. On success we return the share URL slug so we can
  // show them their own signature.
  app.get("/api/public/invite/:token", async (req, res) => {
    const invite = await storage.getInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ message: "Invite not found" });
    if (invite.usedAt)
      return res.status(410).json({ message: "This invite has already been used" });
    if (invite.expiresAt && invite.expiresAt < Date.now())
      return res.status(410).json({ message: "This invite has expired" });
    const company = await storage.getCompany(invite.companyId);
    if (!company) return res.status(404).json({ message: "Workspace not found" });
    res.json({
      company: { name: company.name, slug: company.slug },
      brand: safeParseBrand(company.brandConfig),
      invite: { label: invite.label, expiresAt: invite.expiresAt },
    });
  });

  app.post("/api/public/invite/:token", async (req, res) => {
    const invite = await storage.getInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ message: "Invite not found" });
    if (invite.usedAt)
      return res.status(410).json({ message: "This invite has already been used" });
    if (invite.expiresAt && invite.expiresAt < Date.now())
      return res.status(410).json({ message: "This invite has expired" });
    const parsed = publicJoinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }
    const company = await storage.getCompany(invite.companyId);
    if (!company) return res.status(404).json({ message: "Workspace not found" });
    const created = await storage.createStaff(invite.companyId, {
      slug: "", // storage layer derives a unique slug from the full name
      ...parsed.data,
    });
    await storage.consumeInvite(invite.id, created.id);
    res.json({
      staff: created,
      company: { name: company.name, slug: company.slug },
    });
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
      plan: found.company.plan,
    });
  });

  return httpServer;
}
