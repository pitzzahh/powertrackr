import type { BillingSummary, ExtendedBillingInfo } from "$/types/billing-info";
import type { AsyncState } from "$/types/state.js";
import { getExtendedBillingInfos } from "$/api/billing-info.remote";
import { getContext, setContext } from "svelte";
import { sleep } from "..";

function computeSummary(infos: ExtendedBillingInfo[]): BillingSummary {
  if (infos.length === 0) {
    return {
      current: 0,
      invested: 0,
      totalReturns: 0,
      netReturns: 0,
      oneDayReturns: 0,
      averageDailyReturn: 0,
      averageMonthlyReturn: 0,
      periodPaymentChange: 0,
      periodPaymentChangePct: 0,
    };
  }
  const latest = infos[0];
  const current = latest?.balance ?? 0;
  // Use actual payments as the authoritative amounts to compute investments and
  // returns. This matches the server-side `getBillingSummary` semantics and
  // avoids small rounding artefacts caused by rounding `payPerkWh` to cents.
  const invested = infos.reduce(
    (sum, info) =>
      sum +
      ((info.payment?.amount ?? 0) +
        info.subMeters.reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0)),
    0
  );

  // Total savings/returns are the amounts attributable to sub-meters (i.e.
  // how much sub-meter payments contributed to offsetting the main bill).
  const totalReturns = infos.reduce(
    (sum, info) =>
      sum + info.subMeters.reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0),
    0
  );

  const netReturns = invested > 0 ? (totalReturns / invested) * 100 : 0;

  // For the latest period we show the total sub-meter payments (savings) for that bill.
  const oneDayReturns = latest.subMeters.reduce((sum, sub) => sum + (sub.payment?.amount ?? 0), 0);
  const firstDate = new Date(infos[infos.length - 1].date);
  const lastDate = new Date(latest.date);
  const totalDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  const averageDailyReturn = totalReturns / totalDays;
  const totalMonths = totalDays / 30;
  const averageMonthlyReturn = totalReturns / totalMonths;

  // Period-to-period payment change (previous_totalPayment - latest_totalPayment).
  const totalPayment = (info: ExtendedBillingInfo) =>
    (info.payment?.amount ?? 0) +
    info.subMeters.reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0);
  const latestTotalPayment = totalPayment(latest);
  const prevTotalPayment = infos[1] ? totalPayment(infos[1]) : latestTotalPayment;
  const periodPaymentChange = prevTotalPayment - latestTotalPayment;
  const periodPaymentChangePct =
    prevTotalPayment > 0 ? (periodPaymentChange / prevTotalPayment) * 100 : 0;

  return {
    current,
    invested,
    totalReturns,
    netReturns,
    oneDayReturns,
    averageDailyReturn,
    averageMonthlyReturn,
    periodPaymentChange,
    periodPaymentChangePct,
  };
}

class BillingState {
  extendedBillingInfos = $state<ExtendedBillingInfo[]>([]);
  status = $state<AsyncState>("idle");
  summary = $state<BillingSummary | null>(null);
  userId = $state<string>("");
  query = $derived(getExtendedBillingInfos({ userId: this.userId }));

  setUserId(id: string) {
    this.userId = id;
  }

  setStatus(status: AsyncState) {
    this.status = status;
  }

  async refresh() {
    this.setStatus("fetching");
    return this.fetchData();
  }

  async fetchData() {
    try {
      const { value } = await this.query;
      this.extendedBillingInfos = value as ExtendedBillingInfo[];
      this.summary = computeSummary(this.extendedBillingInfos);
      this.status = "success";
    } catch (error) {
      console.error(error);
      this.status = "error";
      this.extendedBillingInfos = [];
      this.summary = null;
    }
  }
}

const SYMBOL_KEY = "billing-store";

/**
 * Instantiates a new `BillingState` instance and sets it in the context.
 *
 * @returns The `BillingState` instance.
 */
export function setBillingStore(): BillingState {
  return setContext(Symbol.for(SYMBOL_KEY), new BillingState());
}

/**
 * Retrieves the `BillingState` instance from the context. This is a class instance,
 * so you cannot destructure it.
 * @returns The `BillingState` instance.
 */
export function useBillingStore(): BillingState {
  return getContext(Symbol.for(SYMBOL_KEY));
}
