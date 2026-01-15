import type { BillingSummary, ExtendedBillingInfo } from "$/types/billing-info";
import type { Status } from "$/types/state.js";
import { getExtendedBillingInfos } from "$/api/billing-info.remote";

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
    };
  }
  const latest = infos[0];
  const current = latest?.balance ?? 0;
  const invested = infos.reduce((sum, info) => sum + info.totalkWh * info.payPerkWh, 0);
  const totalReturns = infos.reduce(
    (sum, info) =>
      sum +
      (info.totalkWh * info.payPerkWh -
        ((info.payment?.amount ?? 0) +
          info.subMeters.reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0))),
    0
  );
  const netReturns = invested > 0 ? (totalReturns / invested) * 100 : 0;
  const oneDayReturns =
    latest.totalkWh * latest.payPerkWh -
    ((latest.payment?.amount ?? 0) +
      latest.subMeters.reduce((sum, sub) => sum + (sub.payment?.amount ?? 0), 0));
  const firstDate = new Date(infos[infos.length - 1].date);
  const lastDate = new Date(latest.date);
  const totalDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  const averageDailyReturn = totalReturns / totalDays;
  const totalMonths = totalDays / 30;
  const averageMonthlyReturn = totalReturns / totalMonths;
  return {
    current,
    invested,
    totalReturns,
    netReturns,
    oneDayReturns,
    averageDailyReturn,
    averageMonthlyReturn,
  };
}

class BillingStore {
  extendedBillingInfos = $state<ExtendedBillingInfo[]>([]);
  status = $state<Status>("idle");
  summary = $state<BillingSummary | null>(null);
  userId = $state<string | null>(null);

  setUserId(id: string) {
    this.userId = id;
  }

  refresh() {
    return this.fetchData();
  }

  async fetchData() {
    if (!this.userId) return;
    try {
      this.status = "fetching";
      const { value } = await getExtendedBillingInfos({ userId: this.userId });
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

export const billingStore = new BillingStore();
