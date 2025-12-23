export const formatNumber = (num: number, currency: string = "PHP"): string => {
  const locales = ["en-PH", navigator.language];
  const options = { style: "currency", currency };
  return new Intl.NumberFormat(locales, options).format(num);
};
