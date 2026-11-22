import type { ExtendedBillingInfo } from "#lib/types/billing-info.js";
import type { Payment } from "#lib/types/payment.js";
import type { ExportPreview } from "#lib/types/import.js";

const iso = (value: Date | string | null | undefined) => {
  if (value == null) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
};

const toPayment = (p: Payment) => ({ id: p.id, amount: p.amount, date: iso(p.date) });

/**
 * A backup of the owner's billings. `items` re-imports through the import
 * flow (sub-meters by tenant name); the other arrays are the full rows.
 */
export function buildExport(infos: ExtendedBillingInfo[]) {
  const payments = new Map<string, ReturnType<typeof toPayment>>();
  const items = [];
  const billingInfos = [];
  const subMeters = [];

  for (const info of infos) {
    const date = iso(info.date) ?? iso(info.createdAt) ?? new Date().toISOString();
    const billPayments = [info.payment, ...info.subMeters.map((s) => s.payment)]
      .filter((p): p is Payment => !!p?.id)
      .map(toPayment);
    for (const p of billPayments) payments.set(p.id, p);

    items.push({
      date,
      totalkWh: Number(info.totalkWh ?? 0),
      balance: Number(info.balance ?? 0),
      status: info.status ?? "pending",
      subMeters: info.subMeters.map((s) => ({
        label: s.tenantName,
        status: s.status ?? "pending",
        // A pending sub-meter has no reading; omit it so import keeps it pending.
        ...(s.reading != null && { reading: Number(s.reading) }),
      })),
      ...(billPayments.length > 0 && { payments: billPayments }),
    });

    billingInfos.push({
      id: info.id,
      userId: info.userId,
      date,
      totalkWh: Number(info.totalkWh ?? 0),
      balance: Number(info.balance ?? 0),
      status: info.status,
      payPerkWh: info.payPerkWh,
      paymentId: info.payment?.id ?? null,
      createdAt: iso(info.createdAt),
      updatedAt: iso(info.updatedAt),
    });

    for (const s of info.subMeters) {
      subMeters.push({
        id: s.id,
        billingInfoId: s.billingInfoId ?? info.id,
        subkWh: s.subkWh ?? undefined,
        tenantName: s.tenantName,
        reading: s.reading,
        paymentId: s.payment?.id ?? null,
        createdAt: iso(s.createdAt),
        updatedAt: iso(s.updatedAt),
      });
    }
  }

  const payload = { items, billingInfos, subMeters, payments: [...payments.values()] };
  const preview: ExportPreview = {
    billingInfos: billingInfos.length,
    subMeters: subMeters.length,
    payments: payload.payments.length,
  };
  return { payload, preview };
}
