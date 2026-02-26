import type { EnergyUnit } from "$/utils/converter/energy";

export interface Stats {
  userCount: number;
  energyUsed: {
    total: number;
    energyUnit: EnergyUnit;
    formatted: string;
  };
  billingCount: number;
  paymentsAmount: {
    total: number;
    formatted: string;
  };
}

/* Types for the stats payload. Keep these narrow and explicit so the cache is portable. */
export type EnergyUsed = {
  total: number;
  formatted: string;
  energyUnit: string;
};

export type PaymentsAmount = {
  total: number;
  formatted: string;
};

export type StatsPayload = {
  userCount: number;
  energyUsed: EnergyUsed;
  billingCount: number;
  paymentsAmount: PaymentsAmount;
};
