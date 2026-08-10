import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGlobalStats, FALLBACK_STATS } from "$/server/stats";
import { db } from "$/server/db";
import { addUser } from "$/server/crud/user-crud";
import { addPayment } from "$/server/crud/payment-crud";
import { addBillingInfo } from "$/server/crud/billing-info-crud";
import {
  createUser,
  createPayments,
  createBillingInfo,
  resetSequence,
} from "$/server/crud/__tests__/helpers/factories";

function withoutId<T extends { id: string }>({ id: _id, ...rest }: T): Omit<T, "id"> {
  return rest;
}

describe("getGlobalStats", () => {
  beforeEach(() => {
    resetSequence();
  });

  it("returns correct aggregates from a single D1 batch", async () => {
    const users = [createUser(), createUser()];
    const { value: addedUsers } = await addUser(users.map(withoutId));
    const [user1, user2] = addedUsers;

    // Only the first two payments are linked to a billing info; the third must
    // be excluded by the JOIN (sub-meter style payments are not counted).
    const { value: addedPayments } = await addPayment(
      createPayments(3, { amount: 100 }).map(withoutId)
    );
    const [linkedPayment1, linkedPayment2, unlinkedPayment] = addedPayments;
    expect(unlinkedPayment).toBeDefined();

    await addBillingInfo(
      [
        createBillingInfo({
          userId: user1.id,
          paymentId: linkedPayment1.id,
          totalkWh: 500,
        }),
        createBillingInfo({
          userId: user2.id,
          paymentId: linkedPayment2.id,
          totalkWh: 1500,
        }),
      ].map(withoutId)
    );

    const batchSpy = vi.spyOn(db(), "batch");
    const stats = await getGlobalStats(db());

    // Structural perf guarantee: all four aggregates go out in one round trip.
    expect(batchSpy).toHaveBeenCalledTimes(1);
    batchSpy.mockRestore();

    expect(stats.userCount).toBe(2);
    expect(stats.billingCount).toBe(2);
    expect(stats.energyUsed.total).toBe(2000);
    expect(stats.energyUsed.energyUnit).toBe("MWh");
    expect(stats.paymentsAmount.total).toBe(linkedPayment1.amount + linkedPayment2.amount);
  });

  it("returns fallback values when tables are empty", async () => {
    const stats = await getGlobalStats(db());
    expect(stats).toEqual(FALLBACK_STATS);
  });
});
