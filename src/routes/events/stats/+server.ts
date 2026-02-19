import { produce } from "sveltekit-sse";
import { sleep } from "$/index";
import { formatEnergy } from "$/utils/format";
import { getUserCountLogic } from "$/server/crud/user-crud";
import {
  getTotalBillingInfoCountLogic,
  getTotalEnergyUsageLogic,
} from "$/server/crud/billing-info-crud";
import { getTotalPaymentsAmountLogic } from "$/server/crud/payment-crud";

const fallback = {
  userCount: 0,
  energyUsed: { total: 0, energyUnit: "kWh", formatted: formatEnergy(0) },
  billingCount: 0,
  paymentsAmount: { total: 0, formatted: formatEnergy(0) },
};

export function POST({ getClientAddress }) {
  return produce(async function start({ emit, lock }) {
    while (true) {
      let userCount = fallback.userCount;
      let energyUsed = fallback.energyUsed;
      let billingCount = fallback.billingCount;
      let paymentsAmount = fallback.paymentsAmount;

      try {
        userCount = await getUserCountLogic();
      } catch (e) {
        console.warn("Failed to fetch user count");
        console.warn(e);
      }
      try {
        energyUsed = await getTotalEnergyUsageLogic();
      } catch (e) {
        console.warn("Failed to fetch energy usage");
        console.warn(e);
      }
      try {
        billingCount = await getTotalBillingInfoCountLogic();
      } catch (e) {
        console.warn("Failed to fetch billing info count");
        console.warn(e);
      }
      try {
        paymentsAmount = await getTotalPaymentsAmountLogic();
      } catch (e) {
        console.warn("Failed to fetch paymentsfix: auth test assertion amount");
        console.warn(e);
      }

      const data = {
        userCount,
        energyUsed,
        billingCount,
        paymentsAmount,
      };
      console.log("Emitting data to [%s]:", getClientAddress(), data);

      const { error } = emit("stats", JSON.stringify(data));

      if (error) {
        lock.set(false);
        return function cancel() {
          console.error(error.message);
        };
      }
      await sleep(1000);
    }
  });
}
