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

  /* ── About page ───────────────────────────────────────────────────────── */
  "about.badge": "ABOUT",
  "about.subtitle.1": "A next-generation obfuscation generator.",
  "about.subtitle.2": "Your protocol, your rules.",
  "about.subtitle.3": "Invisibility by design.",

  "about.legal.title": "Legal notice",
  "about.legal.warning":
    "This project exists for educational and research purposes only.",
  "about.legal.scope":
    "It was never built for use in Russia or the CIS. The author accepts no responsibility for how this software is used.",
  "about.legal.allowedTitle": "Permitted use:",
  "about.legal.allowed.1": "Penetration testing and security research",
  "about.legal.allowed.2": "CTF competitions",
  "about.legal.allowed.3": "Academic research",
  "about.legal.allowed.4": "Testing networks you own",
  "about.legal.disclaimer":
    "Using traffic obfuscation tools may violate the law where you live. Nothing in this project encourages breaking it.",

  "about.stat.profiles": "Mimicry profiles",
  "about.stat.params": "Generation parameters",
  "about.stat.tests": "Automated tests",
  "about.stat.clients": "Supported clients",

  "about.what.title": "What is AmneziaWG Architect?",
  "about.what.p1":
    "AmneziaWG Architect is an advanced web tool for building unique AmneziaWG obfuscation profiles, and for working with Amnezia VPN keys.",
  "about.what.p2":
    "An ordinary VPN encrypts your data; Architect helps disguise the fact that you are using one at all. DPI systems analyse packet structure and identify WireGuard by its fixed headers and sizes. Architect generates parameters that make your traffic resemble QUIC, TLS, SIP or other protocols.",

  "about.feature.profiles.title": "11 mimicry profiles",
  "about.feature.profiles.desc":
    "QUIC, TLS, DTLS, SIP, HTTP/3, Noise_IK and more. The H1–H4, S1–S4 and I1–I5 parameters map exactly onto AmneziaVPN's own fields.",
  "about.feature.smart.title": "Informed generation",
  "about.feature.smart.desc":
    "Not random numbers but the structure of real network packets. Choosing a target client and consulting the compatibility matrix rules out parameters that would not work.",
  "about.feature.check.title": "Config checking",
  "about.feature.check.desc":
    "The health checker catches errors in a .conf before it reaches a client. The batch generator produces up to 1000 configs in a Web Worker.",
  "about.feature.advanced.title": "For advanced users",
  "about.feature.advanced.desc":
    "The packet simulator visualises the handshake, and CPS tags, MTU and mimicry profiles are all under manual control.",

  "about.timeline.title": "Project timeline",
  "about.timeline.lede":
    "In its short life Architect has been rebuilt several times over — from a single HTML file to a full Vue 3 SPA. Each round made it easier to use, more capable and better looking.",

  "about.mergekeys.lede":
    "Besides the obfuscation generator, Architect ships MergeKeys — a tool for working with Amnezia VPN keys in the vpn:// format.",
  "about.mergekeys.update.title": "Refresh obfuscation",
  "about.mergekeys.update.desc":
    "Apply new Jc, Jmin, Jmax and I1–I5 values to an existing key without recreating it. Server-side parameters are left untouched.",
  "about.mergekeys.merge.title": "Merge keys",
  "about.mergekeys.merge.desc":
    "Collect containers from several vpn:// keys into a single master key. Duplicates are detected automatically.",
  "about.mergekeys.goto": "Open MergeKeys",
  "about.mergekeys.combine": "Merge keys",

  "about.privacy.lede.bold": "We collect nothing from you.",
  "about.privacy.lede":
    "There are no servers of ours, no analytics, no trackers, no databases and no hidden requests anywhere. Everything on this page runs inside your browser. The source is fully open — anyone can check there is nothing extra here, fork the repository and run Architect themselves.",
  "about.privacy.local.title": "Your browser only",
  "about.privacy.local.desc":
    "Obfuscation generation, vpn:// key decoding, parameter patching and packet simulation all run locally on your device. We physically cannot see your configs, your keys or the parameters you pick.",
  "about.privacy.notrack.title": "No metrics, no trackers",
  "about.privacy.notrack.desc":
    "No Google Analytics, Yandex.Metrika, Amplitude or homegrown analytics. No cookies, no fingerprinting, no third-party scripts. Nothing is collected, logged or forwarded.",
  "about.privacy.offline.title": "Works without the internet",
  "about.privacy.offline.desc":
    "Save the page with Ctrl+S or Cmd+S and use it offline. Generation, config checking and key handling need neither a network nor our servers.",
  "about.privacy.oss.title": "Open source, runs locally",
  "about.privacy.oss.desc":
    "All the source is on GitHub. You can read it, audit it, build it locally and run it on your own machine — with no dependency on us at all.",

  "about.oss.lede":
    "The project's sources are entirely open. Anyone can read the code, satisfy themselves it is safe, propose improvements, fork it and deploy their own version.",
  "about.oss.stack.title": "A modern stack",
  "about.oss.stack.desc":
    "The source lives on GitHub. Vue 3, TypeScript and Vite — a current stack with no magic in it.",
  "about.oss.audit.title": "Audits welcome",
  "about.oss.audit.desc":
    "Every line of the generation and key-handling code is open to audit. No obfuscated bundles, just plain TypeScript.",
  "about.oss.github": "Sources on GitHub",

  "about.dev.solo.title": "A single developer",
  "about.dev.solo.desc":
    "Architect is built and maintained by one person. Bugs get fixed quickly, often the same day. The project runs on enthusiasm and spare time.",
  "about.dev.feedback.title": "Found a bug? Have an idea?",
  "about.dev.feedback.desc":
    "Bug reports and ideas are genuinely welcome. Join the discussion in the chat or open an issue on GitHub — and soon on git.vai-rice.space too.",
  "about.dev.noDm":
    "Please do not send direct messages — the shared chat or an issue, either is fine.",
  "about.mergekeys.title": "MergeKeys — key management",
  "about.privacy.title": "Privacy manifesto",
  "about.opensource.title": "Open source",
  "about.dev.title": "Developer and feedback",

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
  "footer.donate.methods": "YooMoney · Patreon · DaLink · crypto",
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
