import type { Icon } from "@lucide/svelte";

export type FilterOption<T> = {
  value: T;
  label: T;
  icon?: typeof Icon;
};

export type Filter<T> = {
  title: string;
  filteredValues: string[];
  options: FilterOption<T>[];
  counts: { [index: string]: number };
};
