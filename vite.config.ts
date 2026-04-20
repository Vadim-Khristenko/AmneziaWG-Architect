import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import fs from "node:fs";
import type { Plugin } from "vite";
import { fileURLToPath } from "node:url";

// ESM-compatible __dirname for use in functions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RouteStub {
  slug: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
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
    ogImage: "og-lite.svg",
  },
  {
    slug: "about",
    title: "О проекте — AmneziaWG Architect",
    description:
      "Что такое AmneziaWG Architect? Это интерактивный инструмент для генерации сложных конфигураций обфускации трафика AmneziaWG. Создан для тех, кто хочет вернуть себе свободный интернет.",
    ogTitle: "О проекте — AmneziaWG Architect",
    ogDescription:
      "Твой протокол — твои правила. Разбор архитектуры, безопасности и принципов работы генератора.",
    ogImage: "og-lite.svg",
  },
  {
    slug: "iaa",
    title: "IAA — Веб-панель VPN",
    description:
      "Быстрая адаптивная панель для управления Amnezia VPN и другими VPN-решениями.",
    ogTitle: "IAA — Веб-панель VPN",
    ogDescription:
      "Быстрая адаптивная панель для управления VPN-серверами. Amnezia, WireGuard, XRay.",
    ogImage: "og-lite.svg",
  },
];

export type HostPlatform = "github" | "gitlab" | "cloudflare" | "generic";

export function detectHostPlatform(): HostPlatform {
  const platform = (
    process.env.VITE_DEPLOY_PLATFORM ||
    process.env.DEPLOY_PLATFORM ||
    (process.env.GITHUB_ACTIONS && "github") ||
    (process.env.GITLAB_CI && "gitlab") ||
    (process.env.CF_PAGES && "cloudflare") ||
    "generic"
  )
    .toString()
    .toLowerCase();

  if (platform.includes("gitlab")) return "gitlab";
  if (platform.includes("cloudflare") || platform.includes("cf"))
    return "cloudflare";
  if (platform.includes("github")) return "github";
  return "generic";
}

export function normalizeBase(input?: string | null): string {
  if (!input) return "/";
  let base = input.trim();

  if (base === "." || base === "./") return "./";

  if (base === "/") return "/";

  base = base.replace(/\\/g, "/");
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base += "/";

  return base;
}

export function inferBase(): string {
  const explicit =
    process.env.VITE_BASE ||
    process.env.BASE_URL ||
    process.env.ASSET_BASE ||
    process.env.PUBLIC_URL;

  if (explicit) return normalizeBase(explicit);

  const platform = detectHostPlatform();

  if (platform === "cloudflare") {
    return "/";
  }

  if (platform === "github") {
    // Для кастомных доменов (architect.vai-rice.space) используем корень
    // Проверка через VITE_USE_CUSTOM_DOMAIN или наличие CNAME файла
    const useCustomDomain = process.env.VITE_USE_CUSTOM_DOMAIN === "true";
    const hasCname = fs.existsSync(path.resolve(__dirname, "public", "CNAME"));

    if (useCustomDomain || hasCname) {
      return "/";
    }

    // Для github.io страниц используем /repo-name/
    const repo = process.env.GITHUB_REPOSITORY;
    if (repo) {
      const [, name] = repo.split("/");
      if (name) {
        return `/${name}/`;
      }
    }
    return "/";
  }

  if (platform === "gitlab") {
    const pagesUrl = process.env.CI_PAGES_URL;
    if (pagesUrl) {
      try {
        const urlObj = new URL(pagesUrl);
        return normalizeBase(urlObj.pathname);
      } catch (e) {}
    }
    return "/";
  }

  return "./";
}

export function inferSiteOrigin(): string {
  const explicit =
    process.env.VITE_SITE_ORIGIN ||
    process.env.SITE_ORIGIN ||
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.PUBLIC_SITE_URL;

  if (explicit) return explicit.replace(/\/+$/, "");

  // Для кастомных доменов GitHub Pages
  const useCustomDomain = process.env.VITE_USE_CUSTOM_DOMAIN === "true";
  const hasCname = fs.existsSync(path.resolve(__dirname, "public", "CNAME"));

  if (useCustomDomain || hasCname) {
    // Читаем домен из CNAME файла если есть
    if (hasCname) {
      try {
        const cname = fs.readFileSync(path.resolve(__dirname, "public", "CNAME"), "utf-8").trim();
        if (cname) return `https://${cname}`;
      } catch (e) {}
    }
    // Fallback на стандартный кастомный домен
    return "https://architect.vai-rice.space";
  }

  const repo = process.env.GITHUB_REPOSITORY;
  if (repo && process.env.GITHUB_ACTIONS) {
    const [owner, name] = repo.split("/");
    if (owner && name) {
      return `https://${owner.toLowerCase()}.github.io/${name}`;
    }
  }

  const gitlabProject = process.env.CI_PROJECT_PATH;
  const gitlabUrl = process.env.CI_PAGES_URL || process.env.PAGES_URL;
  if (gitlabUrl) return gitlabUrl.replace(/\/+$/, "");
  if (gitlabProject && process.env.CI_SERVER_HOST) {
    return `https://${process.env.CI_SERVER_HOST}/${gitlabProject}`;
  }

  const cfUrl =
    process.env.CF_PAGES_URL ||
    process.env.CLOUDFLARE_PAGES_URL ||
    process.env.PAGES_URL;
  if (cfUrl) return cfUrl.replace(/\/+$/, "");

  return "";
}

