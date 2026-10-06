/**
 * Algorithm metadata for Post-Quantum Cryptography.
 * This file is free of any crypto-library imports, so it can be safely
 * imported from client components without bundling @noble/post-quantum.
 */

export type MlKemVariant = "ml-kem-512" | "ml-kem-768" | "ml-kem-1024";
export type MlDsaVariant = "ml-dsa-44" | "ml-dsa-65" | "ml-dsa-87";
export type SlhDsaVariant =
  | "slh-dsa-sha2-128f"
  | "slh-dsa-sha2-128s"
  | "slh-dsa-sha2-192f"
  | "slh-dsa-sha2-192s"
  | "slh-dsa-sha2-256f"
  | "slh-dsa-sha2-256s";

export type AlgorithmMeta = {
  id: string;
  name: string;
  standard: string;
  fips: string;
  category: "KEM" | "Signature";
  family: string;
  securityLevel: string;
  description: string;
  nistStatus: string;
  variants: {
    id: string;
    label: string;
    security: string;
    publicKeySize: number;
    secretKeySize: number;
    signatureSize?: number;
    cipherTextSize?: number;
    sharedSecretSize?: number;
  }[];
};

export const ALGORITHMS: AlgorithmMeta[] = [
  {
    id: "ml-kem",
    name: "ML-KEM (Kyber)",
    standard: "FIPS 203",
    fips: "FIPS 203",
    category: "KEM",
    family: "Module-Lattice-based",
    securityLevel: "128 / 192 / 256-bit",
    description:
      "Lattice-based Key Encapsulation Mechanism (KEM). Two parties can agree on a shared secret key over an insecure channel without direct key exchange. Resistant to Shor's quantum computer attacks.",
    nistStatus: "Standardized (FIPS 203, August 2024)",
    variants: [
      {
        id: "ml-kem-512",
        label: "ML-KEM-512",
        security: "128-bit (Category 1)",
        publicKeySize: 800,
        secretKeySize: 1632,
        cipherTextSize: 768,
        sharedSecretSize: 32,
      },
      {
        id: "ml-kem-768",
        label: "ML-KEM-768",
        security: "192-bit (Category 3)",
        publicKeySize: 1184,
        secretKeySize: 2400,
        cipherTextSize: 1088,
        sharedSecretSize: 32,
      },
      {
        id: "ml-kem-1024",
        label: "ML-KEM-1024",
        security: "256-bit (Category 5)",
        publicKeySize: 1568,
        secretKeySize: 3168,
        cipherTextSize: 1568,
        sharedSecretSize: 32,
      },
    ],
  },
  {
    id: "ml-dsa",
    name: "ML-DSA (Dilithium)",
    standard: "FIPS 204",
    fips: "FIPS 204",
    category: "Signature",
    family: "Module-Lattice-based",
    securityLevel: "128 / 192 / 256-bit",
    description:
      "Module-LWE lattice-based digital signature scheme. Provides authentication, non-repudiation, and data integrity. Compact signature size and high performance — a leading candidate to replace RSA/ECDSA.",
    nistStatus: "Standardized (FIPS 204, August 2024)",
    variants: [
      {
        id: "ml-dsa-44",
        label: "ML-DSA-44",
        security: "128-bit (Category 2)",
        publicKeySize: 1312,
        secretKeySize: 2560,
        signatureSize: 2420,
      },
      {
        id: "ml-dsa-65",
        label: "ML-DSA-65",
        security: "192-bit (Category 3)",
        publicKeySize: 1952,
        secretKeySize: 4032,
        signatureSize: 3309,
      },
      {
        id: "ml-dsa-87",
        label: "ML-DSA-87",
        security: "256-bit (Category 5)",
        publicKeySize: 2592,
        secretKeySize: 4896,
        signatureSize: 4627,
      },
    ],
  },
  {
    id: "slh-dsa",
    name: "SLH-DSA (SPHINCS+)",
    standard: "FIPS 205",
    fips: "FIPS 205",
    category: "Signature",
    family: "Hash-based (Stateless)",
    securityLevel: "128 / 192 / 256-bit",
    description:
      "Stateless hash-based signature scheme. Does not rely on number-theoretic assumptions — its security depends solely on cryptographic hash functions. Conservative and most resistant to algorithmic advances.",
    nistStatus: "Standardized (FIPS 205, August 2024)",
    variants: [
      {
        id: "slh-dsa-sha2-128f",
        label: "SLH-DSA-SHA2-128f",
        security: "128-bit (fast)",
        publicKeySize: 32,
        secretKeySize: 64,
        signatureSize: 17088,
      },
      {
        id: "slh-dsa-sha2-128s",
        label: "SLH-DSA-SHA2-128s",
        security: "128-bit (small)",
        publicKeySize: 32,
        secretKeySize: 64,
        signatureSize: 7856,
      },
      {
        id: "slh-dsa-sha2-192f",
        label: "SLH-DSA-SHA2-192f",
        security: "192-bit (fast)",
        publicKeySize: 48,
        secretKeySize: 96,
        signatureSize: 35664,
      },
      {
        id: "slh-dsa-sha2-192s",
        label: "SLH-DSA-SHA2-192s",
        security: "192-bit (small)",
        publicKeySize: 48,
        secretKeySize: 96,
        signatureSize: 16224,
      },
      {
        id: "slh-dsa-sha2-256f",
        label: "SLH-DSA-SHA2-256f",
        security: "256-bit (fast)",
        publicKeySize: 64,
        secretKeySize: 128,
        signatureSize: 49856,
      },
      {
        id: "slh-dsa-sha2-256s",
        label: "SLH-DSA-SHA2-256s",
        security: "256-bit (small)",
        publicKeySize: 64,
        secretKeySize: 128,
        signatureSize: 29792,
      },
    ],
  },
];
