import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/pqc/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuantumShield — Kriptografi Pasca Kuantum",
  description:
    "Toolkit kriptografi pasca kuantum yang mengimplementasikan algoritma standar NIST: ML-KEM (Kyber), ML-DSA (Dilithium), dan SLH-DSA (SPHINCS+). Aman dari ancaman komputer kuantum.",
  keywords: [
    "kriptografi pasca kuantum",
    "post-quantum cryptography",
    "PQC",
    "ML-KEM",
    "Kyber",
    "ML-DSA",
    "Dilithium",
    "SLH-DSA",
    "SPHINCS+",
    "NIST",
    "FIPS 203",
    "FIPS 204",
    "FIPS 205",
    "quantum-safe",
  ],
  authors: [{ name: "QuantumShield" }],
  openGraph: {
    title: "QuantumShield — Kriptografi Pasca Kuantum",
    description:
      "Toolkit algoritma standar NIST untuk kriptografi tahan serangan komputer kuantum.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
