"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Lock,
  Unlock,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
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
import { HexBlock } from "./hex-block";
import { cn } from "@/lib/utils";

type Variant = "ml-kem-512" | "ml-kem-768" | "ml-kem-1024";

const VARIANTS: { id: Variant; label: string; security: string }[] = [
  { id: "ml-kem-512", label: "ML-KEM-512", security: "128-bit" },
  { id: "ml-kem-768", label: "ML-KEM-768", security: "192-bit" },
  { id: "ml-kem-1024", label: "ML-KEM-1024", security: "256-bit" },
];

interface KeyPair {
  publicKey: string;
  secretKey: string;
  publicKeySize: number;
  secretKeySize: number;
}

interface EncapResult {
  cipherText: string;
  sharedSecret: string;
  cipherTextSize: number;
  sharedSecretSize: number;
}

interface DecapResult {
  sharedSecret: string;
  sharedSecretSize: number;
}

export function MlKemModule() {
  const [variant, setVariant] = React.useState<Variant>("ml-kem-768");
  const [keypair, setKeypair] = React.useState<KeyPair | null>(null);
  const [encap, setEncap] = React.useState<EncapResult | null>(null);
  const [decap, setDecap] = React.useState<DecapResult | null>(null);

  const [keygenLoading, setKeygenLoading] = React.useState(false);
  const [encapLoading, setEncapLoading] = React.useState(false);
  const [decapLoading, setDecapLoading] = React.useState(false);

  // Reset downstream state when variant or keypair changes
  function handleVariantChange(v: Variant) {
    setVariant(v);
    setKeypair(null);
    setEncap(null);
    setDecap(null);
  }

  async function runKeygen() {
    setKeygenLoading(true);
    setEncap(null);
    setDecap(null);
    try {
      const res = await fetch("/api/pqc/ml-kem/keygen", {
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
      toast.success("ML-KEM key pair successfully generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate keys");
    } finally {
      setKeygenLoading(false);
    }
  }

  async function runEncapsulate() {
    if (!keypair) return;
    setEncapLoading(true);
    setDecap(null);
    try {
      const res = await fetch("/api/pqc/ml-kem/encapsulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, publicKey: keypair.publicKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      setEncap({
        cipherText: data.cipherText,
        sharedSecret: data.sharedSecret,
        cipherTextSize: data.cipherTextSize,
        sharedSecretSize: data.sharedSecretSize,
      });
      toast.success("Encapsulation successful — shared secret generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to encapsulate");
    } finally {
      setEncapLoading(false);
    }
  }

  async function runDecapsulate() {
    if (!keypair || !encap) return;
    setDecapLoading(true);
    try {
      const res = await fetch("/api/pqc/ml-kem/decapsulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant,
          secretKey: keypair.secretKey,
          cipherText: encap.cipherText,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      setDecap({
        sharedSecret: data.sharedSecret,
        sharedSecretSize: data.sharedSecretSize,
      });
      toast.success("Decapsulation successful");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to decapsulate");
    } finally {
      setDecapLoading(false);
    }
  }

  const secretsMatch = Boolean(
    encap?.sharedSecret && decap?.sharedSecret && encap.sharedSecret === decap.sharedSecret,
  );
  const activeVariant = VARIANTS.find((v) => v.id === variant)!;

  return (
    <div className="space-y-6">
      {/* Header / controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Parameter Set</p>
            <p className="text-xs text-muted-foreground">
              FIPS 203 · Module-Lattice KEM
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

      {/* Step 1: Key generation */}
      <StepCard
        step={1}
        title="Key Pair Generation"
        description="Generate a public & secret key pair. The public key is shared, the secret key is kept safe."
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
            label="Public Key (ek)"
            value={keypair?.publicKey}
            byteCount={keypair?.publicKeySize}
            variant="primary"
          />
          <HexBlock
            label="Secret Key (dk)"
            value={keypair?.secretKey}
            byteCount={keypair?.secretKeySize}
            variant="secret"
          />
        </div>
      </StepCard>

      {/* Steps 2 & 3 side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 2: Encapsulate */}
        <StepCard
          step={2}
          title="Encapsulate — Alice"
          description="Alice uses Bob's public key to generate a ciphertext and a shared secret."
          action={
            <Button
              onClick={runEncapsulate}
              disabled={!keypair || encapLoading}
              variant="outline"
              className="gap-2"
            >
              {encapLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              Encapsulate
            </Button>
          }
        >
          <div className="space-y-4">
            <HexBlock
              label="Cipher Text (c)"
              value={encap?.cipherText}
              byteCount={encap?.cipherTextSize}
              variant="primary"
              emptyHint="Run encapsulation to generate the ciphertext."
            />
            <HexBlock
              label="Shared Secret (K) — Alice"
              value={encap?.sharedSecret}
              byteCount={encap?.sharedSecretSize}
              variant="secret"
              emptyHint="The shared secret will appear here."
            />
          </div>
        </StepCard>

        {/* Step 3: Decapsulate */}
        <StepCard
          step={3}
          title="Decapsulate — Bob"
          description="Bob uses his secret key to recover the shared secret from the ciphertext."
          action={
            <Button
              onClick={runDecapsulate}
              disabled={!encap || decapLoading}
              variant="outline"
              className="gap-2"
            >
              {decapLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Unlock className="size-4" />
              )}
              Decapsulate
            </Button>
          }
        >
          <div className="space-y-4">
            <HexBlock
              label="Shared Secret (K') — Bob"
              value={decap?.sharedSecret}
              byteCount={decap?.sharedSecretSize}
              variant="secret"
              emptyHint="Run decapsulation to recover the shared secret."
            />
            {encap && decap && (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  secretsMatch
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10",
                )}
              >
                {secretsMatch ? (
                  <ShieldCheck className="size-5 shrink-0 text-emerald-500" />
                ) : (
                  <ShieldAlert className="size-5 shrink-0 text-red-500" />
                )}
                <div className="text-sm">
                  <p className="font-medium">
                    {secretsMatch
                      ? "Shared secrets match!"
                      : "Shared secrets do NOT match"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {secretsMatch
                      ? "Alice & Bob now have an identical 256-bit symmetric key for secure communication."
                      : "An error occurred — please check the inputs."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </StepCard>
      </div>

      {/* Flow visualization */}
      {keypair && encap && decap && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-center md:gap-6">
            <FlowNode label="Alice" sub="Encapsulate" icon={Lock} />
            <FlowArrow label={`ciphertext (${encap.cipherTextSize} B)`} />
            <FlowNode label="Bob" sub="Decapsulate" icon={Unlock} />
            <div className="text-xs text-muted-foreground md:mx-2">
              <ArrowRight className="mx-auto size-4 text-emerald-500" />
            </div>
            <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Shared Secret K = K&apos; ({decap.sharedSecretSize} bytes)
            </div>
          </div>
        </div>
      )}
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

function FlowNode({
  label,
  sub,
  icon: Icon,
}: {
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <RefreshCw className="size-4 text-muted-foreground" />
    </div>
  );
}
