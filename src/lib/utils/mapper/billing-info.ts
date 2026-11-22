import type {
  BillingInfoWithSubMeters,
  ExtendedBillingInfo,
  ExtendedBillingInfoTableView,
} from "#lib/types/billing-info.js";
import type { Status } from "#lib/types/billing-info.js";
import { formatDate, DateFormat } from "#lib/utils/format.js";
import { omit } from "#lib/utils/mapper.js";

export function billingInfoToDto(original: ExtendedBillingInfoTableView): BillingInfoWithSubMeters {
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
      tenantUserId: s.tenantUserId,
      tenantName: s.tenantName,
    })),
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
