import type { AsyncState } from "$/types/state.js";
import { getExtendedBillingInfos } from "$/api/billing-info.remote";
import { getContext, setContext } from "svelte";
import type { ExtendedBillingInfo } from "$/types/billing-info";

type ConsumptionSummary = {
  totalKWh: number;
  averageDailyKWh: number;
  totalSubMeters: number;
  latestReading: number;
};

export function computeConsumptionSummary(infos: ExtendedBillingInfo[]): ConsumptionSummary {
  if (infos.length === 0) {
    return {
      totalKWh: 0,
      averageDailyKWh: 0,
      totalSubMeters: 0,
      latestReading: 0,
    };
  }

  // Total consumption should always be derived from the billing record's `totalkWh`.
  // This ensures metrics match the chart data (which uses `totalkWh`) and works
  // whether or not sub-meters are present.
  const totalKWh = infos.reduce((sum, info) => sum + (info.totalkWh ?? 0), 0);

  // Collect all sub-meters (if any) and count unique ones.
  const allSubMeters = infos.flatMap((info) => info.subMeters || []);
  const totalSubMeters = new Set(allSubMeters.map((sub) => sub.id ?? sub.label)).size;

  const firstDate = new Date(infos[infos.length - 1].date);
  const lastDate = new Date(infos[0].date);
  const totalDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  const averageDailyKWh = totalKWh / totalDays;

  const latestInfo = infos[0];
  // Use the billing record's totalkWh as the latest reading so the metric matches
  // the total consumption shown in the chart and works when no sub-meters exist.
  const latestReading = latestInfo.totalkWh ?? 0;

  return {
    totalKWh,
    averageDailyKWh,
    totalSubMeters,
    latestReading,
  };
}

class ConsumptionState {
  extendedBillingInfos = $state<ExtendedBillingInfo[]>([]);
  status = $state<AsyncState>("idle");
  summary = $state<ConsumptionSummary | null>(null);
  userId = $state<string | null>(null);

  setUserId(id: string) {
    this.userId = id;
  }

  setStatus(status: AsyncState) {
    this.status = status;
  }

  refresh() {
    this.setStatus("fetching");
    this.fetchData();
  }

  async fetchData() {
    if (!this.userId) return;
    try {
      const { value } = await getExtendedBillingInfos({ userId: this.userId });
      this.extendedBillingInfos = value as ExtendedBillingInfo[];
      this.summary = computeConsumptionSummary(this.extendedBillingInfos);
      this.status = "success";
    } catch (error) {
      console.error(error);
      this.status = "error";
      this.extendedBillingInfos = [];
      this.summary = null;
    }
  }
}

const SYMBOL_KEY = "consumption-store";

/**
 * Instantiates a new `ConsumptionState` instance and sets it in the context.
 *
 * @returns The `ConsumptionState` instance.
 */
export function setConsumptionStore(): ConsumptionState {
  return setContext(Symbol.for(SYMBOL_KEY), new ConsumptionState());
}

/**
 * Retrieves the `ConsumptionState` instance from the context. This is a class instance,
 * so you cannot destructure it.
 * @returns The `ConsumptionState` instance.
 */
export function useConsumptionStore(): ConsumptionState {
  return getContext(Symbol.for(SYMBOL_KEY));
}
