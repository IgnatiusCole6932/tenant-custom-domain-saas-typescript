import { InfraiClient } from "./infrai_client.ts";
import { onboardTenant, applyVerificationEvent } from "./tenant_onboarding.ts";

const tenant = await onboardTenant(new InfraiClient(), { tenantId: "acme", domain: process.env.TENANT_DOMAIN ?? "app.acme.test", webhookUrl: process.env.VERIFICATION_WEBHOOK_URL ?? "https://saas.example.com/hooks/infrai" });
const verified = applyVerificationEvent(tenant, { domain: tenant.domain, verified: true });
console.log(JSON.stringify({ tenant: verified.id, domain: verified.domain, status: verified.status, zone_id: verified.zoneId }));
