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
    "ChaCha20 over packet headers. Handshake and cookie messages are encrypted whole; transport packets only in the header. The nonce is taken from the padding, so S1–S4 cannot go below 12 bytes: anything drawn under the floor is redrawn from the rest of its range rather than pinned to 12.",
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
  "client.note.windowsHCap":
    "Before 2.0.2 the editor underlines H values above 2,147,483,647 in red and will not save the config. Those values work fine on the server — the limit was only in the client-side check (PR #85, fixed in #87).",
  "client.note.wgTunnelBattery":
    "Large S3/S4 may drain battery or behave inconsistently; keep S4 modest.",
  "client.note.keeneticI1":
    "Sensitive to I1: prefer a simple <r 64> or a DNS mimicry profile.",
  "client.note.awgGoTagC":
    "Tag <c> is not implemented — ErrorCode 1000.",
  "gen.client.releaseCurrent": "Current client version",
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
  "history.empty": "No generations yet. Press Generate to start.",
  "history.clear": "Clear history",
  "history.restore": "Restore config",
  "history.restored": "Restored AWG {version} config from {time}",
  "history.copy": "Copy config",
  "history.delete": "Delete",
  "history.legacy": "Legacy entry — copy only",

  /* ── Knowledge base CTA ───────────────────────────────────────────────── */
  "kb.fields.short": "The client's form, with your values",
  "kb.fields.title": "Where do these parameters go?",
  "kb.fields.desc":
    "The Amnezia app's form field by field, filled with your values — nothing left to guess.",
  "kb.fields.action": "Show the fields",
  "kb.short": "Parameters, versions, common problems",
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

  /* ── 404 ──────────────────────────────────────────────────────────────── */
  "nf.badge": "PACKET LOST",
  "nf.title": "Page not found",
  "nf.desc":
    "There is no route here — the link may be out of date, or the address mistyped. Your keys and configs are unaffected either way: they only ever lived in your browser.",
  "nf.requested": "Requested address",
  "nf.home": "Go home",
  "nf.back": "Go back",
  "nf.elsewhere": "Perhaps you were looking for",
  "nf.link.generator": "Configuration generator",
  "nf.link.faq": "Answers to common questions",
  "nf.link.mergekeys": "Working with Amnezia keys",

  /* ── Packet simulator ─────────────────────────────────────────────────── */
  "sim.noData": "Nothing to simulate yet. First",
  "sim.noData.link": "generate a config",
  "sim.restart": "Restart",
  "sim.stat.packets": "packets",
  "sim.stat.bytes": "bytes total",
  "sim.stat.handshake": "handshake",
  "sim.stat.overhead": "overhead",
  "sim.stat.at10mbit": "at 10 Mbit/s",
  "sim.diagram.title": "Packet exchange diagram",
  "sim.client": "Client",
  "sim.server": "Server",
  "sim.legend.title": "Legend",
  "sim.packet": "Packet",
  "sim.detail.direction": "Direction",
  "sim.detail.size": "Size",
  "sim.detail.header": "Header (H)",
  "sim.detail.payload": "Payload",
  "sim.bytes": "bytes",
  "sim.table.title": "Packet table",
  "sim.table.type": "Type",
  "sim.table.direction": "Direction",
  "sim.table.size": "Size",
  "sim.table.header": "Header",
  "sim.table.desc": "Description",
  "sim.desc.cps": "CPS packet I{n}: {profile}",
  "sim.desc.junk": "Junk train {i}/{total} — traffic cover",
  "sim.desc.init": "WG Handshake Initiation, H1={h1}, S1={s1}",
  "sim.desc.response": "WG Handshake Response, H2={h2}, S2={s2}",
  "sim.desc.cookie": "Cookie Reply, H3={h3}, S3={s3}",
  "sim.desc.data": "Data transfer, H4={h4}, S4={s4}",
  "sim.desc.data3": "Data transfer, H4={h4}, S4={s4}, padding +{pad} B",
  "sim.hp.badge": "Header encrypted",
  "sim.hp.whole": "Whole message encrypted",
  "sim.hp.note":
    "AWG 3.0: a HeaderProtectionKey is set, so headers are encrypted with ChaCha20. Handshake and cookie messages are encrypted whole; transport packets only in their header.",
  "sim.version.note.10":
    "AWG 1.0: no CPS chains and no padded cookie reply; H1–H4 are fixed values.",
  "sim.version.note.15":
    "AWG 1.5: CPS chains are client-side only, S3/S4 are absent, and H1–H4 are fixed values.",
  "sim.legend.cps":
    "The signature chain that makes traffic resemble the chosen protocol.",
  "sim.legend.junk":
    "Decoy packets that confuse DPI ahead of the real handshake.",
  "sim.legend.init":
    "WireGuard Handshake Initiation — the first genuine WG packet.",
  "sim.legend.response": "WireGuard Handshake Response — the server's reply.",
  "sim.legend.cookie": "Cookie Reply — DDoS and amplification protection.",
  "sim.legend.data": "Encrypted VPN tunnel data.",
  /* XRay: the same roles, in a different protocol. */
  "sim.legend.clientHello":
    "TLS ClientHello. Under REALITY this is what carries the authentication — indistinguishable by size or extension list from a real browser.",
  "sim.legend.serverHello":
    "ServerHello and the certificate chain. Under REALITY they come from the real target site, which is also what sets their size.",
  "sim.legend.handshakeFinish": "Finished — the TLS handshake closes.",
  "sim.legend.vlessRequest":
    "The VLESS request header: version, UUID, flow, destination address and port. It rides inside the first application record.",
  "sim.legend.appData": "The payload — what everything else is for.",
  "sim.legend.padding": "Padding and the VLESS Encryption key exchange.",
  "sim.desc.xrayHelloReality":
    "ClientHello, SNI={sni}, fingerprint {fp}. The REALITY authentication is hidden in the hello's own fields.",
  "sim.desc.xrayHelloTls": "ClientHello, fingerprint {fp}.",
  "sim.desc.xrayServerHelloReality":
    "The answer from {dest}: the certificate is genuine, because it is the genuine one.",
  "sim.desc.xrayServerHelloTls": "ServerHello and the server certificate.",
  "sim.desc.xrayFinished": "Finished — the handshake is closed and application traffic follows.",
  "sim.desc.xrayVlessRequest": "VLESS header, {bytes} B, flow={flow}",
  "sim.desc.xrayEncryption": "VLESS Encryption key exchange: ML-KEM-768 plus X25519.",
  "sim.desc.xrayAppData": "Application data over {transport}, +{overhead} B of framing",

  /* ── MergeKeys ────────────────────────────────────────────────────────── */
  "mk.subtitle": "Key editor and Amnezia VPN container merging",
  "mk.loaded.title": "Config loaded from the generator.",
  "mk.loaded.hint": "Open the Editor tab and press “Apply obfuscation”.",
  "mk.notice.title": "No obfuscation config was passed in.",
  "mk.notice.body":
    "To update Jc/Jmin/Jmax/I1–I5, go back to the home page, press “Generate”, then “Open MergeKeys”.",
  "mk.notice.manual": "You can also edit a key by hand in the Editor tab.",
  "mk.notice.mergeWorks": "The Merge keys tab works without the generator.",
  "mk.tab.editor": "Editor and converter",
  "mk.tab.merge": "Merge keys",

  "mk.how.title": "Why merge keys?",
  "mk.how.1":
    "Amnezia VPN supports several containers (protocols) inside one key: AWG + XRay, AWG + OpenVPN and so on. That lets you switch protocols without changing keys.",
  "mk.how.2":
    "Paste two or more vpn:// keys into the slots below — an AWG key first, say, and an XRay key from the same server second.",
  "mk.how.3":
    "Press “Merge”. Containers from every key are collected into a single master key. Duplicates (same container name) are skipped with a warning.",
  "mk.how.4":
    "If you arrived from the generator, the new AWG obfuscation parameters are applied automatically to the AWG containers in the result.",
  "mk.how.5":
    "Metadata (dns1, dns2, hostName, defaultContainer) is taken from the first key. Descriptions are joined with “ + ”.",

  "mk.slots.title": "Keys to merge",
  "mk.slots.limits": "minimum 2, maximum 4",
  "mk.slot.remove": "Remove slot",
  "mk.slot.viewJson": "View JSON",
  "mk.slot.clear": "Clear",
  "mk.slot.add": "Add another key",
  "mk.action.merge": "Merge",
  "mk.action.clearAll": "Clear all",
  "mk.result.title": "Keys merged",
  "mk.result.label": "Merged key",
  "mk.action.copy": "Copy",
  "mk.action.copied": "Copied",
  "mk.action.downloadJson": "Download JSON",

  "mk.editor.title": "Editor and converter",
  "mk.editor.activeKey": "Active key",
  "mk.editor.key": "Key",
  "mk.editor.open": "Open",
  "mk.editor.openHint": "Open for preview and editing",
  "mk.editor.backToList": "back to the list",
  "mk.editor.tabCode": "Code",
  "mk.editor.tabFields": "Fields",
  "mk.editor.import": "Import",
  "mk.editor.showAs": "Show as",
  "mk.editor.noAwgContainer": "No AmneziaWG container",
  "mk.editor.multiHint":
    "One key per line. “Refresh obfuscation” applies to all of them; press “Open” to preview and edit a single key.",
  "mk.editor.placeholder":
    "Paste a vpn:// key, an AmneziaWG .conf or JSON… (several keys — one per line)",
  "mk.editor.empty": "Load a vpn:// key or a .conf to edit its fields.",
  "mk.editor.obfParams": "Obfuscation parameters",
  "mk.editor.dangerZone":
    "Danger zone — change these only if you know what they do",
  "mk.editor.checkHide": "Hide",
  "mk.editor.checkShow": "Check",
  "mk.editor.checkConfig": "config",
  "mk.editor.noIssues": "No problems found.",
  "mk.editor.applyObf": "Refresh obfuscation",
  "mk.editor.generateFirst": "Generate a config on the home page first",
  "mk.editor.pickContainer": "Pick an AWG container",
  "mk.editor.openOneToExport": "Open a single key to export",
  "mk.editor.openOneToDownload": "Open a single key to download",
  "mk.editor.exportVpn": "Export vpn://",
  "mk.editor.exportConf": "Export .conf",
  "mk.editor.download": "Download",

  "mk.msg.loadedConf":
    "Loaded AWG {version} config (Jc={jc}, Jmin={jmin}, Jmax={jmax}).",
  "mk.msg.cpsReady": "CPS I1–I5 are ready to apply.",
  "mk.msg.onlyJunk": "AWG 1.0: Jc/Jmin/Jmax only.",
  "mk.msg.noConfig": "No config",
  "mk.msg.noCps": "I1–I5 unsupported",
  "mk.msg.keyContents": "Key contents",
  "mk.msg.keyContentsN": "Contents of key #{n}",
  "mk.msg.slotEmpty": "Slot #{n} is empty.",
  "mk.msg.slotError": "Error in key #{n}: {error}",
  "mk.msg.needTwo": "Fill at least 2 fields with vpn:// keys.",
  "mk.msg.merged": "Merged {unique} containers from {keys} keys.",
  "mk.msg.dupes": "Duplicates skipped: {n}.",
  "mk.msg.obfUpdated": "AWG obfuscation updated: {fields}.",
  "mk.msg.unknownFormat":
    "Could not recognise the format (vpn:// / .conf / JSON).",
  "mk.msg.obfUpdatedKeys": "Obfuscation updated in {n} {keyWord}: {fields}.",
  "mk.msg.obfUpdatedOne":
    "Obfuscation updated: {fields} ({n} AWG {containerWord}).",
  "mk.msg.alreadyCurrent": "Parameters are already current — nothing to change.",
  "mk.msg.convertOne":
    "Conversion works on a single key. Leave one key in the editor.",
  "mk.slot.1": "First key",
  "mk.slot.2": "Second key",
  "mk.slot.3": "Third key",
  "mk.slot.4": "Fourth key",
  "mk.slot.n": "Key #{n}",

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
    "Bug reports and ideas are genuinely welcome. Join the discussion in the chat or open an issue on GitHub. If GitHub is blocked for you, the source is mirrored on git.vai-rice.space.",
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
  "footer.link.sourceMirror": "Source code on VIA GIT",
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

  /* ── Находки валидаторов ────────────────────────────────────────────── */
  // Тексты живут здесь, а не в валидаторах: находка несёт код и значения,
  // а предложение собирается на языке читателя.
  "find.awg3.version_mismatch":
    "AWG 3.0 parameters are set, but the config version is {version}.",
  "find.awg3.hpk_format":
    "HeaderProtectionKey must be {bytes} bytes in base64 ({chars} characters).",
  "find.awg3.s_below_nonce":
    "{name}={value} < {min}: with HeaderProtectionKey the cipher nonce is taken from the padding, and shorter padding quietly weakens the encryption.",
  "find.awg3.cpa_format":
    "ContentPaddingAddition must be a number or a min-max range.",
  "find.awg3.cpa_zero":
    "ContentPaddingAddition = 0 — the extra padding is switched off.",
  "find.awg3.timing_format":
    "{name} must be a number or a min-max range.",
  "find.awg3.timing_inverted":
    "{name}: the lower bound is above the upper one.",
  "find.awg3.reject_too_low":
    "RejectAfterTime ({reject}s) must exceed KeepaliveTimeout + RekeyTimeout ({floor}s), or the session dies before it can rekey.",
  "find.awg3.rekey_after_reject":
    "RekeyAfterTime (up to {rekey}s) must be below RejectAfterTime (from {reject}s).",
  "find.awg3.attempts_zero":
    "MaxHandshakeAttempts must be at least 1.",
  "find.parse.empty":
    "The config is empty.",
  "find.parse.not_awg":
    "This does not look like an AmneziaWG config: no parameters were found.",
  "find.parse.plain_wireguard":
    "No Jc found — this is a WireGuard config without AmneziaWG obfuscation.",
  "find.parse.missing":
    "Parameter {key} is missing.",
  "find.parse.not_a_number":
    "{key} must be a non-negative number, got “{value}”.",
  "find.parse.not_a_range":
    "{key} must be a start-end range on version {version}.",
  "find.parse.unsupported_for_version":
    "{key} is unused on version {version} and will be ignored.",
  "find.parse.unknown_version":
    "Version {version} is unknown to this build.",

  /* ── Находки движка XRay ────────────────────────────────────────────── */
  "find.xray.address_missing":
    "The server address is missing.",
  "find.xray.port_range":
    "Port {port} is outside the 1–65535 range.",
  "find.xray.vision_needs_tls":
    "xtls-rprx-vision works only over TLS or REALITY: “XTLS only supports TLS and REALITY directly for now”.",
  "find.xray.vision_no_udp":
    "xtls-rprx-vision does not support UDP and requires TLS 1.3 on the outer layer.",
  "find.xray.flow_mismatch":
    "The flow value must match on client and server: an empty flow against a vision account is rejected.",
  "find.xray.reality_transport":
    "REALITY does not work over the {transport} transport: only RAW, XHTTP and gRPC are supported.",
  "find.xray.hysteria_unsupported":
    "The Hysteria transport arrived in v26.1.13 — on {version} the core answers \"unknown transport protocol\" and refuses to start. The generator substitutes XHTTP.",
  "find.xray.transport_deprecated":
    "The {transport} transport is deprecated — the core recommends XHTTP instead.",
  "find.xray.reality_missing":
    "REALITY is selected but its parameter block is missing.",
  "find.xray.server_names_empty":
    "serverNames cannot be empty on the server side.",
  "find.xray.server_name_risky":
    "{name}: the core warns that this target raises the chance of the IP being blocked.",
  "find.xray.dest_missing":
    "The target is missing — the site the handshake is dressed as.",
  "find.xray.xver_range":
    "xver = {xver}: only 0, 1 and 2 are allowed.",
  "find.xray.key_length":
    "The key must be 32 bytes in unpadded base64 RawURL.",
  "find.xray.short_ids_empty":
    "shortIds cannot be empty on the server side.",
  "find.xray.short_id_long":
    "shortId “{id}” is longer than 16 characters.",
  "find.xray.short_id_odd":
    "shortId “{id}” has an odd length and will not decode as hex.",
  "find.xray.short_id_hex":
    "shortId “{id}” contains characters outside hex.",
  "find.xray.spider_x_slash":
    "spiderX must start with a slash.",
  /* Checks derived from a parameter's description rather than written per parameter. */
  /* .conf structure — what is about the file rather than the obfuscation. */
  /* Obfuscation parameter rules — engines/awg/rules.ts. */
  "find.awg.jc_range":
    "Jc must be between {min} and {max} — that is the kernel's limit.",
  "find.awg.jc_slow":
    "Jc = {jc}: every junk packet goes out before the handshake, so it will be noticeably slower.",
  "find.awg.jc_over_client":
    "Jc = {jc} is above the recommended maximum of {max} for {client}.",
  "find.awg.jmin_not_below_jmax":
    "Jmin must be strictly below Jmax.",
  "find.awg.jmax_over_mtu":
    "Jmax = {jmax} is at or above the MTU ({mtu}) — junk packets will fragment, and fragmentation is itself conspicuous.",
  "find.awg.size_max":
    "{key} = {value}: the maximum is {max}, above which the packet no longer fits in a UDP datagram.",
  "find.awg.s4_max":
    "S4 = {s4}: the protocol caps transport padding at {max} bytes.",
  "find.awg.s4_zero":
    "S4 = 0 — transport packet obfuscation is off.",
  "find.awg.s4_over_client":
    "S4 = {s4} is above the maximum of {max} for {client}.",
  "find.awg.size_collision":
    "{a} and {b} produce the same packet length — two message types become indistinguishable by size, which is exactly what the padding is there to prevent.",
  "find.awg.h_overlap":
    "The {a} and {b} ranges overlap: the receiver cannot tell one message type from the other.",
  "find.awg.h_reserved":
    "{key} falls in the 1–4 range, reserved for WireGuard's own message types.",
  "find.awg.h_over_client":
    "{key} goes above the maximum of {max} for {client}.",
  "find.awg.cps_syntax":
    "{key}: the CPS chain syntax is not valid.",
  "find.awg.cps_tag_unsupported":
    "The {tag} tag is not supported by {client}.",
  "find.awg.conf.not_obfuscated":
    "No AmneziaWG parameters (H/S/J/I) in this config — it looks like plain WireGuard.",
  "find.awg.conf.template":
    "This is a template: PrivateKey and Address are left commented out — fill in your own before using it.",
  "find.awg.conf.unparsable": "The .conf could not be parsed: {reason}",
  "find.awg.conf.no_interface": "No [Interface] section.",
  "find.awg.conf.no_peer": "No [Peer] sections — is this a server-only config?",
  "find.awg.conf.missing_field": "Required field {key} is missing.",
  "find.awg.conf.bad_key": "{key} does not look like a WireGuard key: 32 bytes in base64 (44 characters) expected.",
  "find.awg.conf.peer_missing_field": "Peer #{n}: {key} is missing.",
  "find.awg.conf.peer_bad_key": "Peer #{n}: {key} does not look like a WireGuard key.",
  "find.awg.conf.peer_bad_endpoint": "Peer #{n}: Endpoint has an unusual format — host:port expected.",
  "find.param.not_a_number": "{key}: expected a number.",
  "find.param.not_a_range": "{key}: expected a range written as “min-max”.",
  "find.param.range_inverted": "{key}: the lower bound {lo} is above the upper bound {hi}.",
  "find.param.below_min": "{key} = {actual}: below the minimum of {min}.",
  "find.param.above_max": "{key} = {actual}: above the maximum of {max}.",
  "find.param.not_encoded": "{key}: the value does not decode as {encoding}.",
  "find.param.wrong_length": "{key}: expected {expected} bytes once decoded, got {actual}.",
  "find.param.too_long": "{key}: {actual} characters, maximum {max}.",
  "find.param.not_allowed":
    "{key}: “{value}” is not one of the allowed values ({allowed}).",
  "find.validator.crashed":
    "The “{rule}” check crashed: {reason}. That is an Architect bug, not a config one.",
  "find.xray.fingerprint_refused":
    "The {fingerprint} fingerprint is refused by REALITY.",
  "find.xray.mldsa_unsupported":
    "ML-DSA-65 arrived in v25.7.23 and is unavailable on version {version}.",
  "find.xray.mldsa_required":
    "On v{version} a REALITY inbound will not start without mldsa65Seed — on that core the field is required, not optional.",
  "find.xray.mldsa_seed_length":
    "mldsa65Seed must be 32 bytes in base64 RawURL.",
  "find.xray.mldsa_seed_equals_key":
    "mldsa65Seed cannot equal privateKey — the core rejects that.",
  "find.xray.mldsa_verify_pending":
    "mldsa65Verify is derived by ML-DSA-65 itself: obtain it with xray mldsa65 from this seed.",
  "find.xray.mldsa_verify_length":
    "mldsa65Verify must be exactly 1952 bytes.",
  "find.xray.vless_enc_unsupported":
    "VLESS Encryption arrived in v25.8.29 and is unavailable on version {version}.",
  "find.xray.vless_enc_format":
    "The encryption string must start with mlkem768x25519plus and carry at least four elements.",
  "find.xray.vless_enc_mode":
    "Mode “{mode}” is unknown: native, xorpub and random are allowed.",
  "find.xray.xhttp_path_slash":
    "The XHTTP path must start with a slash.",
  "find.xray.xhttp_split_mode":
    "Split download is on, but the mode resolved to {mode} rather than stream-up.",
  "find.xray.xhttp_basic_only":
    "On v{version} XHTTP has only the basic knobs: the padding names, the session id, the sequence counter and the uplink placement all arrived in v26.6.22. They are not renamed there, they are absent — so the config is generated without them rather than with keys no core reads.",
  "find.xray.xhttp_session_names":
    "On version {version} the session keys are session* rather than sessionID* — the config uses the older spelling.",
  "find.xray.parse.not_vless":
    "The link must start with vless://.",
  "find.xray.parse.malformed_uri":
    "The link could not be parsed.",
  "find.xray.parse.no_uuid":
    "The link carries no client identifier.",
  "find.xray.parse.unknown_transport":
    "Unknown transport “{transport}”.",
  "find.xray.parse.version_assumed":
    "The config does not state a core version — {version} was assumed.",
  "find.xray.parse.no_public_key":
    "The link carries no public key (pbk).",
  "find.xray.parse.client_half_only":
    "This is the client half: the private key and the target are not part of a link.",
  "find.xray.parse.server_half_only":
    "This is the server half: the public key is derived from the private one and is not stored in the config.",
  "find.xray.parse.bad_json":
    "The JSON could not be parsed.",
  "find.xray.parse.not_vless_inbound":
    "Expected an inbound with protocol = vless, got “{protocol}”.",
  "find.xray.parse.no_clients":
    "The config carries no clients.",
  "find.xray.parse.unrecognised":
    "This looks like neither a vless:// link nor a JSON config.",
  /* ── Client field guide ───────────────────────────────────────────────── */
  "clientFields.toggle.title": "Where each parameter goes in the client",
  "clientFields.toggle.filled": "The Amnezia app’s form, filled with your values",
  "clientFields.toggle.empty": "The Amnezia app’s form, field by field",
  "clientFields.intro":
    "This is the parameter form as the Amnezia app lays it out, with field names exactly as the client shows them.",
  "clientFields.state.filled":
    "Showing your last generated config — click a field to copy it.",
  "clientFields.state.empty":
    "Generate a config on the home page and your own values will appear here.",
  "clientFields.group.junk": "Junk packets",
  "clientFields.group.sizes": "Junk sizes",
  "clientFields.group.headers": "Magic headers",
  "clientFields.group.cps": "Special junk",
  "clientFields.hint.jc": "how many junk packets",
  "clientFields.hint.jmin": "smallest junk packet",
  "clientFields.hint.jmax": "largest junk packet",
  "clientFields.hint.s1": "padding on the init packet",
  "clientFields.hint.s2": "padding on the response packet",
  "clientFields.hint.s3": "padding on the cookie reply",
  "clientFields.hint.s4": "padding on the transport packet",
  "clientFields.hint.h1": "header of the init packet",
  "clientFields.hint.h2": "header of the response packet",
  // The client calls this field "Underload"; the protocol calls the same
  // thing the cookie reply header. Both names, so the form and the docs meet.
  "clientFields.hint.h3": "cookie reply header",
  "clientFields.hint.h4": "header of the transport packet",
  "clientFields.hint.cps": "CPS chain {n}",

  /* ── MergeKeys: what the engine reports ───────────────────────────────── */
  "mk.err.lengthMismatch":
    "Decompressed length ({got}) does not match the header ({expected}).",
  "mk.err.decode": "The key could not be decoded: {error}",
  "mk.err.noConfig":
    "No config has been generated yet. Go back to the generator and press GENERATE.",
  "mk.err.noAwgContainer":
    "The key carries no AmneziaWG container. This tool only works with AmneziaWG keys.",
  "mk.err.noConfField":
    "The .conf could not be taken out of the AWG container: it has no config field.",
  "mk.err.needTwo": "Merging needs at least two keys.",
  "mk.warn.duplicateContainer":
    "Container “{name}” from key #{from} was skipped — key #{seen} already carries it.",
};

export default en;
