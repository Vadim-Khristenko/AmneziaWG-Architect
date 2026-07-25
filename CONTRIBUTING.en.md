# Contributing to AmneziaWG Architect

[Русский](CONTRIBUTING.md) · **English**

Thanks for wanting to help. This document covers how the project is put
together and what makes a change easy to accept.

---

## Contents

- [Quick start](#quick-start)
- [Stack](#stack)
- [Project structure](#project-structure)
- [Code style](#code-style)
- [Localisation](#localisation)
- [Protocol changes](#protocol-changes)
- [Pull requests](#pull-requests)
- [Domain proposals](#domain-proposals)
- [Bug reports](#bug-reports)

---

## Quick start

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<you>/AmneziaWG-Architect.git
cd AmneziaWG-Architect

# 2. Install dependencies (bun recommended; npm works too)
bun install

# 3. Start the dev server
bun run dev
```

| Command | What it does |
|:--|:--|
| `bun run dev` | Dev server with HMR |
| `bun run build` | Production build, crawler stubs, sitemap, robots |
| `bun run preview` | Preview the built site |
| `bun run test:run` | Run the tests once |
| `bun run test` | Tests in watch mode |
| `bun run typecheck` | Type-check without emitting |
| `bun run og` | Rebuild the OG images and the GitHub preview |

---

## Stack

Vue 3 (`<script setup>`), TypeScript, Vite, Vitest, `lucide-vue-next` for icons,
`pako` for the `vpn://` codec. No CSS framework — plain CSS with custom
properties.

---

## Project structure

```
src/
  utils/         pure functions, no Vue — easy to test
    generator/   the parameter generator, split by concern
  composables/   reactive wrappers over utils/
  components/    shared components
  views/         pages
  i18n/          catalogs, runtime and per-locale SEO metadata
  data/          content: FAQ, changelog, support links
scripts/og/      OG image generator
assets/          global CSS and custom properties
```

**Architecture rules**

- `utils/` stays free of Vue *and* of i18n where it can. `generator/render.ts`,
  for instance, takes translated strings as an argument rather than importing
  the catalog, so it still runs in the worker and in tests.
- `composables/` wrap `utils/` and return refs, computeds and actions.
- `views/` hold template, scoped styles and as little logic as possible.

---

## Code style

**TypeScript** — strict typing; avoid `any` unless there is no alternative.
Prefer interfaces for object shapes. Generator utilities must stay pure. JSDoc
on exported functions, explaining *why* rather than restating the signature.

**Vue** — `<script setup lang="ts">` only, no Options API. Always
`<style scoped>`. `ref()` for primitives, `reactive()` for objects.
`PascalCase` components, `camelCase` everything else.

**CSS** — use the custom properties in `assets/main.css` (`--bg`, `--text`,
`--amber`, `--radius`, `--trans-fast` …). Breakpoints at 960px, 768px and
480px. Respect `prefers-reduced-motion` for anything that moves.

**Formatting** — four spaces in `.vue`, two in `.ts`; semicolons; trailing
commas.

---

## Localisation

Catalogs live in `src/i18n/locales/`. Russian is the source of truth and
English is typed against it, so **a missing translation is a build error** —
add the key to `ru.ts` first, then `en.ts`.

Keys are flat and dotted (`gen.export.copyConf`), grouped by area. When adding
UI text:

- Never hardcode a string in a template. Use `t("some.key")`.
- In attributes use a binding — `:title='t("some.key")'` — not `{{ }}`
  interpolation, which is invalid there.
- Interpolate with `{name}` placeholders; pass values as the second argument.
- For counts, use plural forms. Russian needs three (`one`/`few`/`many`),
  English two.

Page metadata is separate, in `src/i18n/seo.ts`, and is consumed by both the
router and the build-time stub generator — so the two cannot drift.

---

## Protocol changes

One thing worth knowing before touching the generator: **the AmneziaWG
documentation lags behind the implementation.** At the time of writing it still
describes 2.0 while `amneziawg-go` is on 3.0.1.

If you are changing anything about how parameters are produced or validated,
please cite the source — a file and line in `amneziawg-go` or `amneziawg-tools`
— rather than the docs. Several rules in this codebase exist only because the
code says so, for example the S1–S4 ≥ 12 floor under header protection, which
appears in no documentation at all.

New protocol behaviour should come with a test that encodes the invariant, not
just the happy path.

---

## Pull requests

Branch from `main`:

```bash
git checkout -b feature/my-change
git checkout -b fix/issue-42
```

| Prefix | Use for |
|:--|:--|
| `feature/` | new functionality |
| `fix/` | bug fixes |
| `docs/` | documentation |
| `refactor/` | restructuring without behaviour change |
| `test/` | tests |

Before opening a PR, make sure `bun run typecheck` and `bun run test:run` both
pass. In the description, say **what** changes, **why** it is needed, and
attach a screenshot for anything visual.

---

## Domain proposals

The mimicry host pools in `src/utils/generator/constants.ts` are maintained by
hand and need verification. Use the issue templates — they ask for the country
and ISP you tested from, which matters: reachability varies enormously by
network, and without it a local block cannot be told apart from a global one.

> Please do not add a domain you have not personally checked from the region it
> is meant to serve.

---

## Bug reports

Use the issue templates. For a config that will not connect, the important
fields are the AmneziaWG version, the client and its version, and the
parameters themselves.

> **Never paste private keys.** Remove `PrivateKey`, `PresharedKey` and
> `HeaderProtectionKey` — they are not needed to reproduce anything, and a key
> posted in an issue is a key that has to be rotated.
