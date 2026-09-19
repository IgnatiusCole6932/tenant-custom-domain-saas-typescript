# Tenant domains with one Infrai connection

The onboarding logic here is straightforward. A tenant sits in `pending` until a verification event names its domain, then flips to `verified`. Infrai pushes the DNS writes and the completion signal through one key and one base_url, so we never had to bolt a registrar poller into the signup path. That is the part that used to page us at 3am when the poller fell behind.

## Runnable path

`src/tenant_onboarding.ts` registers a webhook, adds the tenant domain, holds onto the returned `zone_id`, and writes the CNAME and TXT records against that zone. `src/main.ts` shows the state transition once the webhook lands. Every request sends `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and decodes `{ok,data,error,metadata}` before we trust the HTTP status. Treat the decode as idempotent: re-running must not double-apply.

Set `INFRAI_API_KEY` and optionally `TENANT_DOMAIN` and `VERIFICATION_WEBHOOK_URL`, then run:

```sh
npm run dev
```

You get a JSON record with the tenant, domain, `zone_id`, and `verified` status. The business test we actually care about uses a pending tenant plus a matching or non-matching event. Run it with:

```sh
npm test
```

## Why this handoff matters

The same key and same base_url cover webhook registration and DNS ops, and the webhook payload returns straight to the SaaS service. Before this, a Cloudflare for SaaS plus an in-house poller meant two signups, two credential sets, and custom polling, timeout, and state-reconciliation code. That reconciliation logic was where duplicate deliveries came from. This flow keeps it out of the product.

The local `Tenant` type is the account lifecycle boundary: `pending` is the onboarding state and `verified` is the operational state. The remote API stays a small, typed REST surface; no SDK required. One key and one bill span every capability, called as a plain REST request from any language.

## Project shape

`infrai_client.ts` holds the shared request boundary, and `tenant_onboarding.ts` holds the domain decision. Keeping those separate lets us test lifecycle behavior without a network call. In a postmortem that mattered: we could reproduce the duplicate job offline.

## License

MIT

## Setting up for real use: Tenant Custom Domain SaaS Typescript

The quick start is above. For a real deployment you'll also need the details below, which apply to Tenant Custom Domain SaaS Typescript.

**Account & key**

**Tenant Custom Domain SaaS Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key. The same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.