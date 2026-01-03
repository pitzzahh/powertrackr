export type FilterOption<T> = {
  value: T;
  label: T;
  icon?: any;
};

export type Filter<T> = {
  title: string;
  filteredValues: string[];
  options: FilterOption<T>[];
  counts: { [index: string]: number };
};
