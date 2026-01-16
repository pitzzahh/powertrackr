import { describe, it, expect } from "vitest";
import {
  maskEmailAddress,
  sanitize,
  convertToNormalText,
  generateFullName,
  getInitials,
  extractMainRoute,
  generateNotFoundMessage,
  replaceTextWithMarker,
  toShortName,
} from "./text";

describe("text utilities", () => {
  it("maskEmailAddress returns undefined when input is undefined", () => {
    expect(maskEmailAddress(undefined)).toBeUndefined();
  });

  it("maskEmailAddress returns original string for invalid emails", () => {
    const invalid = "not-an-email";
    expect(maskEmailAddress(invalid)).toBe(invalid);
  });

  it("maskEmailAddress masks domains and username segments correctly", () => {
    // Single-letter username stays as-is; domain is masked
    expect(maskEmailAddress("a@domain.com")).toBe("a@do****n.com");

    // Username with dot segments: different lengths handled per segment
    expect(maskEmailAddress("first.last@sub.example.com")).toBe("fi****t.la**@su*.example.com");

    // Parts of length 2 should remain unchanged
    expect(maskEmailAddress("ab.cd@xy.com")).toBe("ab.cd@xy.com");
  });

  it("sanitize converts null/undefined to empty string and everything else to string", () => {
    expect(sanitize(null)).toBe("");
    expect(sanitize(undefined)).toBe("");
    expect(sanitize(123)).toBe("123");
    expect(sanitize(true)).toBe("true");
  });

  it("convertToNormalText normalizes separators and capitalization", () => {
    expect(convertToNormalText("HELLO_WORLD")).toBe("Hello world");
    expect(convertToNormalText("  multi-WORD_test  ")).toBe("Multi word test");
    // include separators custom list
    expect(convertToNormalText("alpha.separator.beta", true, ["."])).toBe("Alpha separator beta");
  });

  it("generateFullName composes name correctly with options", () => {
    const data = { first_name: " John ", last_name: " Doe ", middle_name: " M " };

    // include_last_name true
    expect(generateFullName(data, { prefix: "Mr", postfix: "Sr", include_last_name: true })).toBe(
      "Mr John M Doe Sr"
    );

    // include_last_name false (default)
    expect(generateFullName(data, { prefix: "Dr", postfix: "III", include_last_name: false })).toBe(
      "Dr John M III"
    );
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

  it("replaceTextWithMarker wraps matches with <mark> tags", () => {
    const text = "Hello world world";
    const res = replaceTextWithMarker(text, "world", /world/g);
    expect(res).toBe("Hello <mark>world</mark> <mark>world</mark>");
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
