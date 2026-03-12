import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

// ── Route definitions for pre-render stubs ──────────────────────────────────
// Each entry produces dist/{slug}/index.html with correct og:meta so that
// crawlers/bots get real metadata without executing JavaScript.
interface RouteStub {
  slug: string; // e.g. "about"  → dist/about/index.html
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string; // relative to site root assets dir, e.g. "og-about.png"
}

const ROUTE_STUBS: RouteStub[] = [
  {
    slug: "mergekeys",
    title: "MergeKeys — AmneziaWG Architect",
    description:
      "Обновите обфускацию AWG-ключа или объедините несколько ключей Amnezia VPN в один.",
    ogTitle: "MergeKeys — AmneziaWG Architect",
    ogDescription:
      "Объединяй ключи Amnezia VPN, обновляй обфускацию — всё локально в браузере.",
    ogImage: "og-mergekeys.png",
  },
  {
    slug: "about",
    title: "О проекте — AmneziaWG Architect",
    description:
      "Что такое AmneziaWG Architect? Это интерактивный инструмент для генерации сложных конфигураций обфускации трафика AmneziaWG. Создан для тех, кто хочет вернуть себе свободный интернет.",
    ogTitle: "О проекте — AmneziaWG Architect",
    ogDescription:
      "Твой протокол — твои правила. Разбор архитектуры, безопасности и принципов работы генератора.",
    ogImage: "og-about.png",
  },
  {
    slug: "iaa",
    title: "IAA — AmneziaWG Architect",
    description:
      "Install AmneziaWG Anywhere — генератор команд для установки и управления AmneziaWG на любой платформе.",
    ogTitle: "IAA — AmneziaWG Architect",
    ogDescription:
      "Генератор команд для установки AmneziaWG на Windows, Linux, macOS.",
    ogImage: "og-iaa.png",
  },
];

/**
 * Vite plugin that handles GitHub Pages SPA routing:
 *
 * 1. Generates dist/404.html with a redirect script that preserves the URL
 *    and bounces the user back to the app root (index.html).
 *
 * 2. Injects a tiny restore script into dist/index.html so Vue Router
 *    sees the original path (e.g. /mergekeys) instead of the root.
 *
 * 3. Pre-renders stub HTML files for every route (dist/{slug}/index.html)
 *    so that crawlers/bots receive correct og:meta tags without JS execution,
 *    AND so that GitHub Pages never triggers 404.html for known routes.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexSrc = path.join(outDir, "index.html");
      const dest404 = path.join(outDir, "404.html");

      if (!fs.existsSync(indexSrc)) return;

      // Canonical site origin used for absolute og:image URLs (required by bots)
      const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
      const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];
      const isGhActions = Boolean(process.env.GITHUB_ACTIONS);

      const siteBase =
        isGhActions && repoName && owner
          ? `https://${owner.toLowerCase()}.github.io/${repoName}`
          : "";

      // ── 1. Write dist/404.html with a redirect script ───────────────────
      //
      // The script detects the base path dynamically at runtime:
      // - On GitHub Pages subdirectory (*.github.io/repo-name/): base = /repo-name/
      // - On custom domain or root: base = /
      //
      // This allows the same build to work on multiple domains without
      // hardcoding the base path at build time.
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
    // GitHub Pages SPA fallback with dynamic base detection
    // Saves the requested URL and redirects to the app root.
    // The restore script in index.html then calls history.replaceState
    // so Vue Router sees the original path.
    //
    // Base path is detected dynamically:
    // - GitHub Pages subdirectory (*.github.io/repo/): extracts /repo/ as base
    // - Custom domain or root: uses / as base
    (function () {
      var l = window.location;
      var pathname = l.pathname;

      // Detect base path dynamically
      var base = '/';

      // If on GitHub Pages subdirectory (username.github.io/repo-name/...)
      // Extract the repo name as the base
      if (l.hostname.match(/\\.github\\.io$/) && pathname.match(/^\\/[^\\/]+\\//)) {
        base = pathname.match(/^\\/[^\\/]+\\//)[0];
      }

      sessionStorage.redirect = pathname + l.search + l.hash;
      l.replace(l.origin + base);
    })();
  <\/script>
</head>
<body>Redirecting…</body>
</html>`;

      fs.writeFileSync(dest404, redirect404, "utf-8");
      console.log("  ✓ SPA fallback: generated 404.html with redirect script");

      // ── 2. Pre-render stubs for every named route ────────────────────────
      // Creates dist/{slug}/index.html with correct <title>, <meta name="description">
      // and og:meta tags hard-coded in HTML so that:
      //   a) Crawlers / OG bots get real metadata without running JS.
      //   b) GitHub Pages finds a real file → 404.html is never triggered
      //      for known routes → no redirect loop for direct navigation.
      //
      // The stub contains the same JS bundle as index.html so regular users
      // still get the full Vue SPA experience after hydration.

      const indexHtml = fs.readFileSync(indexSrc, "utf-8");
      const basePath = isGhActions && repoName ? `/${repoName}` : "";

      for (const route of ROUTE_STUBS) {
        const absImage = siteBase
          ? `${siteBase}/assets/${route.ogImage}`
          : `${basePath}/assets/${route.ogImage}`;

        // Replace <title>
        let stub = indexHtml.replace(
          /<title>[^<]*<\/title>/,
          `<title>${route.title}</title>`,
        );

        // Replace <meta name="description">
        stub = stub.replace(
          /(<meta\s+name="description"\s+content=")[^"]*(")/,
          `$1${route.description}$2`,
        );

        // Replace / inject og:title
        if (stub.includes("og:title")) {
          stub = stub.replace(
            /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
            `$1${route.ogTitle}$2`,
          );
        }

        // Replace / inject og:description
        if (stub.includes("og:description")) {
          stub = stub.replace(
            /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
            `$1${route.ogDescription}$2`,
          );
        }

        // Replace / inject og:image (must be absolute URL for bots)
        if (stub.includes("og:image")) {
          stub = stub.replace(
            /(<meta\s+property="og:image"\s+content=")[^"]*(")/,
            `$1${absImage}$2`,
          );
        }

        // Write dist/{slug}/index.html
        const stubDir = path.join(outDir, route.slug);
        const stubFile = path.join(stubDir, "index.html");
        fs.mkdirSync(stubDir, { recursive: true });
        fs.writeFileSync(stubFile, stub, "utf-8");
        console.log(`  ✓ Pre-render stub: dist/${route.slug}/index.html`);
      }

      // ── 3. Inject restore script into dist/index.html ───────────────────
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
// Use relative paths so the build works in all scenarios:
// - file:// protocol (local filesystem without server)
// - Custom domain at root (awg-ait.vai-rice.space)
// - GitHub Pages subdirectory (username.github.io/repo-name/)
//
// Relative paths (./assets/...) resolve correctly in all cases.
// Vue Router detects the absolute base path dynamically at runtime.
const base = "./";

export default defineConfig({
  plugins: [vue(), spaFallback()],

  // ↑ Relative base path ensures assets load correctly from any location
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
