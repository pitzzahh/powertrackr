export const formatNumber = (
  num: number,
  options: { currency?: string; locale?: string; style?: Intl.NumberFormatOptions["style"] } = {}
): string => {
  const { currency = "PHP", locale = "en-PH", style = "currency" } = options;
  const locales = [locale];
  const intlOptions: Intl.NumberFormatOptions = {
    style,
    ...(style === "currency" ? { currency } : {}),
  };
  return new Intl.NumberFormat(locales, intlOptions).format(num);
};

export enum DateFormat {
  DateOnly = "dateOnly",
  DateTime = "dateTime",
  DayOnly = "dayOnly",
  MonthOnly = "monthOnly",
  MonthYear = "monthYear",
  YearOnly = "yearOnly",
}

export const formatDate = (
  date: Date,
  options: { format?: DateFormat; locale?: string } = {}
): string => {
  const { format = DateFormat.DateOnly, locale = "en-PH" } = options;

  let intlOptions: Intl.DateTimeFormatOptions;

  switch (format) {
    case DateFormat.DateTime:
      intlOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      };
      break;

    case DateFormat.MonthOnly:
      intlOptions = { month: "long" };
      break;

    case DateFormat.MonthYear:
      intlOptions = { month: "long", year: "numeric" };
      break;

    case DateFormat.YearOnly:
      intlOptions = { year: "numeric" };
      break;
    case DateFormat.DayOnly:
      intlOptions = { weekday: "long" };
      break;
    case DateFormat.DateOnly:
    default:
      intlOptions = { year: "numeric", month: "long", day: "numeric" };
  }

  return new Intl.DateTimeFormat(locale, intlOptions).format(date);
};

/**
 * Energy unit types representing common multiples of kWh.
 */
export type EnergyUnit = "kWh" | "MWh" | "GWh" | "TWh";

/**
 * Options for formatting energy amounts.
 * - `locale`: locale for number formatting (default: 'en-PH')
 * - `decimals`: number of decimal places. If omitted, defaults to 0 for kWh and 2 for larger units.
 * - `unit`: 'auto' (default) or a specific `EnergyUnit` to force a unit.
 * - `long`: if true, output long unit names (e.g. 'megawatt-hour') instead of abbreviated 'MWh'.
 */
export const formatEnergy = (
  kwh: number,
  options: { locale?: string; decimals?: number; unit?: "auto" | EnergyUnit; long?: boolean } = {}
): string => {
  const { locale = "en-PH", decimals, unit = "auto", long = false } = options;

  const abs = Math.abs(kwh);

  let chosenUnit: EnergyUnit;
  if (unit === "auto") {
    if (abs >= 1e9) chosenUnit = "TWh";
    else if (abs >= 1e6) chosenUnit = "GWh";
    else if (abs >= 1e3) chosenUnit = "MWh";
    else chosenUnit = "kWh";
  } else {
    chosenUnit = unit;
  }

  const factor =
    chosenUnit === "kWh" ? 1 : chosenUnit === "MWh" ? 1e3 : chosenUnit === "GWh" ? 1e6 : 1e9;
  const value = kwh / factor;

  const computedDecimals = typeof decimals === "number" ? decimals : chosenUnit === "kWh" ? 0 : 2;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: computedDecimals,
    maximumFractionDigits: computedDecimals,
  });

  const unitLabel = long
    ? chosenUnit === "kWh"
      ? "kilowatt-hour"
      : chosenUnit === "MWh"
        ? "megawatt-hour"
        : chosenUnit === "GWh"
          ? "gigawatt-hour"
          : "terawatt-hour"
    : chosenUnit;

  return `${formatter.format(value)} ${unitLabel}`;
};
