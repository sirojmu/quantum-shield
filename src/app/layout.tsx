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
  title: "QuantumShield — Post-Quantum Cryptography",
  description:
    "A post-quantum cryptography toolkit implementing NIST-standardized algorithms: ML-KEM (Kyber), ML-DSA (Dilithium), and SLH-DSA (SPHINCS+). Safe from the threat of quantum computers.",
  keywords: [
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
    title: "QuantumShield — Post-Quantum Cryptography",
    description:
      "A NIST-standardized algorithm toolkit for cryptography resistant to quantum computer attacks.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
