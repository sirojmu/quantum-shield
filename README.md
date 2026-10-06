# QuantumShield

**An interactive post-quantum cryptography (PQC) toolkit** built with Next.js. Generate key pairs, exchange shared secrets, sign messages, sign documents with a signature specimen image, and encrypt files — all using NIST-standardized post-quantum algorithms that resist attacks from quantum computers.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Implemented Algorithms](#implemented-algorithms)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
  - [1. ML-KEM (Kyber) — Key Encapsulation](#1-ml-kem-kyber--key-encapsulation)
  - [2. ML-DSA (Dilithium) — Digital Signatures](#2-ml-dsa-dilithium--digital-signatures)
  - [3. SLH-DSA (SPHINCS+) — Hash-based Signatures](#3-slh-dsa-sphincs--hash-based-signatures)
  - [4. Document Tools — Sign / Verify / Encrypt / Decrypt](#4-document-tools--sign--verify--encrypt--decrypt)
- [Desktop App](#desktop-app)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)
- [Credits](#credits)
- [License](#license)

---

## Overview

QuantumShield is an educational, hands-on toolkit for **post-quantum cryptography** — the next generation of cryptographic algorithms designed to remain secure against both classical and quantum computers.

Large-scale quantum computers will eventually break the cryptography that secures today's internet (RSA, DSA, ECC) using [Shor's algorithm](https://en.wikipedia.org/wiki/Shor%27s_algorithm). NIST has standardized three post-quantum algorithms (FIPS 203, 204, 205 — August 2024) to replace them. This app lets you **try them in your browser**, with all cryptographic operations running server-side via the auditable [`@noble/post-quantum`](https://github.com/paulmillr/noble-post-quantum) library.

> ⚠️ **Educational use only.** This project is designed for learning and experimentation. It has not been formally audited. Do not use it to protect sensitive production data.

---

## Features

- **3 NIST-standardized PQC algorithms** with 12 parameter variants
- **Interactive key exchange** (ML-KEM) with Alice/Bob shared-secret visualization
- **Digital signatures** (ML-DSA, SLH-DSA) with tamper-detection demo mode
- **Document signing** — upload any file + a signature specimen image → produce a downloadable `.qsig` package
- **Document encryption** — encrypt files with ML-KEM + AES-256-GCM → `.qenc` package
- **Verify & decrypt** uploaded packages end-to-end
- **Standalone desktop app** — offline Electron app for file encryption (no server, no network)
- **Dark/light theme** with an emerald "quantum" accent
- **Fully responsive** mobile-first design
- **100% server-side crypto** — no keys are stored

---

## Implemented Algorithms

| Algorithm | Standard | Category | Family | Security Levels | Use Case |
|-----------|----------|----------|--------|-----------------|----------|
| **ML-KEM** (Kyber) | FIPS 203 | KEM | Module-Lattice | 128 / 192 / 256-bit | Key exchange, shared-secret agreement |
| **ML-DSA** (Dilithium) | FIPS 204 | Signature | Module-Lattice | 128 / 192 / 256-bit | Fast digital signatures |
| **SLH-DSA** (SPHINCS+) | FIPS 205 | Signature | Hash-based | 128 / 192 / 256-bit | Conservative, long-term signatures |

### Parameter sizes at a glance

| Variant | Public Key | Secret Key | Signature / Ciphertext |
|---------|-----------|------------|------------------------|
| ML-KEM-512 | 800 B | 1.6 KB | 768 B (CT) |
| ML-KEM-768 | 1.2 KB | 2.3 KB | 1.1 KB (CT) |
| ML-KEM-1024 | 1.5 KB | 3.1 KB | 1.5 KB (CT) |
| ML-DSA-44 | 1.3 KB | 2.5 KB | 2.4 KB |
| ML-DSA-65 | 1.9 KB | 3.9 KB | 3.2 KB |
| ML-DSA-87 | 2.5 KB | 4.8 KB | 4.5 KB |
| SLH-DSA-SHA2-128s | 32 B | 64 B | 7.7 KB |
| SLH-DSA-SHA2-256s | 64 B | 128 B | 29 KB |

---

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** (App Router) + **TypeScript 5**
- **[Tailwind CSS 4](https://tailwindcss.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** components
- **[@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum)** — auditable PQC implementations (FIPS 203/204/205)
- **[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)** — AES-256-GCM for file encryption (client-side)
- **[next-themes](https://github.com/pacocoursey/next-themes)** — dark/light mode
- **[Sonner](https://sonner.emilkowal.ski/)** — toast notifications
- **[Lucide](https://lucide.dev/)** — icons

---

## Getting Started

### Prerequisites

- **Node.js 18.17+** or **[Bun](https://bun.sh/)** runtime
- A terminal / command line

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/quantumshield.git
cd quantumshield

# 2. Install dependencies (choose one)
bun install
# or
npm install
# or
pnpm install
```

### Running the development server

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Linting

```bash
bun run lint
```

### Database (optional)

This project includes Prisma (SQLite) but the PQC tools do not require a database. If you want to extend the app with persistent storage:

```bash
bun run db:push   # push the Prisma schema to SQLite
```

---

## Usage Guide

The app has four main tabs in the **Interactive Toolkit** section.

### 1. ML-KEM (Kyber) — Key Encapsulation

ML-KEM lets two parties agree on a shared secret over an insecure channel.

1. **Generate Key Pair** — creates a public key (shared) and a secret key (private).
2. **Encapsulate (Alice)** — uses the public key to produce a ciphertext + a shared secret.
3. **Decapsulate (Bob)** — uses the secret key + ciphertext to recover the same shared secret.

The app verifies that Alice's and Bob's shared secrets match (32 bytes each), which can then be used as a symmetric key (e.g., AES-256).

**Choose a variant:** ML-KEM-512 (128-bit), ML-KEM-768 (192-bit, default), ML-KEM-1024 (256-bit).

### 2. ML-DSA (Dilithium) — Digital Signatures

ML-DSA provides fast lattice-based digital signatures.

1. **Generate Key Pair** — verification key (public) + signing key (secret).
2. **Sign Message** — type a message and sign it with the secret key.
3. **Verify Signature** — check validity with the public key.

**Tamper demo:** Toggle "Test mode: tamper with message before verification" to see how verification fails when the message is altered after signing.

**Choose a variant:** ML-DSA-44 (128-bit), ML-DSA-65 (192-bit, default), ML-DSA-87 (256-bit).

### 3. SLH-DSA (SPHINCS+) — Hash-based Signatures

SLH-DSA is the most conservative option — its security relies only on hash functions, with no complex number-theoretic assumptions.

1. **Generate Key Pair** — very small keys (32–128 bytes).
2. **Sign Message** — produces a large hash-based signature.
3. **Verify Signature** — validates the signature.

> SLH-DSA signatures are large (8 KB – 50 KB) and signing is slower, but the approach offers the strongest long-term security guarantees.

**Choose a variant:** SHA2-128f/s, SHA2-192f/s, SHA2-256f/s. The `f` (fast) variants sign faster with larger signatures; the `s` (small) variants produce smaller signatures.

### 4. Document Tools — Sign / Verify / Encrypt / Decrypt

The **Documents** tab lets you work with actual files. It has four sub-tools:

#### Sign a Document

1. Upload a **document** (any file type, up to 5 MB).
2. Upload a **signature specimen image** (PNG/JPG — a photo/scan of your handwritten signature).
3. Choose a signature algorithm (ML-DSA or SLH-DSA `s` variants).
4. Click **Sign & Package**.
5. Download the resulting `.qsig` package — a self-contained JSON file with the document, the specimen image, the digital signature (base64), and the public key (hex).

The digital signature is computed over the **raw document bytes**, ensuring any modification is detected. The specimen image is bundled as a visual signature for human recognition.

#### Verify a Signed Document

1. Upload a `.qsig` package.
2. The app automatically verifies the signature against the embedded document and public key.
3. View the result (VALID / INVALID) and download the original document if valid.

#### Encrypt a Document

1. Upload a **document** (any file type, up to 5 MB).
2. Choose an ML-KEM variant.
3. Click **Encrypt & Package**.
4. Download the `.qenc` package.

**How it works:** An ML-KEM key pair is generated, then encapsulation derives a 32-byte shared secret. The file is encrypted **in your browser** with **AES-256-GCM** (Web Crypto API) using that shared secret. The package contains the KEM ciphertext (so the recipient can recover the shared secret), the IV, and the encrypted data.

#### Decrypt a Document

1. Upload a `.qenc` package.
2. The app decapsulates the KEM ciphertext to recover the shared secret, then decrypts the file with AES-256-GCM.
3. Download the recovered document.

> ⚠️ For demo convenience, the encrypted package includes the ML-KEM secret key so you can decrypt later. In production, keep the secret key separate and share only the ciphertext with recipients.

---

## Desktop App

This repository also includes a **standalone desktop application** in the [`desktop/`](desktop) folder — an **offline post-quantum file encryption** tool built with **Electron**.

### Why a desktop app?

The desktop app runs **entirely on your machine**. There is no server, no network calls, and no files ever leave your computer. This makes it ideal for encrypting sensitive documents — the crypto (ML-KEM + AES-256-GCM) runs directly in the app's renderer process.

### What it does (encryption only)

| Tab | Function |
|-----|----------|
| **Encrypt** | Select any file → choose ML-KEM strength (128/192/256-bit) → encrypt with ML-KEM + AES-256-GCM → save a `.qenc` package |
| **Decrypt** | Open a `.qenc` package → recover the original file → save it |
| **Keys** | Generate a post-quantum ML-KEM key pair (public + secret key) to share/keep |

The `.qenc` package format is **compatible with the web app**, so packages created on the web can be decrypted in the desktop app and vice-versa.

### Prerequisites

- **[Node.js](https://nodejs.org/) 18+** (or [Bun](https://bun.sh/))
- For building native binaries: see [electron-builder prerequisites](https://www.electron.build/)

### Install & run

```bash
cd desktop
npm install        # or: bun install
npm run build      # bundles the renderer (esbuild → dist/)
npm start          # launches the Electron window
```

### Build a native installer

```bash
cd desktop
npm run dist       # produces installers in desktop/release/
```

This generates platform-specific installers (`.dmg` for macOS, `.exe`/NSIS for Windows, `.AppImage`/`.deb` for Linux) via `electron-builder`.

### Desktop app architecture

```
desktop/
├── electron/
│   ├── main.js          # Electron main process (window, native file dialogs)
│   └── preload.js       # Secure contextBridge API
├── src/
│   ├── renderer.ts      # UI logic (vanilla TS, browser-compatible)
│   └── crypto.ts        # ML-KEM + AES-GCM (runs in renderer, no server)
├── index.html           # App shell (custom title bar, tabs, status bar)
├── styles.css           # Emerald dark desktop theme
├── esbuild.config.mjs   # Bundler config
└── package.json
```

**Key design choices:**
- **Zero network.** The app makes no HTTP requests. `@noble/post-quantum` is bundled into the renderer; AES-256-GCM uses the native Web Crypto API.
- **Native file dialogs.** Uses Electron's `dialog.showSaveDialog` for a real desktop save experience (falls back to browser download when run in a browser).
- **Custom frameless window** with a draggable title bar and minimize/maximize/close controls.
- **Same package format** as the web app (`.qenc`), so they interoperate.

> ⚠️ As with the web app, the `.qenc` package embeds the ML-KEM secret key so you can decrypt later. **Never share these packages publicly.** For recipient-based encryption, keep the secret key separate and share only the ciphertext.

---

## Project Structure

```
quantumshield/
├── prisma/                      # Prisma schema (optional DB)
├── public/                      # Static assets
├── src/
│   ├── app/
│   │   ├── api/pqc/             # API routes for all crypto operations
│   │   │   ├── ml-kem/{keygen,encapsulate,decapsulate}/
│   │   │   ├── ml-dsa/{keygen,sign,verify,sign-bytes,verify-bytes}/
│   │   │   └── slh-dsa/{keygen,sign,verify,sign-bytes,verify-bytes}/
│   │   ├── globals.css          # Tailwind + theme + custom utilities
│   │   ├── layout.tsx           # Root layout (theme provider, metadata)
│   │   └── page.tsx             # Main page (hero, toolkit tabs, comparison)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   └── pqc/                 # PQC feature components
│   │       ├── ml-kem-module.tsx
│   │       ├── ml-dsa-module.tsx
│   │       ├── slh-dsa-module.tsx
│   │       ├── document-tools.tsx   # File sign/verify/encrypt/decrypt
│   │       ├── site-header.tsx
│   │       ├── hex-block.tsx
│   │       ├── copy-button.tsx
│   │       ├── theme-provider.tsx
│   │       └── theme-toggle.tsx
│   └── lib/
│       ├── pqc.ts               # Server-side crypto library (noble)
│       ├── pqc-meta.ts          # Algorithm metadata (client-safe)
│       ├── bytes.ts             # Base64/hex byte helpers (client-safe)
│       ├── db.ts                # Prisma client
│       └── utils.ts             # cn() helper
├── desktop/                     # Standalone Electron desktop app (encryption only)
│   ├── electron/                # Main process + preload
│   ├── src/                     # Renderer TS (crypto.ts, renderer.ts)
│   ├── index.html               # App shell
│   ├── styles.css               # Desktop theme
│   └── esbuild.config.mjs       # Bundler
├── README.md
├── package.json
└── tsconfig.json
```

---

## Security Notes

- **Educational project.** This toolkit is for learning PQC concepts. It has not undergone formal security review.
- **No keys are stored.** All key pairs are generated fresh on demand. Nothing is persisted to disk or a database.
- **Server-side PQC.** ML-KEM, ML-DSA, and SLH-DSA operations run in Next.js API routes using `@noble/post-quantum`.
- **Client-side AES.** File encryption/decryption uses the browser's native Web Crypto API (AES-256-GCM), so files never leave your machine except for the signing API call (which sends base64 file content).
- **Demo secret keys.** Encrypted (`.qenc`) packages include the ML-KEM secret key for convenience so you can decrypt later. **Never distribute these packages publicly.** In production, keep secret keys separate.
- **Hybrid recommendation.** For real-world deployments, NIST and industry experts recommend **hybrid** schemes (combining classical + post-quantum) during the transition period.

---

## Credits

- **[NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)** — standardization of FIPS 203, 204, 205
- **[@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum)** by Paul Miller — auditable, minimal JS implementations
- **[shadcn/ui](https://ui.shadcn.com/)** — UI component system
- **[Open Quantum Safe](https://openquantumsafe.org/)** — broader PQC ecosystem reference

---

## License

MIT — see [LICENSE](LICENSE). This project bundles [`@noble/post-quantum`](https://github.com/paulmillr/noble-post-quantum) (MIT) and other open-source dependencies; please respect their respective licenses.
