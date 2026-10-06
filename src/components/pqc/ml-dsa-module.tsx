"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  KeyRound,
  PenTool,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HexBlock } from "./hex-block";
import { cn } from "@/lib/utils";

type Variant = "ml-dsa-44" | "ml-dsa-65" | "ml-dsa-87";

const VARIANTS: { id: Variant; label: string; security: string }[] = [
  { id: "ml-dsa-44", label: "ML-DSA-44", security: "128-bit" },
  { id: "ml-dsa-65", label: "ML-DSA-65", security: "192-bit" },
  { id: "ml-dsa-87", label: "ML-DSA-87", security: "256-bit" },
];

interface KeyPair {
  publicKey: string;
  secretKey: string;
  publicKeySize: number;
  secretKeySize: number;
}

interface SignResult {
  signature: string;
  signatureSize: number;
}

const DEFAULT_MESSAGE =
  "Transaction #42-2025: Transfer 1,000,000 IDR to account 9876-5432. Non-repudiation required.";

export function MlDsaModule() {
  const [variant, setVariant] = React.useState<Variant>("ml-dsa-65");
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE);
  const [keypair, setKeypair] = React.useState<KeyPair | null>(null);
  const [signature, setSignature] = React.useState<SignResult | null>(null);
  const [verifyResult, setVerifyResult] = React.useState<boolean | null>(null);
  const [tampered, setTampered] = React.useState(false);

  const [keygenLoading, setKeygenLoading] = React.useState(false);
  const [signLoading, setSignLoading] = React.useState(false);
  const [verifyLoading, setVerifyLoading] = React.useState(false);

  function handleVariantChange(v: Variant) {
    setVariant(v);
    setKeypair(null);
    setSignature(null);
    setVerifyResult(null);
  }

  async function runKeygen() {
    setKeygenLoading(true);
    setSignature(null);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/pqc/ml-dsa/keygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      setKeypair({
        publicKey: data.publicKey,
        secretKey: data.secretKey,
        publicKeySize: data.publicKeySize,
        secretKeySize: data.secretKeySize,
      });
      toast.success("ML-DSA key pair successfully generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate keys");
    } finally {
      setKeygenLoading(false);
    }
  }

  async function runSign() {
    if (!keypair) return;
    setSignLoading(true);
    setSignature(null);
    setVerifyResult(null);
    setTampered(false);
    try {
      const res = await fetch("/api/pqc/ml-dsa/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, secretKey: keypair.secretKey, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      setSignature({
        signature: data.signature,
        signatureSize: data.signatureSize,
      });
      toast.success("Digital signature successfully generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign");
    } finally {
      setSignLoading(false);
    }
  }

  async function runVerify() {
    if (!keypair || !signature) return;
    setVerifyLoading(true);
    try {
      // If tampered, alter the message slightly to demonstrate verification failure
      const verifyMessage = tampered ? message + " " : message;
      const res = await fetch("/api/pqc/ml-dsa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant,
          publicKey: keypair.publicKey,
          message: verifyMessage,
          signature: signature.signature,
        }),
      });
      const data = await res.json();
      setVerifyResult(Boolean(data.valid));
      if (data.valid) {
        toast.success("Signature VALID — integrity & authenticity verified");
      } else {
        toast.warning("Signature INVALID — message was tampered");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to verify");
    } finally {
      setVerifyLoading(false);
    }
  }

  const activeVariant = VARIANTS.find((v) => v.id === variant)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileSignature className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Parameter Set</p>
            <p className="text-xs text-muted-foreground">
              FIPS 204 · Lattice-based Signature
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={variant} onValueChange={(v) => handleVariantChange(v as Variant)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIANTS.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {activeVariant.security}
          </Badge>
        </div>
      </div>

      {/* Step 1: Keygen */}
      <StepCard
        step={1}
        title="Key Pair Generation"
        description="Public key for verification, secret key for signing."
        action={
          <Button onClick={runKeygen} disabled={keygenLoading} className="gap-2">
            {keygenLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {keypair ? "Regenerate Keys" : "Generate Key Pair"}
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <HexBlock
            label="Verification Key (pk)"
            value={keypair?.publicKey}
            byteCount={keypair?.publicKeySize}
            variant="primary"
          />
          <HexBlock
            label="Signing Key (sk)"
            value={keypair?.secretKey}
            byteCount={keypair?.secretKeySize}
            variant="secret"
          />
        </div>
      </StepCard>

      {/* Step 2: Sign */}
      <StepCard
        step={2}
        title="Sign Message"
        description="The signature is created with the secret key. Anyone can verify it using the public key."
        action={
          <Button
            onClick={runSign}
            disabled={!keypair || signLoading || !message}
            variant="outline"
            className="gap-2"
          >
            {signLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PenTool className="size-4" />
            )}
            Sign
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ml-dsa-msg" className="text-xs uppercase tracking-wide text-muted-foreground">
              Message to be signed
            </Label>
            <Textarea
              id="ml-dsa-msg"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setVerifyResult(null);
              }}
              rows={3}
              className="resize-none font-mono text-sm"
              placeholder="Write your message here..."
            />
          </div>
          <HexBlock
            label="Signature (σ)"
            value={signature?.signature}
            byteCount={signature?.signatureSize}
            variant="primary"
            emptyHint="The signature will appear here after signing."
          />
        </div>
      </StepCard>

      {/* Step 3: Verify */}
      <StepCard
        step={3}
        title="Verify Signature"
        description="Check whether the signature is valid for the given message & public key."
        action={
          <Button
            onClick={runVerify}
            disabled={!signature || verifyLoading}
            variant="outline"
            className="gap-2"
          >
            {verifyLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Verify
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <Switch
                id="tamper"
                checked={tampered}
                onCheckedChange={(c) => {
                  setTampered(c);
                  setVerifyResult(null);
                }}
              />
              <Label htmlFor="tamper" className="cursor-pointer text-sm">
                Test mode: tamper with message before verification
              </Label>
            </div>
            <span className="text-xs text-muted-foreground">
              {tampered ? "Message modified (+space)" : "Original message"}
            </span>
          </div>

          {verifyResult !== null && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4",
                verifyResult
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/10",
              )}
            >
              {verifyResult ? (
                <CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="size-6 shrink-0 text-red-500" />
              )}
              <div>
                <p className="font-semibold">
                  {verifyResult
                    ? "Signature VALID"
                    : "Signature INVALID"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {verifyResult
                    ? "The message is proven authentic and unchanged since signing."
                    : "Verification failed — the message was tampered or the key does not match."}
                </p>
              </div>
            </div>
          )}

          {verifyResult === null && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-4 text-muted-foreground">
              <ShieldAlert className="size-5 shrink-0" />
              <p className="text-sm">
                Run verification to check signature validity.
              </p>
            </div>
          )}
        </div>
      </StepCard>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  action,
  children,
}: {
  step: number;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {step}
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
