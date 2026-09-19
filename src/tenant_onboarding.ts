import { InfraiClient } from "./infrai_client.ts";

export type Tenant = { id: string; domain: string; status: "pending" | "verified"; zoneId?: string };

export async function onboardTenant(client: InfraiClient, input: { tenantId: string; domain: string; webhookUrl: string }): Promise<Tenant> {
  const tenant: Tenant = { id: input.tenantId, domain: input.domain, status: "pending" };
  await client.request("/v1/account/webhooks/register", "POST", { url: input.webhookUrl, events: ["dns.domain.verified"], description: "Tenant domain verification" });
  const added = await client.request<{ zone_id: string }>("/v1/dns/domain/add", "POST", { domain: input.domain, metadata: { tenant_id: input.tenantId } });
  tenant.zoneId = added.zone_id;
  await client.request("/v1/dns/record/upsert", "PUT", { zone_id: tenant.zoneId, record_type: "CNAME", name: "app", content: "edge.example.com", metadata: { tenant_id: input.tenantId } });
  await client.request("/v1/dns/record/upsert", "PUT", { zone_id: tenant.zoneId, record_type: "TXT", name: "_verify", content: `tenant=${input.tenantId}`, metadata: { tenant_id: input.tenantId } });
  return tenant;
}

export function applyVerificationEvent(tenant: Tenant, event: { domain: string; verified: boolean }): Tenant {
  if (event.domain === tenant.domain && event.verified) return { ...tenant, status: "verified" };
  return tenant;
}
