# Signaturely

Consistent email signatures for every person on your team. A product of Elapid Group Pty Ltd (Brisbane, Australia).

## Local development

```bash
npm install
npm run dev
```

App runs on `http://localhost:5000`. SQLite database lives at `./data.db`.

## Production build

```bash
npm run build         # bundles client -> dist/public, server -> dist/index.cjs
node dist/index.cjs   # serves both from a single process on $PORT
```

## Deployment (Render)

`render.yaml` provisions:

- Starter web service with autoDeploy from `main`
- 1 GB persistent disk mounted at `/var/data` (SQLite lives there)
- Session secret auto-generated on first deploy

Required env vars to set in the Render dashboard (`sync: false` in `render.yaml`):

| Variable | Where to get it |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key (`sk_live_…` or `sk_test_…`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys → Publishable key (`pk_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → your endpoint → Signing secret (`whsec_…`) |
| `STRIPE_PRICE_STARTER` | Stripe → Products → Starter → recurring price id (`price_…`) |
| `STRIPE_PRICE_GROWTH` | Stripe → Products → Growth → recurring price id |
| `STRIPE_PRICE_BUSINESS` | Stripe → Products → Business → recurring price id |

Webhook endpoint on Stripe: `https://signaturely.onrender.com/api/billing/webhook`
Events to send: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Plans

Defined in `shared/schema.ts`. All prices are monthly USD.

| Plan | Price | Seat cap |
| --- | --- | --- |
| Free | $0 | 1 |
| Starter | $10 | 10 |
| Growth | $20 | 50 |
| Business | $30 | Unlimited |

Free-plan signatures render with a small Signaturely watermark.
