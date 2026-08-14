import { query } from "$app/server";
import { getPaymentSchema } from "#lib/validators/payment.js";
import { getPaymentBy, getTotalPaymentsAmountLogic } from "#lib/server/crud/payment-crud.js";
import { getBillingInfoBy } from "#lib/server/crud/billing-info-crud.js";
import { requireAuth } from "#lib/server/auth.js";
import { error } from "@sveltejs/kit";
import type { HelperResult } from "#lib/server/types/helper.js";
import type { Payment } from "#lib/types/payment.js";

// Query to get total payments amount
// Public endpoint with origin check - only allows requests from same origin
export const getTotalPaymentsAmount = query(getTotalPaymentsAmountLogic);

// Query to get a single payment by id (authenticated owner only)
export const getPayment = query(getPaymentSchema, async (id) => {
  const { session } = requireAuth();

  // Payments have no direct owner column; they belong to a user through the
  // billing_info row that references them (billing_info.payment_id).
  const {
    valid,
    value: [billing],
  } = await getBillingInfoBy({
    query: { paymentId: id },
    options: { limit: 1 },
  });

  if (!valid || !billing || billing.userId !== session.userId) {
    error(404, "Payment not found");
  }

  const paymentResult = await getPaymentBy({
    query: { id },
    options: { limit: 1 },
  });

  if (!paymentResult.valid || paymentResult.value.length === 0) {
    error(404, "Payment not found");
  }

  return paymentResult as HelperResult<Payment[]>;
});
