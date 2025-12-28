import type { BillingInfo, BillingInfoDTO } from "$/types/billing-info";

export function billingInfotoDto(original: BillingInfo): BillingInfoDTO {
  return {
    id: original.id,
    date: new Date(original.date),
    totalKwh: original.totalKwh,
    subKwh: original.subKwh ?? 0,
    payPerKwh: original.payPerKwh,
    subReadingOld: original.subReadingOld ?? 0,
    subReadingLatest: original.subReadingLatest || 0,
    balance: original.balance,
    payment: -1,
    subPayment: -1,
    status: original.status.toLowerCase() as "pending" | "paid",
  };
}
