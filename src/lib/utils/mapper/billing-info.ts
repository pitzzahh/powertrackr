import type {
  BillingInfo,
  BillingInfoDTO,
  BillingInfoTableView,
} from "$/types/billing-info";
import { DateFormat, formatDate } from "$/utils/format";

export function billingInfoToDto(original: BillingInfo): BillingInfoDTO {
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
    createdAt: original.createdAt,
    updatedAt: original.updatedAt,
  };
}

export function billingInfoToTableView(
  original: BillingInfo,
): BillingInfoTableView {
  return {
    ...original,
    date: formatDate(new Date(original.date)),
    createdAt: formatDate(original.createdAt ?? new Date(), {
      format: DateFormat.DateTime,
    }),
    updatedAt: formatDate(original.updatedAt ?? new Date(), {
      format: DateFormat.DateTime,
    }),
  };
}
