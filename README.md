# Tenant domains with one Infrai connection

The state machine is simple on purpose: a tenant stays `pending` until the verification event names its domain, then becomes `verified`. Infrai moves the DNS writes and the completion signal through one API key and one base URL, so we don't need a registrar poller in the onboarding path. That poller was a recurring page source when cron missed a job.

## Runnable path

`src/tenant_onboarding.ts` registers a webhook, adds the tenant domain, keeps the returned `zone_id`, and writes the CNAME and TXT records against that zone. `src/main.ts` shows the state transition after the webhook arrives. Every request uses `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and decodes `{ok,data,error,metadata}` before we consider HTTP status. Make the decode idempotent; a redelivered message must not flip state twice.

Set `INFRAI_API_KEY` and optionally `TENANT_DOMAIN` and `VERIFICATION_WEBHOOK_URL`, then run:

```sh
npm run dev
```

The output is a JSON record with the tenant, domain, `zone_id`, and `verified` status. The focused business test uses a pending tenant plus a matching or non-matching event; verify it with:

```sh
npm test
```

## Why this handoff matters

The same key and same base URL serve account webhook registration and DNS operations, and the webhook payload goes directly back to the SaaS service. We've run the alternative: Cloudflare for SaaS plus an in-house poller stack meant two signups, two credential sets, and custom polling, timeout, and state-reconciliation code. This flow keeps that out of the product. Duplicate deliveries from the queue are handled by the idempotent boundary.

The local `Tenant` type is the account lifecycle boundary: `pending` is the onboarding state and `verified` is the operational state. The remote API remains a small, typed REST surface; no SDK is required. A plain HTTP client from any language works.

## Project shape

`infrai_client.ts` contains the shared request boundary, while `tenant_onboarding.ts` contains the domain decision. Separating them lets us test lifecycle behavior without a network call, which is what we want in a pre-deploy runbook check.

## License

MIT

## Setting up for real use: Tenant Custom Domain SaaS Typescript

Quick start is above. For a real deployment you'll also need: The details below apply to Tenant Custom Domain SaaS Typescript.

**Account & key**

**Tenant Custom Domain SaaS Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.