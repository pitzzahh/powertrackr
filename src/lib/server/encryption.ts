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
import { scrypt } from "@noble/hashes/scrypt";

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_PARAMS = dev
  ? { N: 2 ** 12, r: 8, p: 1, dkLen: 32 }
  : { N: 2 ** 15, r: 8, p: 1, dkLen: 32 };

function encodeScryptHash(
  salt: Uint8Array,
  derivedKey: Uint8Array,
  params: { N: number; r: number; p: number }
) {
  return `${SCRYPT_PREFIX}$N=${params.N}$r=${params.r}$p=${params.p}$${encodeBase64url(salt)}$${encodeBase64url(derivedKey)}`;
}

function decodeScryptHash(hash: string) {
  const parts = hash.split("$");
  if (parts.length !== 6 || parts[0] !== SCRYPT_PREFIX) {
    return null;
  }
  const [_, nPart, rPart, pPart, saltPart, hashPart] = parts;
  if (!nPart.startsWith("N=") || !rPart.startsWith("r=") || !pPart.startsWith("p=")) {
    return null;
  }
  const N = Number(nPart.slice(2));
  const r = Number(rPart.slice(2));
  const p = Number(pPart.slice(2));
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return null;
  }
  return {
    N,
    r,
    p,
    salt: decodeBase64url(saltPart),
    hash: decodeBase64url(hashPart),
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
  const salt = crypto.randomBytes(16);
  const derivedKey = scrypt(password, salt, SCRYPT_PARAMS);
  return encodeScryptHash(salt, derivedKey, SCRYPT_PARAMS);
}

export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
  const parsed = decodeScryptHash(hash);
  if (!parsed) {
    return false;
  }
  const derivedKey = scrypt(password, parsed.salt, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    dkLen: parsed.hash.length,
  });
  return timingSafeEqualBytes(parsed.hash, derivedKey);
}

export function generateSessionToken() {
  return encodeBase64url(crypto.randomBytes(18));
}
