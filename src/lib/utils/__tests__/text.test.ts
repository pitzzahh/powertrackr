import { describe, it, expect } from "vitest";
import {
  convertToNormalText,
  getInitials,
  extractMainRoute,
  generateNotFoundMessage,
  toShortName,
} from "#lib/utils/text.js";

describe("text utilities", () => {
  it("convertToNormalText normalizes separators and capitalization", () => {
    expect(convertToNormalText("HELLO_WORLD")).toBe("Hello world");
    expect(convertToNormalText("  multi-WORD_test  ")).toBe("Multi word test");
    // include separators custom list
    expect(convertToNormalText("alpha.separator.beta", true, ["."])).toBe("Alpha separator beta");
  });

  it("getInitials handles various name lengths and spacing", () => {
    expect(getInitials(undefined)).toBe("");
    expect(getInitials("")).toBe("");
    expect(getInitials(" John ")).toBe("JJ"); // single name => duplicate the initial
    expect(getInitials("John Doe")).toBe("JD"); // two names
    expect(getInitials("John Paul Jones")).toBe("JP"); // three names => use middle initial
    expect(getInitials("a b c d")).toBe("AB"); // >=4 names => first + second
  });

  it("extractMainRoute returns root or first segment", () => {
    expect(extractMainRoute("/")).toBe("/");
    expect(extractMainRoute("/dashboard/settings")).toBe("/dashboard");
    expect(extractMainRoute("/foo")).toBe("/foo");
  });

  it("generateNotFoundMessage formats dates and other fields properly", () => {
    const dt = new Date("2020-01-02T12:00:00Z");
    const msg = generateNotFoundMessage({ id: 5, createdAt: dt });
    expect(msg).toBe("id: 5 or createdAt: 2020-01-02 not found.");
  });

  it("toShortName returns sensible short names", () => {
    expect(toShortName("")).toBe("");
    expect(toShortName("john")).toBe("J");
    expect(toShortName("john doe")).toBe("JD");
    expect(toShortName("john a. doe")).toBe("JD");
    // If last part doesn't start with a letter, fallback to its first char
    expect(toShortName("john 9abc")).toBe("J9");
  });
});
