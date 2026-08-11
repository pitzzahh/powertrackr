import {
  getExtendedBillingInfos,
  getLatestBillingInfo,
  getTotalEnergyUsage,
  getTotalBillingInfoCount,
} from "./billing-info.remote";
import { getTenants } from "./tenant.remote";
import { getTotalUserCount } from "./user.remote";
import { getTotalPaymentsAmount } from "./payment.remote";

/**
 * Single-flight refresh of every query that reads billing, tenant, or stats
 * data, so one mutation invalidates all cached copies in a single round-trip.
 * Call it (fire-and-forget) from billing-related mutations.
 */
export function refreshBillingData() {
  void getExtendedBillingInfos({}).refresh();
  void getLatestBillingInfo({}).refresh();
  void getTenants({}).refresh();
  void getTotalUserCount().refresh();
  void getTotalEnergyUsage().refresh();
  void getTotalBillingInfoCount().refresh();
  void getTotalPaymentsAmount().refresh();
}
