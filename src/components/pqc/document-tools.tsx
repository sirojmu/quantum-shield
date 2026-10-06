"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileText,
  PenTool,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  KeyRound,
  Package,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { hexToBytes, bytesToBase64, base64ToBytes, formatBytes } from "@/lib/bytes";
import { ALGORITHMS } from "@/lib/pqc-meta";

// ---------------------------------------------------------------------------
// Constants & variant lists
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

const mlDsaMeta = ALGORITHMS.find((a) => a.id === "ml-dsa")!;
const slhDsaMeta = ALGORITHMS.find((a) => a.id === "slh-dsa")!;
const mlKemMeta = ALGORITHMS.find((a) => a.id === "ml-kem")!;

// Signature "small" variants are preferred for documents (smaller signatures).
const SIGN_VARIANTS = [
  ...mlDsaMeta.variants,
  ...slhDsaMeta.variants.filter((v) => v.id.endsWith("s")),
];
const KEM_VARIANTS = mlKemMeta.variants;

// ---------------------------------------------------------------------------
// Package types
// ---------------------------------------------------------------------------

interface SignedPackage {
  version: string;
  type: "quantumshield-signed-document";
  algorithm: string;
  createdAt: string;
  document: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    data: string; // base64
  };
  signatureSpecimen: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    data: string; // base64
  } | null;
  signature: string; // base64
  publicKey: string; // hex
}

interface EncryptedPackage {
  version: string;
  type: "quantumshield-encrypted-document";
  algorithm: string;
  createdAt: string;
  kemCipherText: string; // hex
  kemPublicKey: string; // hex
  kemSecretKey: string; // hex (demo — needed to decrypt)
  iv: string; // base64
  encryptedData: string; // base64
  originalFilename: string;
  originalMimeType: string;
  originalSizeBytes: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function readFileAsBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function downloadBytes(data: Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

function downloadJSON(obj: unknown, filename: string) {
  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function signEndpoint(variant: string) {
  return variant.startsWith("slh")
    ? "/api/pqc/slh-dsa/sign-bytes"
    : "/api/pqc/ml-dsa/sign-bytes";
}

function verifyEndpoint(variant: string) {
  return variant.startsWith("slh")
    ? "/api/pqc/slh-dsa/verify-bytes"
    : "/api/pqc/ml-dsa/verify-bytes";
}

function keygenEndpoint(variant: string) {
  return variant.startsWith("slh")
    ? "/api/pqc/slh-dsa/keygen"
    : "/api/pqc/ml-dsa/keygen";
}

async function aesEncrypt(
  data: Uint8Array,
  sharedSecretHex: string,
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const keyBytes = hexToBytes(sharedSecretHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data,
  );
  return { iv, ciphertext: new Uint8Array(encrypted) };
}

async function aesDecrypt(
  ciphertext: Uint8Array,
  sharedSecretHex: string,
  iv: Uint8Array,
): Promise<Uint8Array> {
  const keyBytes = hexToBytes(sharedSecretHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext,
  );
  return new Uint8Array(decrypted);
}

// ---------------------------------------------------------------------------
// FileDropZone
// ---------------------------------------------------------------------------

interface FileDropZoneProps {
  label: string;
  accept?: string;
  file: File | null;
  onFile: (file: File) => void;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  maxSize?: number;
}

function FileDropZone({
  label,
  accept,
  file,
  onFile,
  icon: Icon = FileText,
  description,
  maxSize = MAX_FILE_SIZE,
}: FileDropZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function handleFile(f: File) {
    if (maxSize && f.size > maxSize) {
      toast.error(`File too large. Maximum size is ${formatBytes(maxSize)}.`);
      return;
    }
    onFile(f);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border/60 hover:border-primary/50 hover:bg-muted/30",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {file ? (
        <>
          <Icon className="size-7 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <p className="text-xs text-muted-foreground/70">Click to replace</p>
        </>
      ) : (
        <>
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <Upload className="size-5" />
          </div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result banner
// ---------------------------------------------------------------------------

function ResultBanner({
  valid,
  loading,
}: {
  valid: boolean | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <Loader2 className="size-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying…</p>
      </div>
    );
  }
  if (valid === null) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-4 text-muted-foreground">
        <ShieldAlert className="size-5 shrink-0" />
        <p className="text-sm">Run verification to check signature validity.</p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4",
        valid
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-red-500/30 bg-red-500/10",
      )}
    >
      {valid ? (
        <CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="size-6 shrink-0 text-red-500" />
      )}
      <div>
        <p className="font-semibold">
          {valid ? "Signature VALID" : "Signature INVALID"}
        </p>
        <p className="text-sm text-muted-foreground">
          {valid
            ? "Integrity & authenticity verified — the document is genuine and unmodified."
            : "Verification failed — the document or signature does not match."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sign Document
// ---------------------------------------------------------------------------

function SignDocument() {
  const [variant, setVariant] = React.useState("ml-dsa-65");
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [specimenFile, setSpecimenFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pkg, setPkg] = React.useState<SignedPackage | null>(null);
  const [specimenPreview, setSpecimenPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (specimenFile) {
      const url = URL.createObjectURL(specimenFile);
      setSpecimenPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setSpecimenPreview(null);
  }, [specimenFile]);

  function reset() {
    setDocFile(null);
    setSpecimenFile(null);
    setPkg(null);
  }

  async function handleSign() {
    if (!docFile) {
      toast.error("Please select a document to sign.");
      return;
    }
    if (!specimenFile) {
      toast.error("Please upload your signature specimen image.");
      return;
    }
    setLoading(true);
    setPkg(null);
    try {
      // 1. Generate key pair
      const kgRes = await fetch(keygenEndpoint(variant), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant }),
      });
      const kg = await kgRes.json();
      if (!kg.ok) throw new Error(kg.error);

      // 2. Read document as base64
      const docBase64 = await readFileAsBase64(docFile);

      // 3. Sign the document bytes
      const signRes = await fetch(signEndpoint(variant), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant,
          secretKey: kg.secretKey,
          messageBase64: docBase64,
        }),
      });
      const sig = await signRes.json();
      if (!sig.ok) throw new Error(sig.error);

