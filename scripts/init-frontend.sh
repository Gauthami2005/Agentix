#!/usr/bin/env bash
# Agentix — scaffold Vite + React + TypeScript + Tailwind + Lucide frontend
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"

echo "⚡ Agentix frontend bootstrap"
echo "   Root: $ROOT"

if [ -d "$FRONTEND" ]; then
  echo "❌ frontend/ already exists. Remove it first or run from a clean tree."
  exit 1
fi

cd "$ROOT"

# 1. Vite + React + TypeScript
npm create vite@latest frontend -- --template react-ts

cd "$FRONTEND"
npm install

# 2. Tailwind CSS v4 (Vite plugin)
npm install -D tailwindcss @tailwindcss/vite

# 3. Lucide icons
npm install lucide-react

# 4. Wire Tailwind into Vite
cat > vite.config.ts <<'VITE'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
VITE

# 5. Global styles
cat > src/index.css <<'CSS'
@import "tailwindcss";

@theme {
  --color-void: #0b0f19;
  --color-surface: #111827;
  --color-surface-2: #1a2332;
  --color-cyan-neon: #06b6d4;
  --color-emerald-neon: #10b981;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background-color: var(--color-void);
  color: #e2e8f0;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
CSS

# 6. Google fonts in index.html
node - <<'NODE'
const fs = require("fs");
const path = "index.html";
let html = fs.readFileSync(path, "utf8");
const link = `<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />`;
if (!html.includes("fonts.googleapis.com")) {
  html = html.replace("<head>", `<head>\n    ${link}`);
}
html = html.replace("<title>", '<title>Agentix · ');
fs.writeFileSync(path, html);
NODE

mkdir -p src/components src/lib

echo ""
echo "✅ Frontend scaffold complete."
echo ""
echo "Next steps:"
echo "  1. Copy Dashboard.tsx into frontend/src/components/"
echo "  2. Start API:  cd $ROOT && uvicorn main:api --reload --port 8000"
echo "  3. Start UI:   cd $FRONTEND && npm run dev"
echo ""
