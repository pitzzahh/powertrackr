// Plain inserts for seeding test data. Production writes these rows through
// D1 batches (createBillingInfoLogic, finalize, submitReading), never one by one.
import { db } from "#lib/server/db/index.js";
import { billingInfo, payment, tenantReading } from "#lib/server/db/schema/index.js";
import type {
  BillingInfo,
  NewBillingInfo,
  NewTenantReading,
  TenantReading,
} from "#lib/types/billing-info.js";
import type { NewPayment, Payment } from "#lib/types/payment.js";

type Seeded<T> = { valid: boolean; value: T[] };

const withId = <T extends object>(rows: T[]) =>
  rows.map((row) => ({ id: crypto.randomUUID(), ...row }));

export async function addBillingInfo(
  rows: Omit<NewBillingInfo, "id">[]
): Promise<Seeded<BillingInfo>> {
  const value = rows.length ? await db().insert(billingInfo).values(withId(rows)).returning() : [];
  return { valid: value.length === rows.length, value };
}

export async function addPayment(rows: Omit<NewPayment, "id">[]): Promise<Seeded<Payment>> {
  const value = rows.length ? await db().insert(payment).values(withId(rows)).returning() : [];
  return { valid: value.length === rows.length, value };
}

export async function addTenantReading(
  rows: Omit<NewTenantReading, "id">[]
): Promise<Seeded<TenantReading>> {
  const value = rows.length
    ? await db().insert(tenantReading).values(withId(rows)).returning()
    : [];
  return { valid: value.length === rows.length, value };
}
