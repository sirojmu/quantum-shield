import { ml_kem512, ml_kem768, ml_kem1024 } from "@noble/post-quantum/ml-kem.js";
import { ml_dsa44, ml_dsa65, ml_dsa87 } from "@noble/post-quantum/ml-dsa.js";
import {
  slh_dsa_sha2_128f,
  slh_dsa_sha2_128s,
  slh_dsa_sha2_192f,
  slh_dsa_sha2_192s,
  slh_dsa_sha2_256f,
  slh_dsa_sha2_256s,
} from "@noble/post-quantum/slh-dsa.js";
import type {
  MlKemVariant,
  MlDsaVariant,
  SlhDsaVariant,
} from "./pqc-meta";

// Re-export variant types & metadata so API routes can keep importing from here.
export type { MlKemVariant, MlDsaVariant, SlhDsaVariant };
export { ALGORITHMS, type AlgorithmMeta } from "./pqc-meta";

/**
 * QuantumShield — Post-Quantum Cryptography Library
 * Implements NIST-standardized algorithms (FIPS 203, 204, 205).
 * All functions are synchronous; byte arrays are converted to hex strings for transport.
 */

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

/** Convert a Uint8Array to a lowercase hex string. */
export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/** Convert a hex string (with or without 0x prefix) to a Uint8Array. */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) {
    throw new Error("Hex string has an odd length");
  }
  if (!/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("Hex string contains invalid characters");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Encode a string message to UTF-8 bytes. */
export function messageToBytes(message: string): Uint8Array {
  return new TextEncoder().encode(message);
}

/** Generate cryptographically secure random bytes of the given length. */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export type KeyPairResult = {
  publicKey: string;
  secretKey: string;
  publicKeySize: number;
  secretKeySize: number;
};

export type EncapsulateResult = {
  cipherText: string;
  sharedSecret: string;
  cipherTextSize: number;
  sharedSecretSize: number;
};

export type DecapsulateResult = {
  sharedSecret: string;
  sharedSecretSize: number;
};

export type SignResult = {
  signature: string;
  signatureSize: number;
};

// ---------------------------------------------------------------------------
// ML-KEM (Kyber) — FIPS 203 — Key Encapsulation Mechanism
// ---------------------------------------------------------------------------

const ML_KEM_VARIANTS = {
  "ml-kem-512": ml_kem512,
  "ml-kem-768": ml_kem768,
  "ml-kem-1024": ml_kem1024,
} as const;

export function mlKemKeygen(variant: MlKemVariant): KeyPairResult {
  const alg = ML_KEM_VARIANTS[variant];
  const seed = randomBytes(alg.lengths.seed!);
  const { publicKey, secretKey } = alg.keygen(seed);
  return {
    publicKey: toHex(publicKey),
    secretKey: toHex(secretKey),
    publicKeySize: publicKey.length,
    secretKeySize: secretKey.length,
  };
}

export function mlKemEncapsulate(
  variant: MlKemVariant,
  publicKeyHex: string,
): EncapsulateResult {
  const alg = ML_KEM_VARIANTS[variant];
  const publicKey = fromHex(publicKeyHex);
  if (publicKey.length !== alg.lengths.publicKey) {
    throw new Error(
      `Public key must be ${alg.lengths.publicKey} bytes, got ${publicKey.length}`,
    );
  }
  const msg = randomBytes(alg.lengths.msgRand!);
  const { cipherText, sharedSecret } = alg.encapsulate(publicKey, msg);
  return {
    cipherText: toHex(cipherText),
    sharedSecret: toHex(sharedSecret),
    cipherTextSize: cipherText.length,
    sharedSecretSize: sharedSecret.length,
  };
}

export function mlKemDecapsulate(
  variant: MlKemVariant,
  secretKeyHex: string,
  cipherTextHex: string,
): DecapsulateResult {
  const alg = ML_KEM_VARIANTS[variant];
  const secretKey = fromHex(secretKeyHex);
  const cipherText = fromHex(cipherTextHex);
  if (secretKey.length !== alg.lengths.secretKey) {
    throw new Error(
      `Secret key must be ${alg.lengths.secretKey} bytes, got ${secretKey.length}`,
    );
  }
  if (cipherText.length !== alg.lengths.cipherText) {
    throw new Error(
      `Cipher text must be ${alg.lengths.cipherText} bytes, got ${cipherText.length}`,
    );
  }
  const sharedSecret = alg.decapsulate(cipherText, secretKey);
  return {
    sharedSecret: toHex(sharedSecret),
    sharedSecretSize: sharedSecret.length,
  };
}

// ---------------------------------------------------------------------------
// ML-DSA (Dilithium) — FIPS 204 — Lattice-based Digital Signatures
// ---------------------------------------------------------------------------

const ML_DSA_VARIANTS = {
  "ml-dsa-44": ml_dsa44,
  "ml-dsa-65": ml_dsa65,
  "ml-dsa-87": ml_dsa87,
} as const;

export function mlDsaKeygen(variant: MlDsaVariant): KeyPairResult {
  const alg = ML_DSA_VARIANTS[variant];
  const seed = randomBytes(alg.lengths.seed!);
  const { publicKey, secretKey } = alg.keygen(seed);
  return {
    publicKey: toHex(publicKey),
    secretKey: toHex(secretKey),
    publicKeySize: publicKey.length,
    secretKeySize: secretKey.length,
  };
}

export function mlDsaSign(
  variant: MlDsaVariant,
  secretKeyHex: string,
  message: string,
): SignResult {
  const alg = ML_DSA_VARIANTS[variant];
  const secretKey = fromHex(secretKeyHex);
  if (secretKey.length !== alg.lengths.secretKey) {
    throw new Error(
      `Secret key must be ${alg.lengths.secretKey} bytes, got ${secretKey.length}`,
    );
  }
  const msgBytes = messageToBytes(message);
  const signature = alg.sign(msgBytes, secretKey);
  return {
    signature: toHex(signature),
    signatureSize: signature.length,
  };
}

export function mlDsaVerify(
  variant: MlDsaVariant,
  publicKeyHex: string,
  message: string,
  signatureHex: string,
): boolean {
  const alg = ML_DSA_VARIANTS[variant];
  const publicKey = fromHex(publicKeyHex);
  const signature = fromHex(signatureHex);
  if (publicKey.length !== alg.lengths.publicKey) {
    throw new Error(
      `Public key must be ${alg.lengths.publicKey} bytes, got ${publicKey.length}`,
    );
  }
  if (signature.length !== alg.lengths.signature) {
    throw new Error(
      `Signature must be ${alg.lengths.signature} bytes, got ${signature.length}`,
    );
  }
  const msgBytes = messageToBytes(message);
  return alg.verify(signature, msgBytes, publicKey);
}

// ---------------------------------------------------------------------------
// SLH-DSA (SPHINCS+) — FIPS 205 — Hash-based Digital Signatures
// ---------------------------------------------------------------------------

const SLH_DSA_VARIANTS = {
  "slh-dsa-sha2-128f": slh_dsa_sha2_128f,
  "slh-dsa-sha2-128s": slh_dsa_sha2_128s,
  "slh-dsa-sha2-192f": slh_dsa_sha2_192f,
  "slh-dsa-sha2-192s": slh_dsa_sha2_192s,
  "slh-dsa-sha2-256f": slh_dsa_sha2_256f,
  "slh-dsa-sha2-256s": slh_dsa_sha2_256s,
} as const;

export function slhDsaKeygen(variant: SlhDsaVariant): KeyPairResult {
  const alg = SLH_DSA_VARIANTS[variant];
  const seed = randomBytes(alg.lengths.seed!);
  const { publicKey, secretKey } = alg.keygen(seed);
  return {
    publicKey: toHex(publicKey),
    secretKey: toHex(secretKey),
    publicKeySize: publicKey.length,
    secretKeySize: secretKey.length,
  };
}

export function slhDsaSign(
  variant: SlhDsaVariant,
  secretKeyHex: string,
  message: string,
): SignResult {
  const alg = SLH_DSA_VARIANTS[variant];
  const secretKey = fromHex(secretKeyHex);
  if (secretKey.length !== alg.lengths.secretKey) {
    throw new Error(
      `Secret key must be ${alg.lengths.secretKey} bytes, got ${secretKey.length}`,
    );
  }
  const msgBytes = messageToBytes(message);
  const signature = alg.sign(msgBytes, secretKey);
  return {
    signature: toHex(signature),
    signatureSize: signature.length,
  };
}

export function slhDsaVerify(
  variant: SlhDsaVariant,
  publicKeyHex: string,
  message: string,
  signatureHex: string,
): boolean {
  const alg = SLH_DSA_VARIANTS[variant];
  const publicKey = fromHex(publicKeyHex);
  const signature = fromHex(signatureHex);
  if (publicKey.length !== alg.lengths.publicKey) {
    throw new Error(
      `Public key must be ${alg.lengths.publicKey} bytes, got ${publicKey.length}`,
    );
  }
  if (signature.length !== alg.lengths.signature) {
    throw new Error(
      `Signature must be ${alg.lengths.signature} bytes, got ${signature.length}`,
    );
  }
  const msgBytes = messageToBytes(message);
  return alg.verify(signature, msgBytes, publicKey);
}

