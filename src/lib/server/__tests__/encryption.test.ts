import { describe, it, expect, vi } from "vitest";

// Ensure the static private env used by the module is set at import-time
vi.mock("$app/env/private", () => ({
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
} from "#lib/server/encryption.js";

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

  it("roundtrips with a 32-byte key (openssl rand -hex 32) via aes-256-gcm", async () => {
    vi.resetModules();
    vi.doMock("$app/env/private", () => ({
      // 32 bytes (64 hex chars), the format `.env.example` documents
      ENCRYPTION_KEY: "a2b4cb1395bf95852abebc89274f96e883d4f8f743947737590a768b8a456075",
    }));
    const mod = await import("#lib/server/encryption.js");
    const plain = "roundtrip with a 32-byte key";
    expect(mod.decryptToString(mod.encryptString(plain))).toBe(plain);
  });

  it("fails fast at module load when the key length is invalid", async () => {
    vi.resetModules();
    vi.doMock("$app/env/private", () => ({
      // 12 bytes (24 hex chars) — neither 16 nor 32
      ENCRYPTION_KEY: "00112233445566778899aabbcc",
    }));
    await expect(import("#lib/server/encryption.js")).rejects.toThrow(/ENCRYPTION_KEY/);
  });
});
