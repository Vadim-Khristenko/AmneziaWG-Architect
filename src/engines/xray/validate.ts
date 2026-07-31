/**
 * Checking an XRay configuration against the core's own rules.
 *
 * Every rule below is one Xray-core enforces, with the file it lives in named
 * beside it. The point is to fail here, where a message can explain, rather
 * than in the core, where the config simply does not load — or worse, loads
 * and produces a tunnel that nobody can connect to.
 */

import { fromBase64Url } from "@/shared/x25519";
import { error, warn, info } from "@/shared/findings";
import type { Finding } from "@/types/findings";
import { xrayCaps } from "./versions";
import { REALITY_TRANSPORTS } from "./types";
import type { XrayConfig } from "./types";

/** base64 RawURL that decodes to exactly `bytes`. */
function isKeyOfLength(value: string, bytes: number): boolean {
  const decoded = fromBase64Url(value);
  return decoded !== null && decoded.length === bytes;
}

/**
 * Target names the core warns about.
 *
 * Straight from `transport_security.go`: these raise the chance of the
 * server's IP being blocked, so the warning is the core's, not ours.
 */
function isRiskyServerName(name: string): boolean {
  const sn = name.toLowerCase();
  return (
    sn.endsWith(".ru") ||
    sn.endsWith(".ir") ||
    sn.endsWith(".cn") ||
    sn.includes("apple") ||
    sn.includes("icloud") ||
    sn.includes("microsoft")
  );
}

