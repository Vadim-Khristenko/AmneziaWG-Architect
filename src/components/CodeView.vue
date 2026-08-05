<script setup lang="ts">
/**
 * A config, coloured by what the values mean rather than by syntax alone.
 *
 * The point is not decoration. A key is a wall of similar-looking strings —
 * base64 keys, byte counts, ranges, addresses — and telling them apart by eye
 * is most of the work of reading one. So an address is coloured as an address
 * and a range as a range, in both formats, using one set of rules.
 *
 * Nothing is built with innerHTML. Every token becomes a real element, so a
 * config carrying `<script>` in a description is text and stays text.
 */

import { computed } from "vue";

const props = defineProps<{
    text: string;
    lang: "json" | "conf";
    /** Soft-wrap long lines instead of scrolling sideways. */
    wrap?: boolean;
    /** Show a nested JSON string as structure rather than as one long line. */
    expand?: boolean;
    /** Indent JSON. Off gives the compact form, which some clients want. */
    indent?: boolean;
}>();

type Kind =
    | "plain"
    | "key"
    | "string"
    | "number"
    | "range"
    | "ip"
    | "bool"
    | "punct"
    | "comment"
    | "section"
    | "cps"
    | "var"
    | "proto"
    | "domain";

interface Token {
    k: Kind;
    v: string;
}

/* ── What a bare value looks like ─────────────────────────────────────────── */

const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?$/;
const IPV6 = /^[0-9a-f:]+:[0-9a-f:]*(?:\/\d{1,3})?$/i;
const RANGE = /^\d+\s*-\s*\d+$/;
const NUMBER = /^-?\d+(?:\.\d+)?$/;
const HOSTPORT = /^[a-z0-9.-]+:\d{1,5}$/i;

/**
 * A CPS chain: `<b 0x…>`, `<r 7>`, `<t>` and the rest, run together.
 *
 * It is the least readable thing in a config and the most distinctive, so it
 * gets its own colour rather than being lumped in with every other string.
 */
const CPS = /^<[a-z]+[^>]*>(?:<[a-z]+[^>]*>)*$/i;

/** A placeholder the client fills in, e.g. `$PRIMARY_DNS`. */
const VARIABLE = /^\$[A-Z_][A-Z0-9_]*$/;

/** A whole transport value, not the letters wherever they appear. */
const PROTO = /^(?:tcp|udp)$/i;

/**
 * A hostname. Checked after the address patterns, so `1.1.1.1` stays an
 * address rather than becoming a domain with numeric labels.
 */
