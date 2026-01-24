import { describe, it, expect } from "vitest";
import { formatEnergy } from "../format";

describe("formatEnergy", () => {
  it("formats small values as kWh without decimals by default", () => {
    expect(formatEnergy(500)).toBe("500 kWh");
  });

  it("formats values >= 1000 as MWh with 2 decimals by default", () => {
    expect(formatEnergy(1200)).toBe("1.20 MWh");
  });

  it("formats large values as GWh with 2 decimals", () => {
    expect(formatEnergy(1_500_000)).toBe("1.50 GWh");
  });

  it("supports forcing unit to kWh and includes thousand separators", () => {
    expect(formatEnergy(1500, { unit: "kWh" })).toBe("1,500 kWh");
  });

  it("honors the decimals option when provided", () => {
    expect(formatEnergy(1500, { unit: "MWh", decimals: 1 })).toBe("1.5 MWh");
  });

  it("supports long unit names", () => {
    expect(formatEnergy(1200, { long: true })).toBe("1.20 megawatt-hour");
  });

  it("formats zero correctly", () => {
    expect(formatEnergy(0)).toBe("0 kWh");
  });

  it("honors decimals for small numbers when explicitly provided", () => {
    expect(formatEnergy(0.5, { decimals: 2 })).toBe("0.50 kWh");
  });

  it("preserves sign for negative values", () => {
    expect(formatEnergy(-2500)).toBe("-2.50 MWh");
  });

  it("formats very large numbers as TWh", () => {
    expect(formatEnergy(5e9)).toBe("5.00 TWh");
  });
});