      // 4. Read specimen image as base64
      const specimenBase64 = await readFileAsBase64(specimenFile);

      // 5. Build the signed package
      const newPkg: SignedPackage = {
        version: "1.0",
        type: "quantumshield-signed-document",
        algorithm: variant,
        createdAt: new Date().toISOString(),
        document: {
          filename: docFile.name,
          mimeType: docFile.type || "application/octet-stream",
          sizeBytes: docFile.size,
          data: docBase64,
        },
        signatureSpecimen: {
          filename: specimenFile.name,
          mimeType: specimenFile.type || "image/png",
          sizeBytes: specimenFile.size,
          data: specimenBase64,
        },
        signature: sig.signatureBase64,
        publicKey: kg.publicKey,
      };
      setPkg(newPkg);
      toast.success("Document signed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signing failed");
    } finally {
      setLoading(false);
    }
  }

  const baseName = docFile?.name.replace(/\.[^.]+$/, "") ?? "document";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenTool className="size-4 text-primary" />
            Sign a Document
          </CardTitle>
          <CardDescription>
            Upload a document and your handwritten signature specimen image. The
            document is signed with a post-quantum digital signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Document to sign
            </Label>
            <FileDropZone
              label="Drop a document here or click to browse"
              description="Any file type · max 5 MB"
              file={docFile}
              onFile={setDocFile}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Signature specimen image
            </Label>
            <FileDropZone
              label="Drop your signature image here"
              description="PNG or JPG · max 2 MB"
              accept="image/png,image/jpeg"
              icon={FileCheck2}
              file={specimenFile}
              onFile={setSpecimenFile}
              maxSize={MAX_IMAGE_SIZE}
            />
            {specimenPreview && (
              <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-2">
                <img
                  src={specimenPreview}
                  alt="Signature specimen preview"
                  className="mx-auto max-h-32 object-contain"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Signature algorithm
            </Label>
            <Select value={variant} onValueChange={setVariant}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIGN_VARIANTS.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label} · {v.security}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSign} disabled={loading} className="flex-1 gap-2">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PenTool className="size-4" />
              )}
              Sign &amp; Package
            </Button>
            {(docFile || specimenFile) && (
              <Button variant="outline" onClick={reset} disabled={loading}>
                Reset
              </Button>
            )}
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            <span>
              The signing key pair is generated fresh each time. The secret key is
              NOT included in the package — only the public key needed for
              verification.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-primary" />
            Signed Package
          </CardTitle>
          <CardDescription>
            Download the self-contained <code className="rounded bg-muted px-1 text-xs">.qsig</code> package.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pkg ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 p-6 text-center text-muted-foreground">
              <FileText className="size-8 opacity-40" />
              <p className="text-sm">Your signed package will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Algorithm" value={pkg.algorithm} />
                <Info label="Created" value={new Date(pkg.createdAt).toLocaleString()} />
                <Info label="Document" value={pkg.document.filename} />
                <Info label="Document size" value={formatBytes(pkg.document.sizeBytes)} />
                <Info
                  label="Signature size"
                  value={formatBytes(Math.floor((pkg.signature.length * 3) / 4))}
                />
                <Info label="Public key" value={`${pkg.publicKey.slice(0, 16)}…`} />
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Signature specimen
                </p>
                {pkg.signatureSpecimen && (
                  <img
                    src={`data:${pkg.signatureSpecimen.mimeType};base64,${pkg.signatureSpecimen.data}`}
                    alt="Signature specimen"
                    className="mx-auto max-h-28 object-contain"
                  />
                )}
              </div>
              <Button
                onClick={() => downloadJSON(pkg, `${baseName}.qsig`)}
                className="w-full gap-2"
              >
                <Download className="size-4" />
                Download .qsig package
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Verify Document
// ---------------------------------------------------------------------------

