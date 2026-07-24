/**
 * English catalog.
 *
 * Typed as `Catalog`, which is derived from the Russian source — omitting a key
 * or misspelling one is a build error, so translations cannot silently drift.
 */

import type { Catalog } from "./ru";

export const en: Catalog = {
  /* ── Navigation ───────────────────────────────────────────────────────── */
  "nav.generator": "Generator",
  "nav.mergekeys": "MergeKeys",
  "nav.simulator": "Simulator",
  "nav.about": "About",
  "nav.vaiexia": "VAIEXIA",
  "nav.faq": "FAQ",
  "nav.donate": "Donate",
  "nav.menu": "Menu",
  "nav.close": "Close",
  "nav.github": "GitHub repository",

  /* ── Language switcher ────────────────────────────────────────────────── */
  "lang.label": "Language",
  "lang.switch": "Change language",

  /* ── Home / hero ──────────────────────────────────────────────────────── */
  "home.badge": "AWG 3.0 READY",
  "home.title.brand": "AmneziaWG",
  "home.title.accent": "Architect",
  "home.desc":
    "Advanced obfuscation generator for defeating DPI. Everything runs in your browser — nothing leaves your device.",

  /* ── Versions ─────────────────────────────────────────────────────────── */
  "version.new": "NEW",
  "version.notice.10":
    "S3, S4 and CPS (I1–I5) are unsupported. Jc should be ≥ 4 and Jmax > 81.",
  "version.notice.15":
    "S3 and S4 are unsupported. I1–I5 apply on the client side only.",
  "version.notice.30":
    "ChaCha20 header encryption, randomised transport padding and randomised protocol timers.",

  /* ── AWG 3.0 panel ────────────────────────────────────────────────────── */
  "awg3.panel.title": "AmneziaWG 3.0 parameters",
  "awg3.hpk.title": "HeaderProtectionKey",
  "awg3.hpk.desc":
    "ChaCha20 over packet headers. Handshake and cookie messages are encrypted whole; transport packets only in the header. The nonce is taken from the padding, so S1–S4 are raised to 12 bytes automatically.",
  "awg3.cpa.title": "ContentPaddingAddition",
  "awg3.cpa.desc":
    "Random extra padding on every transport packet instead of aligning to 16 bytes — it blurs the packet-size histogram.",
  "awg3.timings.title": "Randomised timers",
  "awg3.timings.desc":
    "RekeyAfterTime, RekeyTimeout, RejectAfterTime, KeepaliveTimeout and MaxHandshakeAttempts become ranges, so a fixed handshake cadence stops being a fingerprint.",
  "awg3.groundwork.note":
    "parse in v3.0.1 but are not wired into the send path yet — they are groundwork for AWG 4.0, so the generator does not emit them.",

  /* ── Parameter groups ─────────────────────────────────────────────────── */
  "params.title": "Parameters",
  "params.group.junk": "Junk Train",
  "params.group.sizes": "Packet sizes",
  "params.group.headers": "Headers",
  "params.group.cps": "CPS Signatures",
  "params.group.cpsClient": "CPS (client only)",
  "params.group.awg3": "AmneziaWG 3.0",

  /* ── Actions ──────────────────────────────────────────────────────────── */
  "action.generate": "Generate",
  "action.copy": "Copy",
  "action.copied": "Copied",
  "action.download": "Download",
  "action.retry": "Try again",

  /* ── Donations ────────────────────────────────────────────────────────── */
  "donate.title": "Support the project",
  "donate.desc":
    "This project runs on enthusiasm and collects neither data nor money from its users. If it helped you, a coffee in crypto is welcome.",
  "donate.copyAddress": "Copy address",
  "donate.copied": "Address copied",
  "donate.network": "Network",
  "donate.warning":
    "Check the network before sending: funds sent on the wrong network are lost for good.",

  /* ── Footer ───────────────────────────────────────────────────────────── */
  "footer.madeWith": "Made with",
  "footer.by": "for a free internet",
  "footer.privacy": "Your data never leaves your browser",

  /* ── Common ───────────────────────────────────────────────────────────── */
  "common.copy": "Copy",
  "common.close": "Close",
  "common.back": "Back",
  "common.loading": "Loading…",
  "common.error": "Error",
  "common.configs": {
    one: "{n} config",
    other: "{n} configs",
  },
};

export default en;
