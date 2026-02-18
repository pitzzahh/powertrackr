import type { Transaction } from "$/server/db";
import type { TimeRangeOption } from "$routes/(components)/types";

export type HelperResult<T = unknown> = {
  valid: boolean;
  message: string;
  value: T;
};
export type HelperParam<T> = {
  query: Partial<T>;
  options?: Partial<HelperParamOptions<T>>;
};

export type HelperParamOptions<T> = {
  limit: number;
  offset: number;
  page: number;
  order: "asc" | "desc";
  with_perms: boolean;
  with_session: boolean;
  with_salary: boolean;
  start_date: string;
  end_date: string;
  paginated: boolean;
  exclude_id: string;
  include_archived: boolean;
  period: TimeRangeOption["value"]; // Added period option for chart data
  with_user: boolean;
  connective: "and" | "or";
  fields: (keyof T)[];
  with_payment: boolean;
  with_billing_info: boolean;
  with_sub_meters: boolean;
  with_sub_meters_with_payment: boolean;
  tx: Transaction;
};

export type APIReturnedData<T> = {
  timestamp: Date;
  message?: string;
  status: number;
  length: number;
  headers?: Headers;
  data: T;
};
