import {
  decodeBase64url,
  decodeHex,
  encodeBase32UpperCaseNoPadding,
  encodeBase64url,
} from "@oslojs/encoding";
import crypto from "node:crypto";
import { DynamicBuffer } from "@oslojs/binary";
import { ENCRYPTION_KEY } from "$env/static/private";
import { dev } from "$app/environment";
import { pbkdf2, sha256 } from "@noble/hashes/webcrypto.js";
import { randomBytes, utf8ToBytes } from "@noble/hashes/utils.js";

const PBKDF2_PREFIX = "pbkdf2";
const PBKDF2_PARAMS = dev
  ? { iterations: 10_000, hash: "SHA-256" as const, dkLen: 32 }
  : { iterations: 120_000, hash: "SHA-256" as const, dkLen: 32 };

async function derivePbkdf2(password: string, salt: Uint8Array, iterations: number, dkLen: number) {
  return pbkdf2(sha256, utf8ToBytes(password), salt, { c: iterations, dkLen });
}

function encodePbkdf2Hash(
  salt: Uint8Array,
  derivedKey: Uint8Array,
  params: { iterations: number; hash: "SHA-256" }
) {
  return `${PBKDF2_PREFIX}$${params.hash}$i=${params.iterations}$${encodeBase64url(salt)}$${encodeBase64url(derivedKey)}`;
}

function decodePbkdf2Hash(hash: string) {
  const parts = hash.split("$");
  if (parts.length !== 5 || parts[0] !== PBKDF2_PREFIX) {
    return null;
  }
  const [_, hashAlg, iterPart, saltPart, hashPart] = parts;
  if (hashAlg !== "SHA-256" || !iterPart.startsWith("i=")) {
    return null;
  }
  const iterations = Number(iterPart.slice(2));
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return null;
  }
  return {
    iterations,
    hash: "SHA-256" as const,
    salt: decodeBase64url(saltPart),
    derived: decodeBase64url(hashPart),
  };
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  if (typeof crypto.timingSafeEqual === "function") {
    return crypto.timingSafeEqual(a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

const key = decodeHex(ENCRYPTION_KEY);

export function encrypt(data: Uint8Array): Uint8Array {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-128-gcm", key, iv);
  const encrypted = new DynamicBuffer(0);
  encrypted.write(iv);
  encrypted.write(cipher.update(data));
  encrypted.write(cipher.final());
  encrypted.write(cipher.getAuthTag());
  return encrypted.bytes();
}

export function encryptString(data: string): Uint8Array {
  return encrypt(new TextEncoder().encode(data));
}

export function decrypt(encrypted: Uint8Array): Uint8Array {
  if (encrypted.byteLength < 33) {
    throw new Error("Invalid data");
  }
  const decipher = crypto.createDecipheriv("aes-128-gcm", key, encrypted.slice(0, 16));
  decipher.setAuthTag(encrypted.slice(encrypted.byteLength - 16));
  const decrypted = new DynamicBuffer(0);
  decrypted.write(decipher.update(encrypted.slice(16, encrypted.byteLength - 16)));
  decrypted.write(decipher.final());
  return decrypted.bytes();
}

export function decryptToString(data: Uint8Array): string {
  return new TextDecoder().decode(decrypt(data));
}

export function generateRandomOTP(): string {
  return encodeBase32UpperCaseNoPadding(crypto.randomBytes(5));
}

export function generateRandomRecoveryCode(): string {
  return encodeBase32UpperCaseNoPadding(crypto.randomBytes(10));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await derivePbkdf2(
    password,
    salt,
    PBKDF2_PARAMS.iterations,
    PBKDF2_PARAMS.dkLen
  );
  return encodePbkdf2Hash(salt, derivedKey, PBKDF2_PARAMS);
}

export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
  const parsed = decodePbkdf2Hash(hash);
  if (!parsed) {
    return false;
  }
  const derivedKey = await derivePbkdf2(
    password,
    parsed.salt,
    parsed.iterations,
    parsed.derived.length
  );
  return timingSafeEqualBytes(parsed.derived, derivedKey);
}

export function generateSessionToken() {
  return encodeBase64url(crypto.randomBytes(18));
}
