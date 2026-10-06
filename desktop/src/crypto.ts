/**
 * QuantumShield Desktop — Post-Quantum Crypto (runs entirely in the renderer).
 *
 * No server, no network. Files are encrypted locally using:
 *   - ML-KEM (FIPS 203) for key encapsulation → 32-byte shared secret
 *   - AES-256-GCM (Web Crypto API) for symmetric file encryption
 *
 * The package format (.qenc) is compatible with the web app version.
 */

import { ml_kem512, ml_kem768, ml_kem1024 } from "@noble/post-quantum/ml-kem.js";

export type KemVariant = "ml-kem-512" | "ml-kem-768" | "ml-kem-1024";

const KEM = {
  "ml-kem-512": ml_kem512,
  "ml-kem-768": ml_kem768,
  "ml-kem-1024": ml_kem1024,
} as const;

export const KEM_INFO: Record<
  KemVariant,
  { label: string; security: string; publicKeySize: number; secretKeySize: number; cipherTextSize: number }
> = {
  "ml-kem-512": {
    label: "ML-KEM-512",
    security: "128-bit",
    publicKeySize: ml_kem512.lengths.publicKey,
    secretKeySize: ml_kem512.lengths.secretKey,
    cipherTextSize: ml_kem512.lengths.cipherText,
  },
  "ml-kem-768": {
    label: "ML-KEM-768",
    security: "192-bit",
    publicKeySize: ml_kem768.lengths.publicKey,
    secretKeySize: ml_kem768.lengths.secretKey,
    cipherTextSize: ml_kem768.lengths.cipherText,
  },
  "ml-kem-1024": {
    label: "ML-KEM-1024",
    security: "256-bit",
    publicKeySize: ml_kem1024.lengths.publicKey,
    secretKeySize: ml_kem1024.lengths.secretKey,
    cipherTextSize: ml_kem1024.lengths.cipherText,
  },
};

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function randomBytes(len: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(len));
}

// ---------------------------------------------------------------------------
// Package format
// ---------------------------------------------------------------------------

export interface EncryptedPackage {
  version: string;
  type: "quantumshield-encrypted-document";
  algorithm: KemVariant;
  createdAt: string;
  kemCipherText: string; // hex
  kemPublicKey: string; // hex
  kemSecretKey: string; // hex (needed to decrypt; keep private!)
  iv: string; // base64
  encryptedData: string; // base64
  originalFilename: string;
  originalMimeType: string;
  originalSizeBytes: number;
  appSource: string;
}

// ---------------------------------------------------------------------------
// Core operations — all synchronous crypto + async AES via Web Crypto
// ---------------------------------------------------------------------------

export interface KeygenResult {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export function kemKeygen(variant: KemVariant): KeygenResult {
  const alg = KEM[variant];
  const seed = randomBytes(alg.lengths.seed!);
  return alg.keygen(seed);
}

export interface EncapResult {
  cipherText: Uint8Array;
  sharedSecret: Uint8Array;
}

export function kemEncapsulate(variant: KemVariant, publicKey: Uint8Array): EncapResult {
  const alg = KEM[variant];
  const msg = randomBytes(alg.lengths.msgRand!);
  return alg.encapsulate(publicKey, msg);
}

export function kemDecapsulate(
  variant: KemVariant,
  cipherText: Uint8Array,
  secretKey: Uint8Array,
): Uint8Array {
  const alg = KEM[variant];
  return alg.decapsulate(cipherText, secretKey);
}

async function aesEncrypt(
  data: Uint8Array,
  sharedSecret: Uint8Array,
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const key = await crypto.subtle.importKey("raw", sharedSecret, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv, ciphertext: new Uint8Array(encrypted) };
}

async function aesDecrypt(
  ciphertext: Uint8Array,
  sharedSecret: Uint8Array,
  iv: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", sharedSecret, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new Uint8Array(decrypted);
}

// ---------------------------------------------------------------------------
// High-level encrypt / decrypt a file → package
// ---------------------------------------------------------------------------

export async function encryptFile(
  variant: KemVariant,
  fileBytes: Uint8Array,
  filename: string,
  mimeType: string,
): Promise<EncryptedPackage> {
  const { publicKey, secretKey } = kemKeygen(variant);
  const { cipherText, sharedSecret } = kemEncapsulate(variant, publicKey);
  const { iv, ciphertext } = await aesEncrypt(fileBytes, sharedSecret);
  return {
    version: "1.0",
    type: "quantumshield-encrypted-document",
    algorithm: variant,
    createdAt: new Date().toISOString(),
    kemCipherText: bytesToHex(cipherText),
    kemPublicKey: bytesToHex(publicKey),
    kemSecretKey: bytesToHex(secretKey),
    iv: bytesToBase64(iv),
    encryptedData: bytesToBase64(ciphertext),
    originalFilename: filename,
    originalMimeType: mimeType,
    originalSizeBytes: fileBytes.length,
    appSource: "quantumshield-desktop",
  };
}

export async function decryptPackage(
  pkg: EncryptedPackage,
): Promise<{ bytes: Uint8Array; filename: string; mimeType: string }> {
  if (pkg.type !== "quantumshield-encrypted-document") {
    throw new Error("Not a valid QuantumShield encrypted package.");
  }
  const sharedSecret = kemDecapsulate(
    pkg.algorithm,
    hexToBytes(pkg.kemCipherText),
    hexToBytes(pkg.kemSecretKey),
  );
  const plaintext = await aesDecrypt(
    base64ToBytes(pkg.encryptedData),
    sharedSecret,
    base64ToBytes(pkg.iv),
  );
  return {
    bytes: plaintext,
    filename: pkg.originalFilename,
    mimeType: pkg.originalMimeType,
  };
}

// ---------------------------------------------------------------------------
// Key export (for sharing your public key)
// ---------------------------------------------------------------------------

export function exportKeyPair(variant: KemVariant): {
  publicKeyHex: string;
  secretKeyHex: string;
  publicKeySize: number;
  secretKeySize: number;
} {
  const { publicKey, secretKey } = kemKeygen(variant);
  return {
    publicKeyHex: bytesToHex(publicKey),
    secretKeyHex: bytesToHex(secretKey),
    publicKeySize: publicKey.length,
    secretKeySize: secretKey.length,
  };
}
