/**
 * Builds a static, self-contained design preview (preview/dist) of the Phase 1
 * UI using the real components + demo data. Uses esbuild + Tailwind v4's
 * compile API; no Next.js server required.
 *   tsx preview/build.ts
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { compile } from "tailwindcss";

async function main() {
const root = join(__dirname, "..");
const out = join(root, "preview/dist");
const req = createRequire(join(process.env.NODE_PATH?.split(":")[0] ?? join(root, "node_modules"), "_"));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. JS bundle
await build({
  entryPoints: [join(root, "preview/app.tsx")],
  bundle: true, minify: true, format: "esm", target: "es2020", jsx: "automatic",
  outfile: join(out, "app.js"),
  tsconfig: join(root, "tsconfig.json"),
  nodePaths: (process.env.NODE_PATH ?? "").split(":").filter(Boolean),
  define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' },
  alias: {
    "next/link": join(root, "preview/shims/next-link.tsx"),
    "next/image": join(root, "preview/shims/next-image.tsx"),
    "next/navigation": join(root, "preview/shims/next-navigation.ts"),
    "lucide-react": join(root, "preview/shims/lucide-react.ts"),
    "next/headers": join(root, "preview/shims/empty.ts"),
    "server-only": join(root, "preview/shims/empty.ts"),
    "@supabase/ssr": join(root, "preview/shims/empty.ts"),
  },
  logLevel: "warning",
});

// 2. Tailwind CSS (scan sources for candidate class names)
const files: string[] = [];
const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) && files.push(p); });
walk(join(root, "src")); walk(join(root, "preview"));
const candidates = new Set<string>();
for (const f of files) for (const t of readFileSync(f, "utf8").split(/[\s"'`{}]+/)) if (t && /^[!-~]+$/.test(t)) candidates.add(t.replace(/[,;]$/, ""));
const css = readFileSync(join(root, "src/styles/globals.css"), "utf8");
const twDir = dirname(req.resolve("tailwindcss/package.json"));
const compiler = await compile(css, {
  base: root,
  loadStylesheet: async (id: string, base: string) => {
    const file = id === "tailwindcss" ? join(twDir, "index.css") : join(twDir, id.replace(/^tailwindcss\//, ""));
    return { path: file, base, content: readFileSync(file, "utf8") };
  },
});
writeFileSync(join(out, "app.css"), compiler.build([...candidates]));

// 3. HTML + assets
cpSync(join(root, "public/demo-vehicles"), join(out, "demo-vehicles"), { recursive: true });
writeFileSync(join(out, "index.html"), `<!DOCTYPE html>
<html lang="en-GB" style="--font-inter:'Inter';--font-jakarta:'Plus Jakarta Sans'">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b1222"><meta name="robots" content="noindex">
<title>Forecourt — Phase 1 preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap">
<link rel="stylesheet" href="app.css">
</head>
<body class="min-h-dvh"><div id="root"></div><script type="module" src="app.js"></script></body>
</html>`);
console.log("preview built →", out);
}

main().catch((e) => { console.error(e); process.exit(1); });