function VerifyDocument() {
  const [pkgFile, setPkgFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [valid, setValid] = React.useState<boolean | null>(null);
  const [pkg, setPkg] = React.useState<SignedPackage | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleVerify(file: File) {
    setLoading(true);
    setValid(null);
    setError(null);
    setPkg(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SignedPackage;
      if (parsed.type !== "quantumshield-signed-document") {
        throw new Error("Not a valid QuantumShield signed package.");
      }
      setPkg(parsed);
      const res = await fetch(verifyEndpoint(parsed.algorithm), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant: parsed.algorithm,
          publicKey: parsed.publicKey,
          messageBase64: parsed.document.data,
          signatureBase64: parsed.signature,
        }),
      });
      const data = await res.json();
      setValid(Boolean(data.valid));
      if (data.valid) {
        toast.success("Signature is VALID — document verified.");
      } else {
        toast.warning("Signature is INVALID — document may be tampered.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to verify package";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function downloadOriginal() {
    if (!pkg) return;
    const bytes = base64ToBytes(pkg.document.data);
    downloadBytes(
      bytes,
      pkg.document.filename,
      pkg.document.mimeType || "application/octet-stream",
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Verify a Signed Document
          </CardTitle>
          <CardDescription>
            Upload a <code className="rounded bg-muted px-1 text-xs">.qsig</code> package
            to check its digital signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropZone
            label="Drop a .qsig package here"
            description="JSON package · max 5 MB"
            accept=".qsig,.json,application/json"
            file={pkgFile}
            onFile={(f) => {
              setPkgFile(f);
              handleVerify(f);
            }}
          />
          {pkg && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Algorithm" value={pkg.algorithm} />
              <Info label="Created" value={new Date(pkg.createdAt).toLocaleString()} />
              <Info label="Document" value={pkg.document.filename} />
              <Info label="Size" value={formatBytes(pkg.document.sizeBytes)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck2 className="size-4 text-primary" />
            Verification Result
          </CardTitle>
          <CardDescription>Integrity & authenticity check.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <XCircle className="size-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <ResultBanner valid={valid} loading={loading} />
          )}
          {pkg?.signatureSpecimen && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Signature specimen
              </p>
              <img
                src={`data:${pkg.signatureSpecimen.mimeType};base64,${pkg.signatureSpecimen.data}`}
                alt="Signature specimen"
                className="mx-auto max-h-28 object-contain"
              />
            </div>
          )}
          {pkg && valid !== null && !error && (
            <Button onClick={downloadOriginal} variant="outline" className="w-full gap-2">
              <Download className="size-4" />
              Download original document
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Encrypt Document
// ---------------------------------------------------------------------------

function EncryptDocument() {
  const [variant, setVariant] = React.useState("ml-kem-768");
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pkg, setPkg] = React.useState<EncryptedPackage | null>(null);

  async function handleEncrypt() {
    if (!docFile) {
      toast.error("Please select a document to encrypt.");
      return;
    }
    setLoading(true);
    setPkg(null);
    try {
      // 1. Generate ML-KEM key pair
      const kgRes = await fetch("/api/pqc/ml-kem/keygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant }),
      });
      const kg = await kgRes.json();
      if (!kg.ok) throw new Error(kg.error);

      // 2. Encapsulate to derive a shared secret
      const encRes = await fetch("/api/pqc/ml-kem/encapsulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, publicKey: kg.publicKey }),
      });
      const enc = await encRes.json();
      if (!enc.ok) throw new Error(enc.error);

      // 3. Read file bytes
      const fileBytes = await readFileAsBytes(docFile);

      // 4. AES-GCM encrypt using the shared secret (32 bytes = AES-256)
      const { iv, ciphertext } = await aesEncrypt(fileBytes, enc.sharedSecret);

      // 5. Build package
      const newPkg: EncryptedPackage = {
        version: "1.0",
        type: "quantumshield-encrypted-document",
        algorithm: variant,
        createdAt: new Date().toISOString(),
        kemCipherText: enc.cipherText,
        kemPublicKey: kg.publicKey,
        kemSecretKey: kg.secretKey,
        iv: bytesToBase64(iv),
        encryptedData: bytesToBase64(ciphertext),
        originalFilename: docFile.name,
        originalMimeType: docFile.type || "application/octet-stream",
        originalSizeBytes: docFile.size,
      };
      setPkg(newPkg);
      toast.success("Document encrypted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Encryption failed");
    } finally {
      setLoading(false);
    }
  }

  const baseName = docFile?.name.replace(/\.[^.]+$/, "") ?? "document";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4 text-primary" />
            Encrypt a Document
          </CardTitle>
          <CardDescription>
            The document is encrypted with AES-256-GCM using a key derived from
            ML-KEM post-quantum key encapsulation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropZone
            label="Drop a document here or click to browse"
            description="Any file type · max 5 MB"
            file={docFile}
            onFile={setDocFile}
          />
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              KEM algorithm
            </Label>
            <Select value={variant} onValueChange={setVariant}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEM_VARIANTS.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label} · {v.security}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleEncrypt}
            disabled={loading || !docFile}
            className="w-full gap-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Lock className="size-4" />
            )}
            Encrypt &amp; Package
          </Button>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            <span>
              The package includes the ML-KEM secret key so you can decrypt later.
              In production, keep the secret key separate and share only the
              ciphertext with recipients.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-primary" />
            Encrypted Package
          </CardTitle>
          <CardDescription>
            Download the self-contained <code className="rounded bg-muted px-1 text-xs">.qenc</code> package.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pkg ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 p-6 text-center text-muted-foreground">
              <Lock className="size-8 opacity-40" />
              <p className="text-sm">Your encrypted package will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Algorithm" value={pkg.algorithm} />
                <Info label="Created" value={new Date(pkg.createdAt).toLocaleString()} />
                <Info label="Original file" value={pkg.originalFilename} />
                <Info label="Original size" value={formatBytes(pkg.originalSizeBytes)} />
                <Info
                  label="Encrypted size"
                  value={formatBytes(Math.floor((pkg.encryptedData.length * 3) / 4))}
                />
                <Info
                  label="KEM ciphertext"
                  value={`${pkg.kemCipherText.slice(0, 16)}…`}
                />
              </div>
              <Button
                onClick={() => downloadJSON(pkg, `${baseName}.qenc`)}
                className="w-full gap-2"
              >
                <Download className="size-4" />
                Download .qenc package
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decrypt Document
// ---------------------------------------------------------------------------

