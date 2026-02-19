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
