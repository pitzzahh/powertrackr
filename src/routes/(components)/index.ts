export const TIME_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "Show All" },
];

export function getSelectedLabel(timeRange: string): string {
  switch (timeRange) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 3 months";
    case "6m":
      return "Last 6 months";
    case "1y":
      return "Last year";
    case "all":
      return "Show All";
    default:
      return "Last 3 months";
  }
}

export function getFilteredData<T extends { date: Date }>(
  data: T[],
  timeRange: string,
): T[] {
  if (timeRange === "all") return data;
  let daysToSubtract = 90;
  if (timeRange === "30d") {
    daysToSubtract = 30;
  } else if (timeRange === "7d") {
    daysToSubtract = 7;
  } else if (timeRange === "6m") {
    daysToSubtract = 180;
  } else if (timeRange === "1y") {
    daysToSubtract = 365;
  }

  const maxDate =
    data.length > 0
      ? new Date(Math.max(...data.map((d) => d.date.getTime())))
      : new Date();
  const referenceDate = new Date(
    maxDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000,
  );
  return data.filter((item) => item.date >= referenceDate);
}
