type RateLimiter = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

/**
 * Rate-limit check that tolerates missing bindings (unit tests mock
 * `cloudflare:workers` with an empty env): a missing limiter allows the
 * request. Dev and production always pass a real binding and enforce normally.
 */
export async function isRateLimited(
  limiter: RateLimiter | undefined | null,
  key: string
): Promise<boolean> {
  if (!limiter) return false;
  const { success } = await limiter.limit({ key });
  return !success;
}