function DecryptDocument() {
  const [pkgFile, setPkgFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    bytes: Uint8Array;
    filename: string;
    mimeType: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDecrypt(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as EncryptedPackage;
      if (parsed.type !== "quantumshield-encrypted-document") {
        throw new Error("Not a valid QuantumShield encrypted package.");
      }
      // 1. Decapsulate to recover the shared secret
      const decRes = await fetch("/api/pqc/ml-kem/decapsulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant: parsed.algorithm,
          secretKey: parsed.kemSecretKey,
          cipherText: parsed.kemCipherText,
        }),
      });
      const dec = await decRes.json();
      if (!dec.ok) throw new Error(dec.error);

      // 2. AES-GCM decrypt
      const ciphertext = base64ToBytes(parsed.encryptedData);
      const iv = base64ToBytes(parsed.iv);
      const plaintext = await aesDecrypt(ciphertext, dec.sharedSecret, iv);

      setResult({
        bytes: plaintext,
        filename: parsed.originalFilename,
        mimeType: parsed.originalMimeType,
      });
      toast.success("Document decrypted successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to decrypt package";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Unlock className="size-4 text-primary" />
            Decrypt a Document
          </CardTitle>
          <CardDescription>
            Upload a <code className="rounded bg-muted px-1 text-xs">.qenc</code> package
            to recover the original document.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileDropZone
            label="Drop a .qenc package here"
            description="JSON package · max 5 MB"
            accept=".qenc,.json,application/json"
            file={pkgFile}
            onFile={(f) => {
              setPkgFile(f);
              handleDecrypt(f);
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck2 className="size-4 text-primary" />
            Decryption Result
          </CardTitle>
          <CardDescription>Recovered document.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Decrypting…</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <XCircle className="size-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {!loading && !error && !result && (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 p-6 text-center text-muted-foreground">
              <Unlock className="size-8 opacity-40" />
              <p className="text-sm">The decrypted document will appear here.</p>
            </div>
          )}
          {result && !loading && !error && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-semibold">Decryption successful</p>
                  <p className="text-sm text-muted-foreground">
                    {result.filename} · {formatBytes(result.bytes.length)}
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  downloadBytes(result.bytes, result.filename, result.mimeType)
                }
                className="w-full gap-2"
              >
                <Download className="size-4" />
                Download decrypted document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small Info helper
// ---------------------------------------------------------------------------

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DocumentTools() {
  return (
    <Tabs defaultValue="sign" className="w-full">
      <div className="overflow-x-auto pb-2">
        <TabsList className="h-auto w-full justify-start gap-1 bg-muted/50 p-1.5 sm:w-auto">
          <TabsTrigger value="sign" className="gap-1.5 py-2 text-xs sm:text-sm">
            <PenTool className="size-4" />
            Sign
          </TabsTrigger>
          <TabsTrigger value="verify" className="gap-1.5 py-2 text-xs sm:text-sm">
            <ShieldCheck className="size-4" />
            Verify
          </TabsTrigger>
          <TabsTrigger value="encrypt" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Lock className="size-4" />
            Encrypt
          </TabsTrigger>
          <TabsTrigger value="decrypt" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Unlock className="size-4" />
            Decrypt
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="sign" className="mt-6">
        <SignDocument />
      </TabsContent>
      <TabsContent value="verify" className="mt-6">
        <VerifyDocument />
      </TabsContent>
      <TabsContent value="encrypt" className="mt-6">
        <EncryptDocument />
      </TabsContent>
      <TabsContent value="decrypt" className="mt-6">
        <DecryptDocument />
      </TabsContent>
    </Tabs>
  );
}
