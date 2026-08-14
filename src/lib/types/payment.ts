import type { payment } from "#lib/server/db/schema/index.js";

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export type PaymentDTO = {
  id: string;
  amount: number | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};
