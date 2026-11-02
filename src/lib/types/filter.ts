import type { PhosphorIcon } from "#lib/assets/icons.js";

export type FilterOption<T> = {
  value: T;
  label: T;
  icon?: PhosphorIcon;
};

export type Filter<T> = {
  title: string;
  filteredValues: string[];
  options: FilterOption<T>[];
  counts: { [index: string]: number };
};
