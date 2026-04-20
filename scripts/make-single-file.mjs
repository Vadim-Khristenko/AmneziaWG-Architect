import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const indexPath = path.join(distDir, "index.html");
const outputPath = path.join(distDir, "AmneziaWG-Architect-lite-single.html");

if (!fs.existsSync(indexPath)) {
  console.error("[lite-single] dist/index.html not found. Run build first.");
  process.exit(1);
}

const resolveDistAssetPath = (assetRef) => {
  const noQuery = assetRef.split("?")[0].split("#")[0];
  let clean = noQuery.replace(/^\.\//, "").replace(/^\//, "");

  const assetsPos = clean.indexOf("assets/");
  if (assetsPos >= 0) {
    clean = clean.slice(assetsPos);
  }

  return path.join(distDir, clean);
};

let html = fs.readFileSync(indexPath, "utf8");

let inlinedCss = "";
html = html.replace(
  /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>\s*/g,
  (_full, href) => {
    const cssPath = resolveDistAssetPath(href);
    if (!fs.existsSync(cssPath)) return "";
    inlinedCss += `${fs.readFileSync(cssPath, "utf8")}\n`;
    return "";
  },
);

let inlinedJs = "";
html = html.replace(
  /<script\s+type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>\s*/g,
  (_full, src) => {
    const jsPath = resolveDistAssetPath(src);
    if (!fs.existsSync(jsPath)) return "";
    inlinedJs += `${fs.readFileSync(jsPath, "utf8")}\n`;
    return "";
  },
);

// Remove external-only head metadata in single-file artifact.
html = html
  .replace(/<link[^>]*rel=["']modulepreload["'][^>]*>\s*/g, "")
  .replace(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon|manifest)["'][^>]*>\s*/g, "")
  .replace(/<meta[^>]*property=["']og:image["'][^>]*>\s*/g, "");

if (inlinedCss) {
  html = html.replace("</head>", `  <style>${inlinedCss}</style>\n</head>`);
}

if (inlinedJs) {
  html = html.replace("</body>", `  <script type=\"module\">${inlinedJs}</script>\n</body>`);
}

html = `${html.trim()}\n`;
fs.writeFileSync(outputPath, html, "utf8");

const kb = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`[lite-single] Created dist/AmneziaWG-Architect-lite-single.html (${kb} KB)`);
