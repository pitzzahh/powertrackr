export interface Stats {
  userCount: number;
  energyUsed: {
    total: number;
    energyUnit: string;
    formatted: string;
  };
  billingCount: number;
  paymentsAmount: {
    total: number;
    formatted: string;
  };
}
