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
  "version.notice.30.req": "Requires",
  "version.notice.30.tail":
    "with 3.0 support — on both ends: HeaderProtectionKey is shared, so client and server must match.",

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
  "awg3.groundwork.lead": "The",
  "awg3.groundwork.note":
    "tags parse in v3.0.1 but are not wired into the send path yet — they are groundwork for AWG 4.0, so the generator does not emit them.",

  /* ── Generator controls ───────────────────────────────────────────────── */
  "gen.client.label": "Target client",
  "gen.client.hint":
    "Parameters are filtered to what the selected client supports.",
  "gen.profile.label": "Mimicry profile",
  "gen.profile.random": "Random choice",
  "gen.host.check": "Check domain availability",
  "gen.mimicAll": "Apply the profile to I2–I5",
  "gen.tags.label": "Tags in the CPS chain",
  "gen.tags.warnC":
    "The <c> tag does not work in older AWG-go builds (ErrorCode 1000). Amnezia's developers later dropped it, so it may stop working in newer client versions too.",
  "gen.cps.unavailable": "CPS chains are unavailable in AWG 1.0",
  "gen.cps.unavailableHint":
    "The I1–I5 tags arrived in 1.5. Mimicry profiles do not apply here — obfuscation is limited to junk packets and headers.",
  "gen.cps.switchTo20": "Switch to 2.0",
  "gen.fp.label": "Browser fingerprint",
  "gen.fp.toggle": "Imitate packet sizes",
  "gen.mtu.label": "Interface MTU",
  "gen.mtu.hint": "1500 = Ethernet · 1420 = WG/PPPoE · 1280 = min IPv6",
  "gen.entropy.label": "Entropy",
  "gen.junk.label": "Junk train (Jc)",
  "gen.junk.off": "0 — Off",
  "gen.junk.optimal": "3 — Optimal",
  "gen.junk.recommended": "5 — Recommended",
  "gen.junk.strong": "7 — Strong",
  "gen.junk.max": "10 — Maximum",
  "gen.extreme.title": "Extreme maximums",
  "gen.extreme.desc": "Use the highest permitted parameter values",
  "gen.router.title": "Router mode",
  "gen.router.desc": "Limit the load for router hardware",
  "gen.batch.title": "Batch generator",
  "gen.batch.desc":
    "Generate several independent configs at once. Above 50, generation runs in a background Web Worker so the interface stays responsive.",
  "gen.batch.action": "Generate",
  "gen.batch.running": "Generating {n}…",
  "gen.batch.download": "Download {n} configs",
  "gen.merge.title": "Key management",
  "gen.merge.desc":
    "Already have a vpn:// key? Refresh its obfuscation parameters, or merge several keys into one.",
  "gen.merge.update": "Refresh",
  "gen.merge.combine": "Merge",
  "gen.generate": "Generate",
  "gen.works": "Works",
  "gen.worksNot": "Does not work",
  "gen.config": "Configuration",
  "gen.waiting": "Waiting for generation…",
  "gen.preview": "Configuration file preview",
  "gen.export.title": "Export configuration",
  "gen.export.copyConf": "Copy .conf",
  "gen.export.downloadConf": "Download .conf",
  "gen.export.copyJson": "Copy JSON",
  "gen.export.downloadJson": "Download JSON",
  "gen.export.simulator": "Handshake simulator",
  "gen.copyAll": "Copy all",
  "gen.copyGroup": "Copy group",
  "gen.clickToCopy": "Click to copy",

  /* ── Generator log ────────────────────────────────────────────────────── */
  "log.generated": "Generated — {profile}",
  "log.routerMode": "Router mode: minimal noise",
  "log.batchRange": "The count must be between 1 and 1000",
  "log.batchDone": "Configs generated: {n}",
  "log.batchError": "Batch error: {error}",
  "log.batchFirst": "Generate a batch first",
  "log.confirmed": "Configuration confirmed",
  "log.retry": "Attempt {n}: regenerating with stronger parameters",
  "log.retryHigh": "Attempt {n}: HIGH mode, maximum obfuscation",
  "log.generateFirst": "Generate a config first",
  "log.copyFailed": "Could not copy to the clipboard",
  "log.saved": "Config saved to a file",
  "log.hostRequired": "Enter a host to check",
  "log.hostBlockedList": "{host} — on the known-blocked list",
  "log.hostOk": "{host} — reachable",
  "log.hostUnreachable": "{host} — unreachable ({error})",
  "log.copiedConf": "Config copied to the clipboard",
  "log.copiedJson": "JSON copied to the clipboard",

  /* ── Generated .conf comments ─────────────────────────────────────────── */
  "conf.privateKey": "PrivateKey = <your private key>",
  "conf.address": "Address = 10.0.0.2/32",
  "conf.cpsClientOnly": "I1-I5 are client-side only in AWG 1.5:",
  "conf.noCps": "I1-I5 are not supported in AWG 1.0",
  "conf.awg3Hpk":
    "AWG 3.0 — shared header protection key (identical on both ends)",
  "conf.awg3Cpa": "AWG 3.0 — random transport packet padding",
  "conf.awg3Timers": "AWG 3.0 — protocol timer randomisation",

  /* ── History ──────────────────────────────────────────────────────────── */
  "history.title": "Generation history",
  "history.empty": "No generations yet.",
  "history.clear": "Clear history",
  "history.restore": "Restore config",
  "history.restored": "Restored AWG {version} config from {time}",
  "history.copy": "Copy config",
  "history.delete": "Delete",
  "history.legacy": "Legacy entry — copy only",

  /* ── Knowledge base CTA ───────────────────────────────────────────────── */
  "kb.title": "The knowledge base moved to the FAQ",
  "kb.desc":
    "Parameter walkthroughs, the differences between 1.0 and 3.0, tuning guidance and common problems — now in one place, with search and filters.",
  "kb.action": "Open the FAQ",

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
  "footer.slogan.lead": "Encrypting reality.",
  "footer.slogan.accent": "An architecture of freedom",
  "footer.slogan.tail": "— in every packet.",
  "footer.donate.title": "Support the project",
  "footer.col.resources": "Resources",
  "footer.col.community": "Community",
  "footer.col.research": "Research",
  "footer.link.source": "Source code",
  "footer.link.amneziaGithub": "Amnezia VPN on GitHub",
  "footer.link.telegram": "Telegram chat",
  "footer.link.author": "Project author",
  "footer.credits.basedOn": "Built on ideas from",
  "footer.credits.from": "by",
  "footer.madeWith": "Made with",
  "footer.forCommunity": "for the AmneziaVPN community",
  "footer.build": "Last build",
  "footer.local": "100% local: your data never leaves the browser",

  /* ── Common ───────────────────────────────────────────────────────────── */
  "common.and": "and",
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