export function makeAbsoluteUrl(
  siteOrigin: string,
  base: string,
  assetPath: string,
): string {
  const cleanAsset = assetPath.replace(/^\.?\//, "");
  if (!siteOrigin) {
    return `${base}${cleanAsset}`.replace(/\/{2,}/g, "/").replace(":/", "://");
  }
  return new URL(
    cleanAsset,
    siteOrigin.endsWith("/") ? siteOrigin : `${siteOrigin}/`,
  ).toString();
}

export function buildStubHtml(
  template: string,
  route: RouteStub,
  siteOrigin: string,
  base: string,
): string {
  const absImage = makeAbsoluteUrl(siteOrigin, base, `assets/${route.ogImage}`);

  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`,
  );

  if (html.includes('property="og:title"')) {
    html = html.replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${route.ogTitle}$2`,
    );
  }

  if (html.includes('property="og:description"')) {
    html = html.replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${route.ogDescription}$2`,
    );
  }

  if (html.includes('property="og:image"')) {
    html = html.replace(
      /(<meta\s+property="og:image"\s+content=")[^"]*(")/,
      `$1${absImage}$2`,
    );
  }

  if (html.includes('name="robots"')) {
    html = html.replace(
      /(<meta\s+name="robots"\s+content=")[^"]*(")/,
      `$1index,follow$2`,
    );
  } else {
    html = html.replace(
      /<\/title>/,
      `</title>\n    <meta name="robots" content="index,follow" />`,
    );
  }

  return html;
}

function createSpaFallbackPlugin(): Plugin {
  return {
    name: "amneziawg-architect-spa-fallback",
    enforce: "post",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;

      const rawIndex = fs.readFileSync(indexPath, "utf-8");
      const base = inferBase();
      const siteOrigin = inferSiteOrigin();
      const isRelativeBase = base === "./";
      const effectiveBase = isRelativeBase ? "/" : base;

      for (const route of ROUTE_STUBS) {
        const stubDir = path.join(outDir, route.slug);
        const stubIndex = path.join(stubDir, "index.html");

        fs.mkdirSync(stubDir, { recursive: true });
        fs.writeFileSync(
          stubIndex,
          buildStubHtml(rawIndex, route, siteOrigin, effectiveBase),
          "utf-8",
        );
      }

      const cfPages = path.join(outDir, "_redirects");
      const fallback404 = path.join(outDir, "404.html");
      const gitlabPages = path.join(outDir, "200.html");

      const rewriteRules = [
        "/*    /index.html   200",
        "/mergekeys    /mergekeys/index.html   200",
        "/about    /about/index.html   200",
        "/iaa    /iaa/index.html   200",
      ].join("\n");

      fs.writeFileSync(cfPages, rewriteRules, "utf-8");
      fs.writeFileSync(gitlabPages, rawIndex, "utf-8");

      // We no longer write a manual HTML 404 because Vue Router handles it via 200/404 rewrites
      // or the index fallback. If needed by simple hosts, we point 404 to index
      fs.writeFileSync(fallback404, rawIndex, "utf-8");

      if (
        process.env.GITHUB_ACTIONS ||
        process.env.GITLAB_CI ||
        process.env.CF_PAGES
      ) {
        console.log(`[spa] base=${base} siteOrigin=${siteOrigin || "(auto)"}`);
      }
    },
  };
}

function createMultiHostBuildPlugin(): Plugin {
  return {
    name: "amneziawg-architect-multi-host-build",
    configResolved(config) {
      if (config.base && config.base !== "./" && config.base !== "/") return;
    },
  };
}

export default defineConfig(({ mode }) => {
  const base = inferBase();
  const isLiteBuild =
    mode === "lite" ||
    mode === "lite-single" ||
    process.env.LITE_BUILD === "true";
  const isLiteSingleBuild =
    mode === "lite-single" || process.env.LITE_SINGLE_BUILD === "true";

  return {
    plugins: [vue(), createSpaFallbackPlugin(), createMultiHostBuildPlugin()],
    base,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __LITE_BUILD__: JSON.stringify(isLiteBuild),
    },
    esbuild: {
      legalComments: "none",
      ...(isLiteBuild
        ? {
            drop: ["console", "debugger"],
            minifyIdentifiers: true,
            minifySyntax: true,
            minifyWhitespace: true,
          }
        : {}),
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: "esbuild",
      sourcemap: false,
      reportCompressedSize: false,
      cssCodeSplit: !isLiteSingleBuild,
      modulePreload: !isLiteSingleBuild,
      target: isLiteBuild ? "es2020" : undefined,
      ...(isLiteSingleBuild
        ? {
            rollupOptions: {
              output: {
                inlineDynamicImports: true,
              },
            },
          }
        : {}),
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      open: true,
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      strictPort: true,
    },
  };
});

export const test = {
  globals: true,
  environment: "node",
  include: ["src/**/__tests__/**/*.test.ts"],
  coverage: {
    provider: "v8",
    reporter: ["text", "json-summary", "html"],
    include: ["src/utils/**/*.ts"],
    exclude: ["src/utils/__tests__/**"],
  },
};
