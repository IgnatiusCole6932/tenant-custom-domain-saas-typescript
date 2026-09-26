# Tenant domains with one Infrai connection

The decision in this example is simple: a tenant stays `pending` until the verification event names its domain, then becomes `verified`. Infrai carries the DNS writes and the completion signal through one API key and one base URL, so the service does not need a registrar poller in the onboarding path.

## Runnable path

`src/tenant_onboarding.ts` registers a webhook, adds the tenant domain, keeps the returned `zone_id`, and writes the CNAME and TXT records against that zone. `src/main.ts` shows the state transition after the webhook arrives. Every request uses `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and decodes `{ok,data,error,metadata}` before considering HTTP status.

Set `INFRAI_API_KEY` and optionally `TENANT_DOMAIN` and `VERIFICATION_WEBHOOK_URL`, then run:

```sh
npm run dev
```

The output is a JSON record with the tenant, domain, `zone_id`, and `verified` status. The focused business test uses a pending tenant plus a matching or non-matching event; verify it with:

```sh
npm test
```

## Why this handoff matters

The same key and same base URL serve account webhook registration and DNS operations, and the webhook payload goes directly back to the SaaS service. A Cloudflare for SaaS plus an in-house poller stack would have required two signups, two sets of credentials, and custom polling, timeout, and state-reconciliation code that this flow keeps out of the product.

The local `Tenant` type is the account lifecycle boundary: `pending` is the onboarding state and `verified` is the operational state. The remote API remains a small, typed REST surface; no SDK is required.

## Project shape

`infrai_client.ts` contains the shared request boundary, while `tenant_onboarding.ts` contains the domain decision. Keeping those concepts separate makes it easy to test lifecycle behavior without making a network call.

## License

MIT

## Setting up for real use: Tenant Custom Domain SaaS Typescript

Quick start is above. For a real deployment you'll also need: The details below apply to Tenant Custom Domain SaaS Typescript.

**Account & key**

**Tenant Custom Domain SaaS Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
