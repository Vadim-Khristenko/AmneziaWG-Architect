/**
 * MergeKeys — the key-format engine.
 *
 * Reads and writes the Amnezia `vpn://` container format, which is not
 * tied to one protocol: a single key can hold WireGuard, AmneziaWG, XRay
 * and OpenVPN at once. It sat under `engines/awg` while almost all of it
 * was AmneziaWG work, and could then only import downwards into that one
 * engine — which is the wrong direction for something both generators are
 * about to hand configurations to.
 */

export * from "./types";
export * from "./codec";
export * from "./containers";
export * from "./patch";
export * from "./merge";
