import type { ExtendedBillingInfo } from "$/types/billing-info";
import type { ChartData } from "./chart-area.svelte";
import type { BarChartData } from "./chart-bar.svelte";
import type { TimeRangeOption } from "./types";

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
  ...Array.from({ length: 10 - 1 }, (_, i) => ({
    value: `${i + 2}y` as TimeRangeOption["value"],
    label: `Last ${i + 2} years`,
  })),
  { value: "all", label: "Show All" },
];

export function getSelectedLabel(timeRange: string): string {
  return TIME_RANGE_OPTIONS.find((opt) => opt.value === timeRange)?.label || "Last 3 months";
}

export function getFilteredData<T extends { date: Date }>(data: T[], timeRange: string): T[] {
  const filtered =
    timeRange === "all"
      ? data
      : (() => {
          let daysToSubtract = 90;
          if (timeRange === "30d") {
            daysToSubtract = 30;
          } else if (timeRange === "7d") {
            daysToSubtract = 7;
          } else if (timeRange === "6m") {
            daysToSubtract = 180;
          } else if (timeRange === "1y") {
            daysToSubtract = 365;
          } else if (timeRange.endsWith("y")) {
            const years = parseInt(timeRange.slice(0, -1));
            daysToSubtract = years * 365;
          }

          const maxDate =
            data.length > 0 ? new Date(Math.max(...data.map((d) => d.date.getTime()))) : new Date();
          const referenceDate = new Date(maxDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
          return data.filter((item) => item.date >= referenceDate);
        })();

  // Sort in ascending order (oldest first) for consistent chart visualization
  return [...filtered].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function toAreaChartData(original: ExtendedBillingInfo): ChartData {
  return {
    date: new Date(original.date),
    balance: original.balance,
    payment: original.payment.amount,
    subPayments: Object.fromEntries(
      original.subMeters.map((sub) => [sub.label, sub.payment?.amount || 0])
    ),
  };
}

export function toBarChartData(original: ExtendedBillingInfo): BarChartData {
  // Sum sub-meter usage directly; initial baseline readings are stored in `reading` and
  // `subkWh` for starting meters is 0, so just sum `sub.subkWh`.
  const subkWhRaw = (original.subMeters ?? []).reduce((sum, sub) => sum + (sub.subkWh ?? 0), 0);

  // Clamp sub usage so it never exceeds the total usage for the billing period.
  const subkWh = Math.min(subkWhRaw, original.totalkWh ?? 0);

  // Ensure main kWh is non-negative and that main + sub = total (after clamping).
  const mainKWh = Math.max(0, (original.totalkWh ?? 0) - subkWh);

  return {
    date: new Date(original.date),
    totalkWh: original.totalkWh,
    mainKWh,
    subkWh,
  };
}

export { default as ChartArea } from "./chart-area.svelte";
export { default as ChartBar } from "./chart-bar.svelte";
export { default as ChartConsumption } from "./chart-consumption.svelte";
export { default as ErrorBackground } from "./error-background.svelte";
export { default as AccountSettings } from "./account-settings.svelte";

// Landing page components
export { default as AnimatedBackground } from "./animated-background.svelte";
export { default as BenefitsMarquee } from "./benefits-marquee.svelte";
export { default as Cta } from "./cta.svelte";
export { default as Features } from "./features.svelte";
export { default as Hero } from "./hero.svelte";
export { default as HowItWorks } from "./how-it-works.svelte";
export { default as LandingFooter } from "./landing-footer.svelte";
export { default as LandingNav } from "./landing-nav.svelte";
export { default as Scenarios } from "./scenarios.svelte";
export { default as Stats } from "./stats.svelte";
