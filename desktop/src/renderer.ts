/**
 * QuantumShield Desktop — renderer logic (vanilla TS).
 * Handles tab switching, file selection, encryption/decryption, and save.
 *
 * Crypto runs entirely in the renderer via @noble/post-quantum + Web Crypto.
 * No network requests are made.
 */

import {
  encryptFile,
  decryptPackage,
  exportKeyPair,
  bytesToBase64,
  base64ToBytes,
  formatBytes,
  KEM_INFO,
  type EncryptedPackage,
  type KemVariant,
} from "./crypto";

// ---------------------------------------------------------------------------
// Electron bridge (optional — falls back to web APIs in a browser)
// ---------------------------------------------------------------------------

interface ElectronAPI {
  saveFile: (bytes: Uint8Array, suggestedName: string, filters: unknown) => Promise<boolean>;
  openFile: () => Promise<{ name: string; bytes: number[]; mimeType: string } | null>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const isElectron = typeof window !== "undefined" && !!window.electronAPI;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

let encFile: { name: string; bytes: Uint8Array; mimeType: string } | null = null;
let encPackage: EncryptedPackage | null = null;
let decResult: { bytes: Uint8Array; filename: string; mimeType: string } | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function setStatus(text: string): void {
  $("status-text").textContent = text;
}

function readFileBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsArrayBuffer(file);
  });
}

function downloadBytes(bytes: Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function savePackage(pkg: EncryptedPackage): Promise<void> {
  const json = JSON.stringify(pkg, null, 2);
  const bytes = new TextEncoder().encode(json);
  const baseName = (pkg.originalFilename || "document").replace(/\.[^.]+$/, "");
  if (isElectron && window.electronAPI) {
    await window.electronAPI.saveFile(bytes, `${baseName}.qenc`, [
      { name: "QuantumShield Package", extensions: ["qenc"] },
      { name: "All Files", extensions: ["*"] },
    ]);
  } else {
    downloadBytes(bytes, `${baseName}.qenc`, "application/json");
  }
}

async function saveDecrypted(bytes: Uint8Array, filename: string): Promise<void> {
  if (isElectron && window.electronAPI) {
    await window.electronAPI.saveFile(bytes, filename, [
      { name: "All Files", extensions: ["*"] },
    ]);
  } else {
    downloadBytes(bytes, filename, "application/octet-stream");
  }
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function initTabs(): void {
  const tabs = document.querySelectorAll<HTMLElement>(".tab");
  const panels = document.querySelectorAll<HTMLElement>(".panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const target = tab.dataset.tab!;
      $(`panel-${target}`).classList.add("active");
    });
  });
}

// ---------------------------------------------------------------------------
// Dropzone helper
// ---------------------------------------------------------------------------

function initDropzone(
  zoneId: string,
  inputId: string,
  onFile: (file: File) => void,
): void {
  const zone = $(zoneId);
  const input = $(inputId) as HTMLInputElement;

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });

  ["dragover", "dragenter"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add("drag");
    }),
  );
  ["dragleave", "drop"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.remove("drag");
    }),
  );
  zone.addEventListener("drop", (e) => {
    const f = (e as DragEvent).dataTransfer?.files?.[0];
    if (f) onFile(f);
  });
  input.addEventListener("change", () => {
    const f = input.files?.[0];
    if (f) onFile(f);
    input.value = "";
  });
}

// ---------------------------------------------------------------------------
// Encrypt panel
// ---------------------------------------------------------------------------

