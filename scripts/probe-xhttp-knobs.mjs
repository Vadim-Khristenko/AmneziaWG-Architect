/**
 * Which XHTTP knobs does each released core actually have?
 *
 * Kept because it is how the version boundary was established, and how it
 * should be re-established when a new release lands. Run it, then feed the
 * output to scripts/xray-core-check.sh:
 *
 *   node scripts/probe-xhttp-knobs.mjs /tmp/probe
 *
 * and offer each file to each core with `xray run -test`.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * Which XHTTP knobs does each released core actually have?
 *
 * A core ignores JSON keys it does not know, so a config carrying a knob from
 * a later release loads happily and does nothing — the user sets a session-id
 * placement, sees it in the config, and the core never reads it.
 *
 * So each knob is probed with a value the core would *refuse* if it knew the
 * knob. Rejected means supported; accepted means silently ignored.
 */
const OUT = process.argv[2];
if (!OUT) throw new Error("usage: probe-xhttp.mjs <dir>");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/** [name, the xhttpSettings patch, the mode it needs] */
const PROBES = [
  ["xPaddingPlacement", { xPaddingPlacement: "nowhere-at-all" }],
  ["xPaddingMethod", { xPaddingMethod: "nowhere-at-all" }],
  ["sessionIDPlacement", { sessionIDPlacement: "nowhere-at-all" }],
  ["sessionPlacement", { sessionPlacement: "nowhere-at-all" }],
  ["seqPlacement", { seqPlacement: "nowhere-at-all" }],
  ["uplinkDataPlacement", { uplinkDataPlacement: "nowhere-at-all" }],
  ["uplinkHTTPMethod", { uplinkHTTPMethod: "GET" }],
  ["serverMaxHeaderBytes", { serverMaxHeaderBytes: -1 }],
  ["sessionIDTable", { sessionIDTable: "ab", sessionIDLength: "1-2" }],
  ["headers-host", { headers: { host: "example.com" } }],
];

const base = {
  log: { loglevel: "warning" },
  inbounds: [
    {
      listen: "0.0.0.0",
      port: 443,
      protocol: "vless",
      settings: {
        clients: [{ id: "11111111-1111-1111-1111-111111111111" }],
        decryption: "none",
      },
      streamSettings: {
        network: "xhttp",
        security: "none",
        // stream-up exists on every version, unlike stream-one.
        xhttpSettings: { path: "/probe", mode: "stream-up" },
      },
    },
  ],
  outbounds: [{ protocol: "freedom" }],
};

for (const [name, patch] of PROBES) {
  const config = JSON.parse(JSON.stringify(base));
  Object.assign(config.inbounds[0].streamSettings.xhttpSettings, patch);
  fs.writeFileSync(
    path.join(OUT, `${name}.json`),
    JSON.stringify(config, null, 2),
  );
}

// A control that must be accepted everywhere; if it is not, the probe itself
// is broken and every "supported" reading below would be a false positive.
fs.writeFileSync(path.join(OUT, "_control.json"), JSON.stringify(base, null, 2));

console.log(`${PROBES.length + 1} probes → ${OUT}`);
