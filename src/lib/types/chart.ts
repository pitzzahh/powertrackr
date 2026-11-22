export type BarChartData = {
  date: Date;
  totalkWh: number;
  mainKWh: number;
  subkWh: number;
};

export type AreaChartData = {
  date: Date;
  balance: number;
  payment: number;
  subPayments: { [label: string]: number };
};

export type ConsumptionChartData = {
  date: Date;
  kWh: number;
};

export type TimeRangeOption = {
  value:
    | "7d"
    | "30d"
    | "90d"
    | "6m"
    | "1y"
    | "2y"
    | "3y"
    | "4y"
    | "5y"
    | "6y"
    | "7y"
    | "8y"
    | "9y"
    | "10y"
    | "all";
  label: string;
};

export type EnergyUnit = "kWh" | "MWh" | "GWh" | "TWh";

export type Total = {
  totalkWh: number;
  mainKWh: number;
  subkWh: number;
};
