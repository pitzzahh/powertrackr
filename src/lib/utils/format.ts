export const formatNumber = (
  num: number,
  options: { currency?: string; locale?: string } = {}
): string => {
  const { currency = "PHP", locale = "en-PH" } = options;
  const locales = [locale];
  const intlOptions: Intl.NumberFormatOptions = { style: "currency", currency };
  return new Intl.NumberFormat(locales, intlOptions).format(num);
};

export enum DateFormat {
  DateOnly = "dateOnly",
  DateTime = "dateTime",
}

export const formatDate = (
  date: Date,
  options: { format?: DateFormat; locale?: string } = {}
): string => {
  const { format = DateFormat.DateOnly, locale = "en-PH" } = options;
  const intlOptions: Intl.DateTimeFormatOptions =
    format === DateFormat.DateOnly
      ? { year: "numeric", month: "long", day: "numeric" }
      : {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        };
  return new Intl.DateTimeFormat(locale, intlOptions).format(date);
};
