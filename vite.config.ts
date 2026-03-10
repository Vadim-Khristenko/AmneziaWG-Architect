import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

/**
 * Vite plugin that handles GitHub Pages SPA routing:
 *
 * 1. Generates dist/404.html with a redirect script that preserves the URL
 *    and bounces the user back to index.html (GitHub Pages serves 404.html
 *    for any path it doesn't recognise).
 *
 * 2. Injects a tiny restore script into dist/index.html so the Vue router
 *    sees the original path (e.g. /mergekeys) instead of /?p=mergekeys.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexSrc = path.join(outDir, "index.html");
      const dest404 = path.join(outDir, "404.html");

      if (!fs.existsSync(indexSrc)) return;

      // How many path segments does the base occupy?
      // base = "/"           → 1  (root domain:   username.github.io)
      // base = "/repo-name/" → 2  (project page:  username.github.io/repo)
      const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
      const isGhActions = Boolean(process.env.GITHUB_ACTIONS);
      const segmentCount = isGhActions && repoName ? 2 : 1;

      // ── 1. Write dist/404.html with a redirect script ───────────────────
      const redirect404 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Redirecting…</title>
  <meta name="robots" content="noindex">
  <style>
  /* ── Palette ──────────────────────────────────────────────────────────────── */
  :root {
      /* Backgrounds — layered depth */
      --bg: #0a0806;
      --bg2: #110e0a;
      --bg3: #181410;
      --bg4: #201a14;
      --bg5: #281f16;

      /* Surface — for cards, panels, elevated elements */
      --surface: rgba(232, 168, 64, 0.03);
      --surface-hover: rgba(232, 168, 64, 0.06);
      --surface-active: rgba(232, 168, 64, 0.09);

      /* Accent: Amber */
      --amber: #e8a840;
      --amber2: #f5c060;
      --amber3: #ffd980;
      --amber-dim: #7a5820;
      --amber-deep: #c48520;

      /* Accent Glow */
      --ag: rgba(232, 168, 64, 0.12);
      --ag2: rgba(232, 168, 64, 0.06);
      --ag3: rgba(232, 168, 64, 0.03);

      /* Semantic — Green */
      --green: #5cb87a;
      --green2: #7dd99a;
      --green-bg: rgba(92, 184, 122, 0.08);
      --gd: rgba(92, 184, 122, 0.15);

      /* Semantic — Red */
      --red: #d4604a;
      --red2: #ff8f7d;
      --red-bg: rgba(212, 96, 74, 0.08);
      --rd: rgba(212, 96, 74, 0.12);

      /* Semantic — Blue (info accents) */
      --blue: #5b9bd5;
      --blue-bg: rgba(91, 155, 213, 0.08);

      /* Text */
      --text: #e0d4b8;
      --text2: #9a8a68;
      --text3: #5e5038;
      --text4: #3d3226;

      /* Borders */
      --border: rgba(232, 168, 64, 0.14);
      --border2: rgba(232, 168, 64, 0.07);
      --border3: rgba(232, 168, 64, 0.03);

      /* Semantic Aliases */
      --accent: var(--amber2);
      --accent-glow: var(--ag);
      --radius: 12px;
      --radius-sm: 8px;
      --radius-lg: 16px;
      --radius-xl: 20px;

      /* Fonts */
      --fw: "Manrope", sans-serif;
      --fu: "Unbounded", sans-serif;
      --fm: "JetBrains Mono", monospace;

      /* Animation */
      --ease: cubic-bezier(0.23, 1, 0.32, 1);
      --ease-snap: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
      --trans-fast: 150ms var(--ease);
      --trans-norm: 250ms var(--ease);
      --trans-slow: 400ms var(--ease);

      /* Shadows */
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.2);
      --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
      --shadow-glow:
          0 0 20px rgba(232, 168, 64, 0.08), 0 0 60px rgba(232, 168, 64, 0.04);
  }

  /* ── Reset ────────────────────────────────────────────────────────────────── */
  *,
  *::before,
  *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
  }

  html {
      scroll-behavior: smooth;
      background-color: var(--bg);
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      hanging-punctuation: first last;
  }

  body {
      font-family: var(--fw);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      font-size: 16px;
      overflow-x: hidden;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
  }
  </style>
  <script>
    // GitHub Pages SPA fallback
    // Saves the requested URL and redirects to the app root.
    // The restore script in index.html then calls history.replaceState
    // so Vue Router sees the original path.
    (function () {
      var l = window.location;
      var base = l.pathname.split('/').slice(0, ${segmentCount} + 1).join('/');
      sessionStorage.redirect = l.pathname + l.search + l.hash;
      l.replace(l.origin + base + '/');
    })();
  <\/script>
</head>
<body>Redirecting…</body>
</html>`;

      fs.writeFileSync(dest404, redirect404, "utf-8");
      console.log("  ✓ SPA fallback: generated 404.html with redirect script");

      // ── 2. Inject restore script into dist/index.html ───────────────────
      // Must run before Vue boots so the router sees the real path.
      const restoreScript = [
        `<script>`,
        `    (function () {`,
        `      var r = sessionStorage.redirect;`,
        `      delete sessionStorage.redirect;`,
        `      if (r && r !== location.pathname + location.search + location.hash) {`,
        `        history.replaceState(null, null, r);`,
        `      }`,
        `    })();`,
        `  <\/script>`,
      ].join("\n");

      let html = fs.readFileSync(indexSrc, "utf-8");

      if (!html.includes("sessionStorage.redirect")) {
        html = html.replace("<head>", `<head>\n  ${restoreScript}`);
        fs.writeFileSync(indexSrc, html, "utf-8");
        console.log(
          "  ✓ SPA fallback: injected restore script into index.html\n",
        );
      }
    },
  };
}

// ── Base path ───────────────────────────────────────────────────────────────
// GITHUB_ACTIONS + GITHUB_REPOSITORY are injected automatically by the runner.
// Locally both are undefined → base stays "/" so the dev server works normally.
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGhPages = Boolean(process.env.GITHUB_ACTIONS) && Boolean(repoName);
const base = isGhPages ? `/${repoName}/` : "/";

export default defineConfig({
  plugins: [vue(), spaFallback()],

  // ↑ Critical: Vite prefixes every asset URL with /repo-name/
  //   Without this, JS/CSS load from /assets/… → 404 on GitHub Pages
  base,

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
  },

  server: {
    port: 3000,
    open: true,
  },
});
