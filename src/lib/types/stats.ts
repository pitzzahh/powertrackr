import type { EnergyUnit } from "#lib/types/chart.js";

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
