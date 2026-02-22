import type { HelperParam } from "$/server/types/helper";

export function generateQueryConditions<T>(data: HelperParam<T>) {
  const { query, options } = data;
  const where: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) where[key] = value;
  }
  if (options?.exclude_id) where.NOT = { id: options.exclude_id };
  return where;
}
