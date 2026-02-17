import type {
  BillingInfo,
  BillingInfoDTOWithSubMeters,
  BillingInfoTableView,
  ExtendedBillingInfo,
  ExtendedBillingInfoTableView,
} from "$/types/billing-info";
import { formatDate, DateFormat, parseCalendarDate } from "$/utils/format";

export function billingInfoToDto(
  original: ExtendedBillingInfoTableView
): BillingInfoDTOWithSubMeters {
  return {
    id: original.id,
    userId: original.userId,
    date: parseCalendarDate(original.date),
    totalkWh: original.totalkWh,
    balance: original.balance,
    payPerkWh: original.payPerkWh,
    status: original.status as "Pending" | "Paid",
    createdAt: new Date(original.createdAt),
    updatedAt: new Date(original.updatedAt),
    paymentId: original.paymentId,
    subMeters: original.subMeters,
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
  // Extract calendar date components and store as YYYY-MM-DD string
  const dateObj = new Date(original.date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return {
    ...original,
    date: `${year}-${month}-${day}`,
    createdAt: formatDate(new Date(original.createdAt), {
      format: DateFormat.DateTime,
    }),
    updatedAt: formatDate(new Date(original.updatedAt), {
      format: DateFormat.DateTime,
    }),
  };
}
