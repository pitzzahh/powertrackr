export type EnergyUnit = "kWh" | "MWh" | "GWh" | "TWh";

/**
 * Converts an energy value in kWh to the specified unit.
 * @param kwh The energy value in kilowatt-hours.
 * @param toUnit The target unit to convert to.
 * @returns The converted value in the target unit.
 */
export function convertEnergy(kwh: number, toUnit: EnergyUnit): number {
  switch (toUnit) {
    case "kWh":
      return kwh;
    case "MWh":
      return kwh / 1e3;
    case "GWh":
      return kwh / 1e6;
    case "TWh":
      return kwh / 1e9;
    default:
      throw new Error(`Unknown energy unit: ${toUnit}`);
  }
}

/**
 * Returns the most appropriate energy unit for a given value in kWh.
 * @param kwh The energy value in kilowatt-hours.
 * @returns The best-fit EnergyUnit.
 */
export function getEnergyUnit(kwh: number): EnergyUnit {
  const abs = Math.abs(kwh);
  if (abs >= 1e9) return "TWh";
  if (abs >= 1e6) return "GWh";
  if (abs >= 1e3) return "MWh";
  return "kWh";
}
