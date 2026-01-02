// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HelperResult<T = any> = {
  valid: boolean;
  message: string;
  value: T;
};
export type HelperParam<T> = {
  query: Partial<T>;
  options: Partial<HelperParamOptions>;
};

export type HelperParamOptions = {
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
  period: "3months" | "30days" | "7days"; // Added period option for chart data
  with_user: boolean;
  connective: "and" | "or";
};

export type APIReturnedData<T> = {
  timestamp: Date;
  message?: string;
  status: number;
  length: number;
  headers?: Headers;
  data: T;
};
