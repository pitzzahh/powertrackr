import { describe, it, expect, vi } from "vitest";

// Ensure the static private env used by the module is set at import-time
vi.mock("$env/static/private", () => ({
  ENCRYPTION_KEY: "00112233445566778899aabbccddeeff", // 16 bytes (32 hex chars) for AES-128
}));

import {
  encryptString,
  decrypt,
  decryptToString,
  generateRandomOTP,
  generateRandomRecoveryCode,
  generateSessionToken,
  hashPassword,
  verifyPasswordHash,
} from "./encryption";

describe("encryption utilities", () => {
  it("roundtrips strings via encrypt/decrypt", () => {
    const plain = "Hello, encrypt!";
    const encrypted = encryptString(plain);
    const decrypted = decryptToString(encrypted);
    expect(decrypted).toBe(plain);
  });

  it("throws on decrypt with invalid data", () => {
    expect(() => decrypt(new Uint8Array(10))).toThrow("Invalid data");
  });

  it("generates OTP, recovery code and session token with expected formats", () => {
    const otp = generateRandomOTP();
    expect(typeof otp).toBe("string");
    // 5 bytes => 8 Base32 chars (no padding)
    expect(otp.length).toBe(8);
    expect(/^[A-Z2-7]+$/.test(otp)).toBe(true);

    const rc = generateRandomRecoveryCode();
    expect(typeof rc).toBe("string");
    // 10 bytes => 16 Base32 chars (no padding)
    expect(rc.length).toBe(16);
    expect(/^[A-Z2-7]+$/.test(rc)).toBe(true);

    const token = generateSessionToken();
    expect(typeof token).toBe("string");
    // 18 bytes => 24 base64url characters
    expect(token.length).toBe(24);
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
  });

  it("hashes and verifies a password", async () => {
    const password = "supersecret";
    const hashed = await hashPassword(password);
    expect(await verifyPasswordHash(hashed, password)).toBe(true);
    expect(await verifyPasswordHash(hashed, "wrong")).toBe(false);
  });
});
