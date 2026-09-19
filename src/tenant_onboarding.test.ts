import assert from "node:assert/strict";
import { applyVerificationEvent, type Tenant } from "./tenant_onboarding.ts";

const pending: Tenant = { id: "t1", domain: "portal.example.com", status: "pending", zoneId: "zone-1" };
assert.equal(applyVerificationEvent(pending, { domain: "portal.example.com", verified: true }).status, "verified");
assert.equal(applyVerificationEvent(pending, { domain: "other.example.com", verified: true }).status, "pending");
console.log("tenant verification decision: ok");
