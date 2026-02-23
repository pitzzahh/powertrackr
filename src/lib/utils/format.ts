import { convertEnergy, getEnergyUnit, type EnergyUnit } from "./converter/energy";

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

/**
 * Parse a calendar date string (YYYY-MM-DD) as UTC to avoid timezone issues
 */
export const parseCalendarDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const formatDate = (
  dateInput: Date | string | number,
  options: { format?: DateFormat; locale?: string } = {}
): string => {
  const { format = DateFormat.DateOnly, locale = "en-PH" } = options;

  // Normalize input into a Date instance.
  let date: Date;
  if (typeof dateInput === "string") {
    // If it's a calendar date string YYYY-MM-DD, parse as UTC to avoid TZ shifts.
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      date = parseCalendarDate(dateInput);
    } else {
      date = new Date(dateInput);
    }
  } else {
    // number (ms since epoch) or Date
    date = new Date(dateInput as any);
  }

  // If invalid date, return empty string so callers don't throw.
  if (Number.isNaN(date.getTime())) return "";

  let intlOptions: Intl.DateTimeFormatOptions;

  switch (format) {
    case DateFormat.DateTime:
      intlOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      };
      break;

    case DateFormat.MonthOnly:
      intlOptions = { month: "long", timeZone: "UTC" };
      break;

    case DateFormat.MonthYear:
      intlOptions = { month: "long", year: "numeric", timeZone: "UTC" };
      break;

    case DateFormat.YearOnly:
      intlOptions = { year: "numeric", timeZone: "UTC" };
      break;
    case DateFormat.DayOnly:
      intlOptions = { weekday: "long", timeZone: "UTC" };
      break;
    case DateFormat.DateOnly:
    default:
      intlOptions = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
  }

  return new Intl.DateTimeFormat(locale, intlOptions).format(date);
};

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

  let chosenUnit: EnergyUnit = unit === "auto" ? getEnergyUnit(kwh) : unit;

  const value = convertEnergy(kwh, chosenUnit);

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
