import type {
  BillingInfo,
  BillingInfoDTOWithSubMeters,
  BillingInfoTableView,
  ExtendedBillingInfo,
  ExtendedBillingInfoTableView,
  Status,
} from "$/types/billing-info";
import { formatDate, DateFormat } from "$/utils/format";
import { omit } from "$/utils/mapper";

export function billingInfoToDto(
  original: ExtendedBillingInfoTableView
): BillingInfoDTOWithSubMeters {
  return {
    id: original.id,
    userId: original.userId,
    date: original.date,
    totalkWh: original.totalkWh,
    balance: original.balance,
    payPerkWh: original.payPerkWh,
    status: original.status as Status,
    createdAt: new Date(original.createdAt),
    updatedAt: new Date(original.updatedAt),
    paymentId: original.paymentId,
    subMeters: original.subMeters.map((s) => ({
      ...omit(s, ["payment"]),
      status: s.status as Status,
    })),
  };
}

export function billingInfoToTableView(original: BillingInfo): BillingInfoTableView {
  return {
    ...original,
    date: formatDate(new Date(original.date)),
    createdAt: formatDate(new Date(original.createdAt), {
      format: DateFormat.DateTime,
    }),
    updatedAt: formatDate(new Date(original.updatedAt), {
      format: DateFormat.DateTime,
    }),
  };
}

export function extendedBillingInfoToTableView(
  original: ExtendedBillingInfo
): ExtendedBillingInfoTableView {
  return {
    ...original,
    dateFormatted: formatDate(original.date),
    createdAtFormatted: formatDate(new Date(original.createdAt), {
      format: DateFormat.DateTime,
    }),
    updatedAtFormatted: formatDate(new Date(original.updatedAt), {
      format: DateFormat.DateTime,
    }),
  };
}
