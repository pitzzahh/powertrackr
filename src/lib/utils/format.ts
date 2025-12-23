export const formatNumber = (
  num: number,
  options: { currency?: string; locale?: string } = {},
): string => {
  const { currency = "PHP", locale = "en-PH" } = options;
  const locales = [locale];
  const intlOptions = { style: "currency", currency };
  return new Intl.NumberFormat(locales, intlOptions).format(num);
};
