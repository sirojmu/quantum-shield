"use client";

import * as React from "react";
import { Atom, Github, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <div className="relative flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary transition-all group-hover:bg-primary/25">
            <Atom className="size-5" />
            <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-primary/20" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight">
              QuantumShield
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Post-Quantum Crypto
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="#toolkit">Toolkit</NavLink>
          <NavLink href="#why">Why PQC?</NavLink>
          <NavLink href="#compare">Comparison</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden size-9 rounded-full sm:inline-flex"
          >
            <a
              href="https://csrc.nist.gov/projects/post-quantum-cryptography"
              target="_blank"
              rel="noreferrer"
              aria-label="NIST PQC Documentation"
            >
              <ShieldCheck className="size-4" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </a>
  );
}