const DOMAIN = /^(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

/** Classify a value that arrived without quotes. */
function classify(value: string): Kind {
    const v = value.trim();
    if (v === "") return "plain";
    if (VARIABLE.test(v)) return "var";
    if (CPS.test(v)) return "cps";
    if (RANGE.test(v)) return "range";
    if (NUMBER.test(v)) return "number";
    if (IPV4.test(v) || HOSTPORT.test(v)) return "ip";
    if (v.includes(":") && IPV6.test(v)) return "ip";
    if (v === "true" || v === "false" || v === "null") return "bool";
    if (PROTO.test(v)) return "proto";
    if (DOMAIN.test(v)) return "domain";
    return "string";
}

/* ── wg-quick ─────────────────────────────────────────────────────────────── */

function tokeniseConf(line: string): Token[] {
    const trimmed = line.trimStart();

    if (trimmed.startsWith("#") || trimmed.startsWith(";")) {
        return [{ k: "comment", v: line }];
    }
    if (/^\[.+\]\s*$/.test(trimmed)) {
        return [{ k: "section", v: line }];
    }

    const eq = line.indexOf("=");
    if (eq < 0) return [{ k: "plain", v: line }];

    const name = line.slice(0, eq);
    const value = line.slice(eq + 1);

    /*
     * A comma-separated value is several values, and colouring the whole run
     * as one loses the point: `AllowedIPs = 0.0.0.0/0, ::/0` is two addresses.
     */
    const parts: Token[] = [];
    const pieces = value.split(",");
    pieces.forEach((piece, i) => {
        if (i > 0) parts.push({ k: "punct", v: "," });
        parts.push({ k: classify(piece), v: piece });
    });

    return [{ k: "key", v: name }, { k: "punct", v: "=" }, ...parts];
}

/* ── JSON ─────────────────────────────────────────────────────────────────── */

/**
 * Walk the line rather than matching it whole.
 *
 * A regex over the whole string cannot tell a key from a value — both are
 * quoted — and the difference is the one a reader most wants coloured.
 */
function tokeniseJson(line: string): Token[] {
    const out: Token[] = [];
    let i = 0;

    while (i < line.length) {
        const ch = line[i];

        if (ch === '"') {
            let j = i + 1;
            while (j < line.length) {
                if (line[j] === "\\") j += 2;
                else if (line[j] === '"') break;
                else j++;
            }
            const raw = line.slice(i, Math.min(j + 1, line.length));
            const after = line.slice(j + 1).trimStart();
            const inner = raw.slice(1, -1);

            // A quoted run followed by a colon is a key; otherwise a value,
            // and a value gets classified by what it holds.
            out.push(
                after.startsWith(":")
                    ? { k: "key", v: raw }
                    : { k: classify(inner) === "string" ? "string" : classify(inner), v: raw },
            );
            i = j + 1;
            continue;
        }

        if (/[{}[\]:,]/.test(ch)) {
            out.push({ k: "punct", v: ch });
            i++;
            continue;
        }

        // A bare run: number, true, false, null, or whitespace.
        let j = i;
        while (j < line.length && !/["{}[\]:,]/.test(line[j])) j++;
        const run = line.slice(i, j);
        out.push(run.trim() ? { k: classify(run), v: run } : { k: "plain", v: run });
        i = j;
    }

    return out;
}

/**
 * JSON is re-indented on the way in.
 *
 * The text arrives from several places — an export, an edit, a paste — and one
 * of them being flat is enough to make the view unreadable. Re-printing it
 * here means the view is always indented, whatever handed it over. Anything
 * that does not parse is shown exactly as given.
 */
/**
 * A container stores its whole configuration again inside `last_config`, as a
 * JSON string. Printed as one it is a single unreadable line with \n in it,
 * which is exactly where the interesting values live — so for display it is
 * parsed and shown as structure.
 *
 * Display only. What gets edited and saved is the real text, string and all,
 * because the format wants a string there.
 */
function expandNested(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(expandNested);
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) out[k] = expandNested(v);
        return out;
    }
    if (typeof value === "string") {
        const t = value.trim();
        if (t.startsWith("{") && t.endsWith("}")) {
            try {
                return expandNested(JSON.parse(t));
            } catch {
                return value;
            }
        }
    }
    return value;
}

const source = computed(() => {
    if (props.lang !== "json") return props.text;
    try {
        const parsed = JSON.parse(props.text);
        const value = props.expand ? expandNested(parsed) : parsed;
        return JSON.stringify(value, null, props.indent === false ? 0 : 2);
    } catch {
        return props.text;
    }
});

const lines = computed(() =>
    source.value
        .replace(/^\n+|\n+$/g, "")
        .split("\n")
        .map((line) => (props.lang === "json" ? tokeniseJson(line) : tokeniseConf(line))),
);
</script>

<template>
    <pre class="cv" :class="{ 'cv--wrap': wrap }"><code><span v-for="(line, i) in lines" :key="i" class="cv-line"><span v-for="(tok, j) in line" :key="j" :class="`cv-${tok.k}`">{{ tok.v }}</span></span></code></pre>
</template>

<style scoped>
.cv {
    margin: 0;
    padding: var(--sp-4);
    max-height: 460px;
    overflow: auto;
    background: var(--ground-2);
    border: var(--rule) solid var(--line);
    border-radius: var(--r-1);
}

.cv code {
    font-family: var(--fm);
    font-size: var(--t-2xs);
    line-height: 1.75;
}

/* Stated on both sides: whichever rule wins, it is one of these two. */
.cv:not(.cv--wrap) code {
    white-space: pre;
    word-break: normal;
}

/*
 * Wrapping keeps a long base64 key on screen instead of pushing the panel
 * sideways; the indent is preserved so structure survives the wrap.
 */
.cv--wrap code {
    white-space: pre-wrap;
    word-break: break-all;
}

.cv-line {
    display: block;
    /* A blank line still occupies one, rather than collapsing the rhythm. */
    min-height: 1.75em;
}

/*
 * Colours come from the kit rather than from a syntax palette, so the view
 * belongs to this site in either scheme. Meaning, not token type: an address
 * reads the same in a .conf and in JSON.
 */
.cv-plain,
.cv-punct {
    color: var(--ink-3);
}

.cv-key {
    color: var(--accent-ink);
}

.cv-string {
    color: var(--ink-2);
}

.cv-number {
    color: var(--green);
}

.cv-range {
    color: var(--green);
    font-weight: 700;
}

.cv-ip {
    color: light-dark(#0b6bcb, #7fb3ff);
}

.cv-bool {
    color: light-dark(#8a5a00, #e0b062);
}

.cv-comment {
    color: var(--ink-4);
    font-style: italic;
}

.cv-section {
    color: var(--text);
    font-weight: 700;
}

/* The CPS chain — the densest thing in a config, so the most worth marking. */
.cv-cps {
    color: light-dark(#7a3fa8, #c9a2ff);
}

/* A placeholder the client substitutes, not a value anyone typed. */
.cv-var {
    color: light-dark(#8a5a00, #e0b062);
    font-weight: 700;
}

/* A transport, and a name that resolves — both worth picking out of a wall. */
.cv-proto {
    color: light-dark(#0a7d6b, #5fd4bd);
    font-weight: 700;
}

.cv-domain {
    color: light-dark(#0b6bcb, #7fb3ff);
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
}
</style>