export function validateXray(cfg: XrayConfig): Finding[] {
  const findings: Finding[] = [];
  const caps = xrayCaps(cfg.version);

  /* ── Endpoint ───────────────────────────────────────────────────────────── */

  if (!cfg.address.trim()) {
    findings.push(error("address", "xray.address_missing"));
  }
  if (!Number.isInteger(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
    findings.push(error("port", "xray.port_range", { port: cfg.port }));
  }

  /* ── Flow ───────────────────────────────────────────────────────────────── */

  if (cfg.flow === "xtls-rprx-vision") {
    // "XTLS only supports TLS and REALITY directly for now."
    if (cfg.security === "none") {
      findings.push(error("flow", "xray.vision_needs_tls"));
    }
    // Vision refuses UDP and breaks Mux carrying TCP; both are inbound-side
    // behaviours the client cannot see, so this is worth stating up front.
    findings.push(info("flow", "xray.vision_no_udp"));
  }

  const mismatched = cfg.clients.filter((c) => c.flow !== cfg.flow);
  if (mismatched.length) {
    // An empty client flow against a vision account is rejected by the core
    // with a note about "TLS in TLS characters".
    findings.push(error("flow", "xray.flow_mismatch"));
  }

  /* ── Transport and security ─────────────────────────────────────────────── */

  if (
    cfg.security === "reality" &&
    !REALITY_TRANSPORTS.includes(cfg.transport)
  ) {
    findings.push(
      error("transport", "xray.reality_transport", {
        transport: cfg.transport,
      }),
    );
  }

  if (cfg.transport === "ws" || cfg.transport === "httpupgrade") {
    findings.push(warn("transport", "xray.transport_deprecated", {
      transport: cfg.transport,
    }));
  }

  /* ── REALITY ────────────────────────────────────────────────────────────── */

  const reality = cfg.reality;
  if (cfg.security === "reality") {
    if (!reality) {
      findings.push(error("reality", "xray.reality_missing"));
    } else {
      if (!reality.serverNames.length) {
        findings.push(error("serverNames", "xray.server_names_empty"));
      }
      for (const name of reality.serverNames) {
        if (isRiskyServerName(name)) {
          findings.push(warn("serverNames", "xray.server_name_risky", { name }));
        }
      }

      if (!reality.dest.trim()) {
        findings.push(error("dest", "xray.dest_missing"));
      }

      if (![0, 1, 2].includes(reality.xver)) {
        findings.push(error("xver", "xray.xver_range", { xver: reality.xver }));
      }

      if (!isKeyOfLength(reality.keys.privateKey, 32)) {
        findings.push(error("privateKey", "xray.key_length"));
      }
      // A server half legitimately has no public key: it is derived from the
      // private one and never written into the inbound. Only a value that is
      // present and wrong is an error.
      if (reality.keys.publicKey && !isKeyOfLength(reality.keys.publicKey, 32)) {
        findings.push(error("publicKey", "xray.key_length"));
      }

      if (!reality.shortIds.length) {
        findings.push(error("shortIds", "xray.short_ids_empty"));
      }
      for (const id of reality.shortIds) {
        if (id.length > 16) {
          findings.push(error("shortId", "xray.short_id_long", { id }));
        } else if (id.length % 2 !== 0) {
          findings.push(error("shortId", "xray.short_id_odd", { id }));
        } else if (!/^[0-9a-f]*$/i.test(id)) {
          findings.push(error("shortId", "xray.short_id_hex", { id }));
        }
      }

      if (!reality.spiderX.startsWith("/")) {
        findings.push(error("spiderX", "xray.spider_x_slash"));
      }

      if (reality.fingerprint === "unsafe" || reality.fingerprint === "hellogolang") {
        findings.push(error("fingerprint", "xray.fingerprint_refused", {
          fingerprint: reality.fingerprint,
        }));
      }

      const mldsa = reality.mldsa65;
      if (!mldsa && caps.mldsa65 === "required") {
        // v25.7.23 refuses a REALITY inbound with no seed. A config without
        // one does not start, so this is an error and not a note.
        findings.push(
          error("mldsa65Seed", "xray.mldsa_required", { version: cfg.version }),
        );
      }
      if (mldsa) {
        if (caps.mldsa65 === "none") {
          findings.push(
            error("mldsa65Seed", "xray.mldsa_unsupported", {
              version: cfg.version,
            }),
          );
        }
        if (!isKeyOfLength(mldsa.seed, 32)) {
          findings.push(error("mldsa65Seed", "xray.mldsa_seed_length"));
        }
        if (mldsa.seed === reality.keys.privateKey) {
          findings.push(error("mldsa65Seed", "xray.mldsa_seed_equals_key"));
        }
        if (!mldsa.verify) {
          // Deriving the 1952-byte key needs ML-DSA-65 itself, which this page
          // does not carry. Saying so beats emitting a wrong value.
          findings.push(warn("mldsa65Verify", "xray.mldsa_verify_pending"));
        } else if (!isKeyOfLength(mldsa.verify, 1952)) {
          findings.push(error("mldsa65Verify", "xray.mldsa_verify_length"));
        }
      }
    }
  }

  /* ── VLESS Encryption ───────────────────────────────────────────────────── */

  if (cfg.vlessEncryption) {
    if (!caps.vlessEncryption) {
      findings.push(
        error("decryption", "xray.vless_enc_unsupported", {
          version: cfg.version,
        }),
      );
    }
    const parts = cfg.vlessEncryption.decryption.split(".");
    if (parts[0] !== "mlkem768x25519plus" || parts.length < 4) {
      findings.push(error("decryption", "xray.vless_enc_format"));
    } else if (!["native", "xorpub", "random"].includes(parts[1])) {
      findings.push(
        error("decryption", "xray.vless_enc_mode", { mode: parts[1] }),
      );
    }
  }

  /* ── XHTTP ──────────────────────────────────────────────────────────────── */

  if (cfg.xhttp) {
    if (!cfg.xhttp.path.startsWith("/")) {
      findings.push(error("path", "xray.xhttp_path_slash"));
    }
    if (cfg.xhttp.splitDownload && cfg.xhttp.resolvedMode !== "stream-up") {
      findings.push(info("mode", "xray.xhttp_split_mode", {
        mode: cfg.xhttp.resolvedMode,
      }));
    }
    if (!caps.sessionIdNames) {
      // Before v26.6.22 the keys were `session*`; the renderer emits the old
      // spelling, and this says so rather than leaving it to be discovered.
      findings.push(info("sessionID", "xray.xhttp_session_names", {
        version: cfg.version,
      }));
    }
  }

  return findings;
}
