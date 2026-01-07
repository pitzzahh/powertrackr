import type {
  BillingInfo,
  BillingInfoDTO,
  BillingInfoTableView,
  ExtendedBillingInfo,
  ExtendedBillingInfoTableView,
} from "$/types/billing-info";
import { DateFormat, formatDate } from "$/utils/format";

export function billingInfoToDto(original: BillingInfo): BillingInfoDTO {
  return {
    id: original.id,
    date: new Date(original.date),
    totalkWh: original.totalKWh,
    balance: original.balance,
    payPerkWh: original.payPerKwh,
    status: original.status as "Pending" | "Paid",
    subReadingLatest: 0,
  };
}

export function billingInfoToTableView(original: BillingInfo): BillingInfoTableView {
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

export function extendedBillingInfoToTableView(
  original: ExtendedBillingInfo
): ExtendedBillingInfoTableView {
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