function initEncrypt(): void {
  initDropzone("enc-dropzone", "enc-file-input", async (file) => {
    if (file.size > MAX_SIZE) {
      setStatus("File too large (max 50 MB)");
      return;
    }
    const bytes = await readFileBytes(file);
    encFile = { name: file.name, bytes, mimeType: file.type || "application/octet-stream" };
    $("enc-file-label").textContent = file.name;
    $("enc-file-sub").textContent = `${formatBytes(file.size)} · click to replace`;
    $("enc-dropzone").classList.add("has-file");
    $("enc-btn").disabled = false;
    setStatus(`Loaded: ${file.name}`);
  });

  $("enc-btn").addEventListener("click", async () => {
    if (!encFile) return;
    const variant = ($("enc-variant") as HTMLSelectElement).value as KemVariant;
    const btn = $("enc-btn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Encrypting…';
    setStatus("Encrypting…");
    try {
      const pkg = await encryptFile(variant, encFile.bytes, encFile.name, encFile.mimeType);
      encPackage = pkg;
      const info = KEM_INFO[variant];
      const encSize = Math.floor((pkg.encryptedData.length * 3) / 4);
      $("enc-result").hidden = false;
      $("enc-result").classList.add("ok");
      $("enc-result").classList.remove("err");
      $("enc-result-sub").textContent = `${encFile.name} → ${encFile.name.replace(/\.[^.]+$/, "")}.qenc`;
      $("enc-result-details").innerHTML = `
        <div class="detail"><div class="detail-label">Algorithm</div><div class="detail-value">${info.label} (${info.security})</div></div>
        <div class="detail"><div class="detail-label">Original size</div><div class="detail-value">${formatBytes(encFile.bytes.length)}</div></div>
        <div class="detail"><div class="detail-label">Encrypted size</div><div class="detail-value">${formatBytes(encSize)}</div></div>
        <div class="detail"><div class="detail-label">KEM ciphertext</div><div class="detail-value">${pkg.kemCipherText.slice(0, 24)}…</div></div>
      `;
      $("enc-save-btn").hidden = false;
      setStatus("Encryption complete");
    } catch (err) {
      $("enc-result").hidden = false;
      $("enc-result").classList.add("err");
      $("enc-result").classList.remove("ok");
      $("enc-result-icon").className = "result-icon err";
      $("enc-result-title").textContent = "Encryption failed";
      $("enc-result-sub").textContent = err instanceof Error ? err.message : "Unknown error";
      setStatus("Encryption failed");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> Encrypt &amp; Save`;
    }
  });

  $("enc-save-btn").addEventListener("click", async () => {
    if (!encPackage) return;
    await savePackage(encPackage);
    setStatus("Package saved");
  });
}

// ---------------------------------------------------------------------------
// Decrypt panel
// ---------------------------------------------------------------------------

function initDecrypt(): void {
  initDropzone("dec-dropzone", "dec-file-input", async (file) => {
    $("dec-result").hidden = true;
    setStatus("Decrypting…");
    try {
      const text = await file.text();
      const pkg = JSON.parse(text) as EncryptedPackage;
      const result = await decryptPackage(pkg);
      decResult = result;
      const info = KEM_INFO[pkg.algorithm];
      $("dec-file-label").textContent = file.name;
      $("dec-file-sub").textContent = `${formatBytes(file.size)} · package loaded`;
      $("dec-dropzone").classList.add("has-file");
      $("dec-result").hidden = false;
      $("dec-result").classList.add("ok");
      $("dec-result").classList.remove("err");
      $("dec-result-icon").className = "result-icon ok";
      $("dec-result-icon").innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>';
      $("dec-result-title").textContent = "Decryption successful";
      $("dec-result-sub").textContent = `${result.filename} · ${formatBytes(result.bytes.length)}`;
      $("dec-result-details").innerHTML = `
        <div class="detail"><div class="detail-label">Algorithm</div><div class="detail-value">${info ? info.label : pkg.algorithm}</div></div>
        <div class="detail"><div class="detail-label">Original file</div><div class="detail-value">${result.filename}</div></div>
        <div class="detail"><div class="detail-label">Size</div><div class="detail-value">${formatBytes(result.bytes.length)}</div></div>
        <div class="detail"><div class="detail-label">Created</div><div class="detail-value">${new Date(pkg.createdAt).toLocaleString()}</div></div>
      `;
      $("dec-save-btn").hidden = false;
      setStatus("Decryption complete");
    } catch (err) {
      $("dec-result").hidden = false;
      $("dec-result").classList.add("err");
      $("dec-result").classList.remove("ok");
      $("dec-result-icon").className = "result-icon err";
      $("dec-result-icon").innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      $("dec-result-title").textContent = "Decryption failed";
      $("dec-result-sub").textContent = err instanceof Error ? err.message : "Invalid package";
      $("dec-save-btn").hidden = true;
      setStatus("Decryption failed");
    }
  });

  $("dec-save-btn").addEventListener("click", async () => {
    if (!decResult) return;
    await saveDecrypted(decResult.bytes, decResult.filename);
    setStatus("File saved");
  });
}

// ---------------------------------------------------------------------------
// Keys panel
// ---------------------------------------------------------------------------

function initKeys(): void {
  $("keygen-btn").addEventListener("click", () => {
    const variant = ($("key-variant") as HTMLSelectElement).value as KemVariant;
    const btn = $("keygen-btn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating…';
    setStatus("Generating key pair…");
    try {
      // Web Crypto AES + ML-KEM keygen — give the event loop a tick
      setTimeout(() => {
        try {
          const kp = exportKeyPair(variant);
          $("key-output").hidden = false;
          $("key-public").textContent = kp.publicKeyHex;
          $("key-secret").textContent = kp.secretKeyHex;
          setStatus(
            `Generated ${KEM_INFO[variant].label} key pair (${kp.publicKeySize}+${kp.secretKeySize} bytes)`,
          );
        } catch (err) {
          setStatus("Key generation failed");
          console.error(err);
        } finally {
          btn.disabled = false;
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8"/></svg> Generate Key Pair`;
        }
      }, 30);
    } catch (err) {
      setStatus("Key generation failed");
      btn.disabled = false;
    }
  });

  document.querySelectorAll<HTMLElement>(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const which = btn.dataset.copy;
      const text = which === "public" ? $("key-public").textContent : $("key-secret").textContent;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = orig;
        }, 1400);
      } catch {
        // ignore
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Window controls (Electron)
// ---------------------------------------------------------------------------

function initWindowControls(): void {
  if (!isElectron) {
    // Hide window controls in browser preview
    document.querySelectorAll(".win-btn").forEach((b) => {
      (b as HTMLElement).style.display = "none";
    });
    return;
  }
  $("min-btn").addEventListener("click", () => window.electronAPI?.minimize());
  $("max-btn").addEventListener("click", () => window.electronAPI?.maximize());
  $("close-btn").addEventListener("click", () => window.electronAPI?.close());
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

window.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initEncrypt();
  initDecrypt();
  initKeys();
  initWindowControls();
  setStatus(isElectron ? "Ready (Electron)" : "Ready (browser preview)");
});
