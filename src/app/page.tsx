"use client";

import * as React from "react";
import {
  Atom,
  ShieldCheck,
  Lock,
  FileSignature,
  Hash,
  Cpu,
  AlertTriangle,
  Clock,
  BadgeCheck,
  ArrowDown,
  KeyRound,
  Zap,
  Scale,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteHeader } from "@/components/pqc/site-header";
import { MlKemModule } from "@/components/pqc/ml-kem-module";
import { MlDsaModule } from "@/components/pqc/ml-dsa-module";
import { SlhDsaModule } from "@/components/pqc/slh-dsa-module";
import { ALGORITHMS } from "@/lib/pqc-meta";
import { cn } from "@/lib/utils";

function fmt(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export default function Home() {
  return (
    <div id="top" className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <Toolkit />
        <WhyPQC />
        <Comparison />
      </main>

      <SiteFooter />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 quantum-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0 quantum-radial" />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 size-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--primary), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            NIST FIPS 203 · 204 · 205 Distandarisasi
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Kriptografi{" "}
            <span className="text-primary text-glow">Pasca Kuantum</span>{" "}
            yang Siap Pakai
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Toolkit interaktif untuk menghasilkan kunci, menandatangani pesan, dan
            melakukan pertukaran kunci aman menggunakan algoritma standar NIST yang
            tahan terhadap serangan komputer kuantum.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <a href="#toolkit">
                <Atom className="size-4" />
                Mulai Berkarya
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <a href="#why">
                Pelajari Konsep
                <ArrowDown className="size-4" />
              </a>
            </Button>
          </div>

          {/* FIPS badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <FipsBadge code="FIPS 203" label="ML-KEM" />
            <FipsBadge code="FIPS 204" label="ML-DSA" />
            <FipsBadge code="FIPS 205" label="SLH-DSA" />
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Atom} value="3" label="Algoritma Standar" />
          <StatCard icon={ShieldCheck} value="128–256" label="Bit Keamanan" />
          <StatCard icon={BadgeCheck} value="12" label="Varian Parameter" />
          <StatCard icon={Cpu} value="100%" label="Berjalan di Browser" />
        </div>
      </div>
    </section>
  );
}

function FipsBadge({ code, label }: { code: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 backdrop-blur">
      <ShieldCheck className="size-4 text-primary" />
      <div className="text-left">
        <p className="text-xs font-bold leading-none">{code}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-center backdrop-blur">
      <Icon className="mx-auto mb-2 size-5 text-primary" />
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toolkit (Tabs)                                                             */
/* -------------------------------------------------------------------------- */

function Toolkit() {
  return (
    <section id="toolkit" className="scroll-mt-16 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 max-w-2xl">
          <SectionLabel>Toolkit Interaktif</SectionLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Coba algoritma langsung
          </h2>
          <p className="mt-3 text-muted-foreground">
            Setiap tab memungkinkan Anda membuat pasangan kunci, menjalankan
            operasi kriptografi, dan memverifikasi hasilnya — semua terjadi di
            sisi server dengan implementasi <code className="rounded bg-muted px-1.5 py-0.5 text-xs">@noble/post-quantum</code>.
          </p>
        </div>

        <Tabs defaultValue="ml-kem" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="h-auto w-full justify-start gap-1 bg-muted/50 p-1.5 sm:w-auto">
              <TabsTrigger value="ml-kem" className="gap-2 py-2">
                <KeyRound className="size-4" />
                <span>ML-KEM</span>
                <Badge variant="secondary" className="ml-1 hidden text-[10px] sm:inline-flex">
                  KEM
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ml-dsa" className="gap-2 py-2">
                <FileSignature className="size-4" />
                <span>ML-DSA</span>
                <Badge variant="secondary" className="ml-1 hidden text-[10px] sm:inline-flex">
                  Signature
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="slh-dsa" className="gap-2 py-2">
                <Hash className="size-4" />
                <span>SLH-DSA</span>
                <Badge variant="secondary" className="ml-1 hidden text-[10px] sm:inline-flex">
                  Signature
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ml-kem" className="mt-6">
            <ModuleIntro
              algorithm={ALGORITHMS[0]}
              icon={KeyRound}
            />
            <MlKemModule />
          </TabsContent>
          <TabsContent value="ml-dsa" className="mt-6">
            <ModuleIntro algorithm={ALGORITHMS[1]} icon={FileSignature} />
            <MlDsaModule />
          </TabsContent>
          <TabsContent value="slh-dsa" className="mt-6">
            <ModuleIntro algorithm={ALGORITHMS[2]} icon={Hash} />
            <SlhDsaModule />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function ModuleIntro({
  algorithm,
  icon: Icon,
}: {
  algorithm: (typeof ALGORITHMS)[number];
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="mb-6 overflow-hidden border-border/60 bg-card/40">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{algorithm.name}</h3>
            <Badge variant="outline">{algorithm.fips}</Badge>
            <Badge variant="secondary">{algorithm.family}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{algorithm.description}</p>
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="size-3.5" />
            {algorithm.nistStatus}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Why PQC                                                                    */
/* -------------------------------------------------------------------------- */

function WhyPQC() {
  return (
    <section id="why" className="scroll-mt-16 border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 max-w-2xl">
          <SectionLabel>Latar Belakang</SectionLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Mengapa butuh kriptografi pasca kuantum?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Komputer kuantum berkapasitas besar akan mematahkan kriptografi yang
            kita pakai sehari-hari. Persiapan harus dimulai sekarang.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard
            icon={Cpu}
            title="Ancaman Komputer Kuantum"
            tone="warn"
          >
            Algoritma <strong>Shor</strong> yang berjalan di komputer kuantum
            berkapasitas besar dapat memfaktorkan bilangan besar dan menghitung
            logaritma diskret dalam waktu polinomial — mematahkan RSA, DSA, dan
            ECC yang menjadi fondasi internet saat ini.
          </InfoCard>
          <InfoCard icon={Clock} title="Harvest Now, Decrypt Later" tone="warn">
            Penyerang sudah <strong>merekam lalu lintas terenkripsi</strong>{" "}
            hari ini untuk didekripsi nanti ketika komputer kuantum tersedia.
            Data yang harus tetap rahasia selama 10–30 tahun perlu dilindungi
            sejak sekarang.
          </InfoCard>
          <InfoCard icon={ShieldCheck} title="Solusi: Algoritma PQC" tone="ok">
            NIST telah <strong>distandarisasi</strong> tiga algoritma berbasis
            masalah lattice dan hash yang diyakini tahan terhadap serangan
            kuantum maupun klasik — siap diadopsi secara luas.
          </InfoCard>
        </div>

        {/* Categories explanation */}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <CategoryCard
            icon={KeyRound}
            title="Key Encapsulation (KEM)"
            standard="ML-KEM · FIPS 203"
            points={[
              "Dua pihak menyepakati kunci simetris rahasia lewat saluran publik",
              "Pengganti aman untuk pertukaran kunci Diffie-Hellman",
              "Hasil: shared secret 32-byte untuk enkripsi simetris (AES)",
            ]}
          />
          <CategoryCard
            icon={FileSignature}
            title="Tanda Tangan Digital (Signature)"
            standard="ML-DSA & SLH-DSA · FIPS 204/205"
            points={[
              "Membuktikan identitas penanda & integritas pesan",
              "Pengganti aman untuk RSA-PSS & ECDSA",
              "Dua keluarga: lattice (cepat) & hash-based (konservatif)",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  tone: "warn" | "ok";
}) {
  return (
    <Card className={cn("overflow-hidden border-border/60", tone === "warn" && "border-amber-500/20")}>
      <CardHeader>
        <div
          className={cn(
            "mb-2 flex size-10 items-center justify-center rounded-lg",
            tone === "warn"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-emerald-500/10 text-emerald-500",
          )}
        >
          <Icon className="size-5" />
        </div>
        <CardTitle className="flex items-center gap-2 text-lg">
          {tone === "warn" && <AlertTriangle className="size-4 text-amber-500" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}

function CategoryCard({
  icon: Icon,
  title,
  standard,
  points,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  standard: string;
  points: string[];
}) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{standard}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Comparison table                                                            */
/* -------------------------------------------------------------------------- */

function Comparison() {
  return (
    <section id="compare" className="scroll-mt-16 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 max-w-2xl">
          <SectionLabel>Spesifikasi Teknis</SectionLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Perbandingan parameter & ukuran
          </h2>
          <p className="mt-3 text-muted-foreground">
            Setiap algoritma menawarkan trade-off berbeda antara ukuran kunci,
            ukuran tanda tangan, dan tingkat keamanan.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold">Algoritma</th>
                <th className="px-4 py-3 text-left font-semibold">Standar</th>
                <th className="px-4 py-3 text-left font-semibold">Varian</th>
                <th className="px-4 py-3 text-right font-semibold">Pub. Key</th>
                <th className="px-4 py-3 text-right font-semibold">Priv. Key</th>
                <th className="px-4 py-3 text-right font-semibold">Sig / CT</th>
                <th className="px-4 py-3 text-left font-semibold">Keamanan</th>
              </tr>
            </thead>
            <tbody>
              {ALGORITHMS.map((alg) =>
                alg.variants.map((v, i) => (
                  <tr
                    key={v.id}
                    className={cn(
                      "border-b border-border/40 transition-colors hover:bg-muted/30",
                      i === alg.variants.length - 1 && "border-b-0",
                    )}
                  >
                    <td className="px-4 py-3">
                      {i === 0 ? (
                        <span className="font-medium">{alg.name}</span>
                      ) : (
                        <span className="text-muted-foreground">{alg.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {alg.fips}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{v.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {fmt(v.publicKeySize)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {fmt(v.secretKeySize)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {v.signatureSize
                        ? fmt(v.signatureSize)
                        : v.cipherTextSize
                          ? fmt(v.cipherTextSize)
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {v.security}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>

        {/* Trade-off cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <TradeoffCard
            icon={Zap}
            title="Kinerja"
            mlkem="Encapsulation tercepat"
            mldsa="Sign & verify cepat"
            slhdsa="Sign paling lambat"
          />
          <TradeoffCard
            icon={Scale}
            title="Ukuran"
            mlkem="Kunci & CT menengah"
            mldsa="Tanda tangan kompak"
            slhdsa="Kunci kecil, sig sangat besar"
          />
          <TradeoffCard
            icon={ShieldCheck}
            title="Keyakinan"
            mlkem="Lattice (well-studied)"
            mldsa="Lattice (well-studied)"
            slhdsa="Hash (paling konservatif)"
          />
        </div>
      </div>
    </section>
  );
}

function TradeoffCard({
  icon: Icon,
  title,
  mlkem,
  mldsa,
  slhdsa,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  mlkem: string;
  mldsa: string;
  slhdsa: string;
}) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-xs">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[10px]">ML-KEM</Badge>
          <span className="text-right text-muted-foreground">{mlkem}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[10px]">ML-DSA</Badge>
          <span className="text-right text-muted-foreground">{mldsa}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[10px]">SLH-DSA</Badge>
          <span className="text-right text-muted-foreground">{slhdsa}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Atom className="size-4" />
              </div>
              <span className="font-bold">QuantumShield</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Toolkit edukasi untuk kriptografi pasca kuantum. Mengimplementasikan
              algoritma standar NIST dengan <code className="rounded bg-muted px-1 py-0.5 text-xs">@noble/post-quantum</code>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <FooterLink href="#toolkit">Toolkit</FooterLink>
            <FooterLink href="#why">Konsep PQC</FooterLink>
            <FooterLink href="#compare">Perbandingan</FooterLink>
            <FooterLink href="https://csrc.nist.gov/projects/post-quantum-cryptography" external>NIST PQC</FooterLink>
            <FooterLink href="https://noble.post-quantum.org" external>noble-lib</FooterLink>
            <FooterLink href="https://openquantumsafe.org" external>Open Quantum Safe</FooterLink>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p className="flex items-center gap-1.5">
            <Lock className="size-3.5" />
            Semua operasi kriptografi berjalan di sisi server. Tidak ada kunci yang disimpan.
          </p>
          <p>
            Dibuat untuk tujuan edukasi · © {new Date().getFullYear()} QuantumShield
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
      <span className="size-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}
