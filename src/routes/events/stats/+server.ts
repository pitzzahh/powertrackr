import { produce } from "sveltekit-sse";
import { sleep } from "$/index";
import { formatEnergy, formatNumber } from "$/utils/format";
import { count, eq, sum } from "drizzle-orm";
import { billingInfo, payment, user } from "$/server/db/schema";
import { db } from "$/server/db";
import { originCheck } from "$/server/auth";
import { getEnergyUnit } from "$/utils/converter/energy";

// Global aggregates change rarely; 5s keeps the stats "live" without
// hammering D1 with 4 queries per second per connected client.
const POLL_INTERVAL_MS = 5_000;

const fallback = {
  userCount: 0,
  energyUsed: { total: 0, energyUnit: "kWh", formatted: formatEnergy(0) },
  billingCount: 0,
  paymentsAmount: { total: 0, formatted: formatNumber(0) },
};

export function POST() {
  originCheck();

  return produce(async function start({ emit, lock }) {
    while (true) {
      try {
        const database = db();
        // All aggregates run in a single D1 batch (one round trip, one transaction)
        // instead of four sequential queries.
        const [userCountResult, energyResult, billingCountResult, paymentsResult] =
          await database.batch([
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

        const data = {
          userCount: userCountResult[0]?.count ?? fallback.userCount,
          energyUsed: {
            total: totalEnergy,
            energyUnit: getEnergyUnit(totalEnergy),
            formatted: formatEnergy(totalEnergy),
          },
          billingCount: billingCountResult[0]?.count ?? fallback.billingCount,
          paymentsAmount: {
            total: paymentsTotal,
            formatted: formatNumber(paymentsTotal),
          },
        };

        const { error } = emit("stats", JSON.stringify(data));

        if (error) {
          lock.set(false);
          return function cancel() {
            console.error(error.message);
          };
        }
      } catch (e) {
        console.warn("Failed to fetch global stats");
        console.warn(e);
      }
      await sleep(POLL_INTERVAL_MS);
    }
  });
}
