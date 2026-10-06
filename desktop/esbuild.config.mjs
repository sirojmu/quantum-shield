/**
 * esbuild config — bundles the renderer TS into a single JS file.
 * Also copies index.html and styles.css into dist/.
 */

import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "dist");

// Ensure dist exists
fs.mkdirSync(outDir, { recursive: true });

// Copy static assets
fs.copyFileSync(path.join(__dirname, "index.html"), path.join(outDir, "index.html"));
fs.copyFileSync(path.join(__dirname, "styles.css"), path.join(outDir, "styles.css"));

// Bundle the renderer
await esbuild.build({
  entryPoints: [path.join(__dirname, "src", "renderer.ts")],
  bundle: true,
  outfile: path.join(outDir, "renderer.js"),
  platform: "browser",
  target: "es2020",
  format: "iife",
  minify: !process.env.DEV,
  sourcemap: process.env.DEV ? "inline" : false,
  legalComments: "none",
});

console.log("✓ Renderer bundled → dist/renderer.js");
const stat = fs.statSync(path.join(outDir, "renderer.js"));
console.log(`  size: ${(stat.size / 1024).toFixed(1)} KB`);
