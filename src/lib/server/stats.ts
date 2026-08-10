import { count, eq, sum } from "drizzle-orm";
import { billingInfo, payment, user } from "$/server/db/schema";
import { formatEnergy, formatNumber } from "$/utils/format";
import { getEnergyUnit } from "$/utils/converter/energy";
import type { Database } from "$/server/db";
import type { Stats } from "$/types/stats";

// Global aggregates change rarely; 5s keeps the stats "live" without
// hammering D1 with 4 queries per second per connected client.
export const POLL_INTERVAL_MS = 5_000;

export const FALLBACK_STATS: Stats = {
  userCount: 0,
  energyUsed: { total: 0, energyUnit: "kWh", formatted: formatEnergy(0) },
  billingCount: 0,
  paymentsAmount: { total: 0, formatted: formatNumber(0) },
};

/**
 * Fetch the site-wide stats aggregates. All four queries run in a single D1
 * batch (one round trip, one transaction) instead of four sequential queries.
 */
export async function getGlobalStats(database: Database): Promise<Stats> {
  const [userCountResult, energyResult, billingCountResult, paymentsResult] = await database.batch([
    database.select({ count: count() }).from(user),
    database.select({ total: sum(billingInfo.totalkWh) }).from(billingInfo),
    database.select({ count: count() }).from(billingInfo),
    database
      .select({ total: sum(payment.amount) })
      .from(payment)
      .innerJoin(billingInfo, eq(billingInfo.paymentId, payment.id)),
  ]);

  const totalEnergy = Number(energyResult[0]?.total ?? 0);
  const paymentsTotal = Number(paymentsResult[0]?.total ?? 0);

  return {
    userCount: userCountResult[0]?.count ?? FALLBACK_STATS.userCount,
    energyUsed: {
      total: totalEnergy,
      energyUnit: getEnergyUnit(totalEnergy),
      formatted: formatEnergy(totalEnergy),
    },
    billingCount: billingCountResult[0]?.count ?? FALLBACK_STATS.billingCount,
    paymentsAmount: {
      total: paymentsTotal,
      formatted: formatNumber(paymentsTotal),
    },
  };
}
