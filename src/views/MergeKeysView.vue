<script setup lang="ts">
/**
 * MergeKeys — a workbench for keys.
 *
 * The page used to be two tabs: an editor and a merger. It is now four modes
 * over one shared result, because the thing people need first is neither of
 * those — it is being told what the string in their clipboard *is*. A key that
 * turns out to be a subscription rather than a tunnel, or a container whose
 * three copies of itself disagree, is invisible until something says so.
 *
 * Every mode ends at the same result panel: what the key holds, what is wrong
 * with it, what it can be handed over as, and what to call it. Written once
 * rather than four times.
 *
 * Nothing leaves the tab, which is the only reason a page that handles private
 * keys can exist at all.
 */

import { computed, onMounted, ref } from "vue";
import {
    ArrowRight,
    Check,
    Copy,
    Download,
    FileJson,
    FileText,
    Info,
    KeyRound,
    Layers,
    Link2,
    Plus,
    Search,
    Shuffle,
    Trash2,
    Wand2,
    X,
} from "lucide-vue-next";
import { useI18n } from "@/i18n";
import { useKeyWorkbench, type WorkbenchMode } from "@/composables/useKeyWorkbench";
import { useCopyFeedback } from "@/composables/useCopyFeedback";
import { downloadText, timestampedName } from "@/utils/download";
import { resolveFinding, sortFindings } from "@/shared/findings";
import RichText from "@/components/RichText";

const { t } = useI18n();
const { isCopied, copy } = useCopyFeedback();

const w = useKeyWorkbench();

const MODES: { id: WorkbenchMode; icon: typeof Search }[] = [
    { id: "inspect", icon: Search },
    { id: "merge", icon: Shuffle },
    { id: "refresh", icon: Wand2 },
    { id: "build", icon: Layers },
];

const tk = (key: string) => t(key as "mk.mode.inspect.title");

/* ── A config handed over by one of the generators ───────────────────────── */

const handoff = ref(false);

onMounted(() => {
    /*
     * The generators drop a key here on their way over. Read once and cleared:
     * a stale handoff surfacing on a later visit would attach a config to a
     * key the reader never meant to touch.
     */
    try {
        const raw = sessionStorage.getItem("architect:pending-key");
        if (raw) {
            w.refreshParams.value = raw;
            w.mode.value = "refresh";
            handoff.value = true;
            sessionStorage.removeItem("architect:pending-key");
        }
    } catch {
        // Storage blocked. The page works without it.
    }
});

/* ── The result ──────────────────────────────────────────────────────────── */

const findings = computed(() =>
    w.current.value ? sortFindings(w.current.value.findings) : [],
);

/**
 * A subscription key gets a paragraph rather than a badge.
 *
 * "Amnezia Premium" on a chip tells someone what they already knew. What they
 * do not know is why the page is offering them nothing to do: the key holds
 * access to a service, and the configuration arrives later.
 */
const service = computed(() => {
    const id = w.current.value?.identity;
    if (!id || id.shape !== "api") return null;

    const which =
        id.service === "amnezia-premium"
            ? "premium"
            : id.service === "amnezia-free"
              ? "free"
              : "other";

    const api = (w.current.value?.config as Record<string, unknown> | undefined)
        ?.api_config as Record<string, unknown> | undefined;

    const str = (v: unknown) => (typeof v === "string" ? v : undefined);

    return {
        title: tk(`mk.result.service.${which}.title`),
        desc: tk(`mk.result.service.${which}.desc`),
        // Read off the key rather than assumed: an older key has these flat.
        protocol:
            str(api?.service_protocol) ??
            str((w.current.value?.config as Record<string, unknown>).protocol),
        region: str(api?.user_country_code)?.toUpperCase(),
    };
});

/**
 * The extension is passed rather than baked into the name, because getting it
 * wrong is a file the reader's system opens with the wrong thing — and this
 * page hands out four different formats.
 */
function save(prefix: string, ext: string, text: string, mime: string): void {
    downloadText(text, timestampedName(prefix, ext), mime);
}
</script>

<template>
    <div class="mk rise">
        <!-- ══ Hero ═════════════════════════════════════════════════════ -->
        <header class="mk-hero">
            <h1 class="mk-wordmark">
                <span class="mk-wordmark-pre">{{ t("mk.hero.pre") }}</span>
                <span class="mk-wordmark-main">MergeKeys</span>
            </h1>

            <p class="lede mk-lede">{{ t("mk.hero.lede") }}</p>
            <RichText class="prose mk-desc" :text="t('mk.hero.desc')" inline />

            <div class="well mk-privacy">
                <Info :size="15" />
                <p>{{ t("mk.hero.privacy") }}</p>
            </div>
        </header>

        <!-- ══ Modes ════════════════════════════════════════════════════ -->
        <nav class="mk-modes" role="tablist" :aria-label="t('mk.modes.label')">
            <button
                v-for="m in MODES"
                :key="m.id"
                class="mk-mode"
                :class="{ 'is-active': w.mode.value === m.id }"
                role="tab"
                :aria-selected="w.mode.value === m.id"
                @click="w.mode.value = m.id"
            >
                <component :is="m.icon" :size="17" />
                <span class="mk-mode-text">
                    <span class="mk-mode-title">{{ tk(`mk.mode.${m.id}.title`) }}</span>
                    <span class="mk-mode-hint">{{ tk(`mk.mode.${m.id}.hint`) }}</span>
                </span>
            </button>
        </nav>

        <!-- ══ Inspect ══════════════════════════════════════════════════ -->
        <section v-if="w.mode.value === 'inspect'" class="mk-panel">
            <h2 class="h">{{ t("mk.mode.inspect.title") }}</h2>
            <RichText class="lede" :text="t('mk.mode.inspect.lede')" inline />

            <textarea
                v-model="w.inspectInput.value"
                class="mk-input"
                rows="5"
                spellcheck="false"
                :placeholder="t('mk.input.placeholder')"
                :aria-label="t('mk.mode.inspect.title')"
            ></textarea>

            <p v-if="w.inspected.value.error" class="mk-error">
                <X :size="15" />
                {{ w.inspected.value.error }}
            </p>
        </section>

        <!-- ══ Merge ════════════════════════════════════════════════════ -->
        <section v-else-if="w.mode.value === 'merge'" class="mk-panel">
            <h2 class="h">{{ t("mk.mode.merge.title") }}</h2>
            <p class="lede">{{ t("mk.mode.merge.lede") }}</p>

            <div class="mk-slots">
                <div v-for="(slot, i) in w.slots.value" :key="slot.id" class="mk-slot">
                    <div class="mk-slot-head">
                        <span class="rev">{{ i + 1 }}</span>
                        <span v-if="w.slotReads.value[i]?.identity" class="badge badge--ok">
                            {{
                                w.slotReads.value[i]!.identity!.containers.length
                                    ? w.slotReads.value[i]!.identity!.containers
                                          .map((c) => c.label)
                                          .join(" · ")
                                    : t("mk.result.noContainers")
                            }}
                        </span>
                        <span
                            v-else-if="w.slotReads.value[i]?.error"
                            class="badge badge--bad"
                        >
                            {{ t("mk.slot.unreadable") }}
                        </span>
                        <button
                            v-if="w.slots.value.length > 2"
                            class="btn btn--ghost btn--icon mk-slot-drop"
                            :aria-label="t('mk.slot.remove')"
                            @click="w.removeSlot(slot.id)"
                        >
                            <Trash2 :size="14" />
                        </button>
                    </div>
                    <textarea
                        v-model="slot.value"
                        class="mk-input mk-input--short"
                        rows="3"
                        spellcheck="false"
                        :placeholder="t('mk.input.placeholder')"
                    ></textarea>
                </div>
            </div>

            <div class="row mk-actions">
                <button class="btn btn--secondary" @click="w.addSlot()">
                    <Plus :size="15" />
                    {{ t("mk.slot.add") }}
                </button>
                <button class="btn btn--primary" @click="w.runMerge()">
                    <Shuffle :size="15" />
                    {{ t("mk.merge.run") }}
                </button>
            </div>

            <p v-if="w.mergeError.value" class="mk-error">
                <X :size="15" />
                {{ w.mergeError.value }}
            </p>

            <div v-if="w.mergeResult.value" class="titleblock mk-stats">
                <div class="titleblock-cell">
                    <span class="titleblock-key">{{ t("mk.merge.total") }}</span>
                    <span class="titleblock-val">{{
                        w.mergeResult.value.stats.total
                    }}</span>
                </div>
                <div class="titleblock-cell">
                    <span class="titleblock-key">{{ t("mk.merge.unique") }}</span>
                    <span class="titleblock-val">{{
                        w.mergeResult.value.stats.unique
                    }}</span>
                </div>
                <div class="titleblock-cell">
                    <span class="titleblock-key">{{ t("mk.merge.dupes") }}</span>
                    <span class="titleblock-val">{{
                        w.mergeResult.value.stats.dupes
                    }}</span>
                </div>
            </div>
        </section>

        <!-- ══ Refresh ══════════════════════════════════════════════════ -->
        <section v-else-if="w.mode.value === 'refresh'" class="mk-panel">
            <h2 class="h">{{ t("mk.mode.refresh.title") }}</h2>
            <p class="lede">{{ t("mk.mode.refresh.lede") }}</p>

            <div v-if="handoff" class="well mk-handoff">
                <ArrowRight :size="15" />
                <p>{{ t("mk.refresh.handoff") }}</p>
            </div>

            <label class="mk-field-label mk-stack-label">
                {{ t("mk.refresh.keyLabel") }}
            </label>
            <textarea
                v-model="w.refreshInput.value"
                class="mk-input mk-input--short"
                rows="4"
                spellcheck="false"
                :placeholder="t('mk.input.placeholder')"
                :aria-label="t('mk.refresh.keyLabel')"
            ></textarea>

            <p v-if="w.refreshed.value.error" class="mk-error">
                <X :size="15" />
                {{ w.refreshed.value.error }}
            </p>

            <label class="mk-field-label mk-stack-label">
                {{ t("mk.refresh.paramsLabel") }}
            </label>
            <textarea
                v-model="w.refreshParams.value"
                class="mk-input mk-input--short"
                rows="6"
                spellcheck="false"
                :placeholder="t('mk.refresh.paramsPlaceholder')"
                :aria-label="t('mk.refresh.paramsLabel')"
            ></textarea>

            <p v-if="Object.keys(w.patchFields.value).length" class="mk-found mono">
                {{ Object.keys(w.patchFields.value).join(" · ") }}
            </p>

            <div class="row mk-actions">
                <button class="btn btn--primary" @click="w.runRefresh()">
                    <Wand2 :size="15" />
                    {{ t("mk.refresh.run") }}
                </button>
            </div>

            <p v-if="w.refreshError.value" class="mk-error">
                <X :size="15" />
                {{ w.refreshError.value }}
            </p>

            <p v-if="w.refreshResult.value" class="mk-found">
                {{
                    t("mk.refresh.done", {
                        fields: w.refreshResult.value.changed.join(", ") || "—",
                    })
                }}
            </p>

            <RichText class="prose mk-note" :text="t('mk.refresh.scope')" inline />
        </section>

        <!-- ══ Build ════════════════════════════════════════════════════ -->
        <section v-else class="mk-panel">
            <h2 class="h">{{ t("mk.mode.build.title") }}</h2>
            <p class="lede">{{ t("mk.mode.build.lede") }}</p>

            <div class="mk-fields">
                <label class="mk-field">
                    <span class="mk-field-label">{{ t("mk.build.name") }}</span>
                    <input v-model="w.buildMeta.value.name" class="mk-text" type="text" />
                </label>
                <label class="mk-field">
                    <span class="mk-field-label">{{ t("mk.build.description") }}</span>
                    <input
                        v-model="w.buildMeta.value.description"
                        class="mk-text"
                        type="text"
                    />
                </label>
            </div>

            <label class="mk-field-label mk-stack-label">
                {{ t("mk.build.addLabel") }}
            </label>
            <textarea
                v-model="w.buildInput.value"
                class="mk-input mk-input--short"
                rows="4"
                spellcheck="false"
                :placeholder="t('mk.input.placeholder')"
                :aria-label="t('mk.build.addLabel')"
            ></textarea>

            <div class="row mk-actions">
                <button class="btn btn--secondary" @click="w.addPart()">
                    <Plus :size="15" />
                    {{ t("mk.build.add") }}
                </button>
            </div>

            <p v-if="w.buildError.value" class="mk-error">
                <X :size="15" />
                {{ w.buildError.value }}
            </p>

            <p class="prose mk-note">{{ t("mk.build.parts") }}</p>

            <ul v-if="w.parts.value.length" class="mk-parts">
                <li v-for="(part, i) in w.parts.value" :key="i" class="mk-part">
                    <code class="code">{{ part.container }}</code>
                    <button
                        class="btn btn--ghost btn--icon"
                        :aria-label="t('mk.build.removePart')"
                        @click="w.removePart(i)"
                    >
                        <Trash2 :size="14" />
                    </button>
                </li>
            </ul>
            <p v-else class="mk-empty-note">{{ t("mk.build.empty") }}</p>
        </section>

        <!-- ══ Result ═══════════════════════════════════════════════════ -->
        <section v-if="w.current.value" class="mk-result">
            <div class="mk-result-head">
                <h2 class="h">{{ t("mk.result.title") }}</h2>
            </div>

            <!-- A subscription key: say what it is and why nothing is on offer. -->
            <div v-if="service" class="panel mk-service">
                <div class="panel-head">
                    <KeyRound :size="17" />
                    <h3 class="panel-title">{{ service.title }}</h3>
                </div>
                <div class="panel-body">
                    <p class="prose">{{ service.desc }}</p>
                    <div v-if="service.protocol || service.region" class="titleblock">
                        <div v-if="service.protocol" class="titleblock-cell">
                            <span class="titleblock-key">
                                {{ t("mk.result.service.protocol") }}
                            </span>
                            <span class="titleblock-val">{{ service.protocol }}</span>
                        </div>
                        <div v-if="service.region" class="titleblock-cell">
                            <span class="titleblock-key">
                                {{ t("mk.result.service.region") }}
                            </span>
                            <span class="titleblock-val">{{ service.region }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="w.current.value.identity.containers.length"
                class="mk-containers"
            >
                <article
                    v-for="c in w.current.value.identity.containers"
                    :key="c.name"
                    class="mk-container"
                >
                    <header class="mk-container-head">
                        <span class="mk-container-label">{{ c.label }}</span>
                        <span v-if="c.awgVersion" class="rev">{{ c.awgVersion }}</span>
                        <span v-if="c.inferred" class="badge badge--quiet">
                            {{ t("mk.result.inferred") }}
                        </span>
                    </header>
                    <code class="code mk-container-name">{{ c.name }}</code>
                    <p v-if="c.hostName" class="mk-container-addr mono">
                        {{ c.hostName }}<template v-if="c.port">:{{ c.port }}</template>
                    </p>
                </article>
            </div>
            <p v-else class="mk-empty-note">{{ t("mk.result.noContainers") }}</p>

            <ul v-if="findings.length" class="mk-findings">
                <li
                    v-for="(f, i) in findings"
                    :key="`${f.code}-${i}`"
                    class="mk-finding"
                    :class="`is-${f.level}`"
                >
                    <span
                        class="dot"
                        :class="f.level === 'error' ? 'dot--bad' : ''"
                    ></span>
                    <span>{{ resolveFinding(f) }}</span>
                </li>
            </ul>

            <div class="mk-fields">
                <label class="mk-field">
                    <span class="mk-field-label">{{ t("mk.build.name") }}</span>
                    <input v-model="w.labelEdits.value.name" class="mk-text" type="text" />
                </label>
                <label class="mk-field">
                    <span class="mk-field-label">{{ t("mk.build.description") }}</span>
                    <input
                        v-model="w.labelEdits.value.description"
                        class="mk-text"
                        type="text"
                    />
                </label>
                <button class="btn btn--secondary" @click="w.applyLabels()">
                    {{ t("mk.result.rename") }}
                </button>
            </div>

            <div class="mk-exports">
                <div class="mk-export">
                    <code class="code mk-export-value">{{ w.currentKey.value }}</code>
                    <button
                        class="btn btn--ghost btn--icon"
                        :class="{ 'is-done': isCopied('key') }"
                        :aria-label="t('mk.result.copy')"
                        @click="copy('key', w.currentKey.value)"
                    >
                        <Check v-if="isCopied('key')" :size="15" />
                        <Copy v-else :size="15" />
                    </button>
                </div>

                <div class="row mk-actions">
                    <button
                        class="btn btn--secondary"
                        @click="
                            save('AnyTech_Architect_Key', 'txt', w.currentKey.value, 'text/plain')
                        "
                    >
                        <Link2 :size="15" />
                        vpn://
                    </button>
                    <button
                        v-if="w.currentExports.value"
                        class="btn btn--secondary"
                        @click="
                            save(
                                'AnyTech_Architect_Key',
                                'json',
                                w.currentExports.value?.json ?? '',
                                'application/json',
                            )
                        "
                    >
                        <FileJson :size="15" />
                        JSON
                    </button>
                    <button
                        v-for="(text, name) in w.currentExports.value?.conf ?? {}"
                        :key="`conf-${name}`"
                        class="btn btn--secondary"
                        @click="save(`AnyTech_${name}`, 'conf', text, 'text/plain')"
                    >
                        <FileText :size="15" />
                        .conf
                    </button>
                    <button
                        v-for="(text, name) in w.currentExports.value?.vless ?? {}"
                        :key="`vless-${name}`"
                        class="btn btn--secondary"
                        :class="{ 'is-done': isCopied(`vless-${name}`) }"
                        @click="copy(`vless-${name}`, text)"
                    >
                        <Check v-if="isCopied(`vless-${name}`)" :size="15" />
                        <Download v-else :size="15" />
                        vless://
                    </button>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.mk {
    max-width: 1000px;
    margin: 0 auto;
    padding: var(--sp-8) var(--sp-gutter) var(--sp-10);
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
.mk-hero {
    margin-bottom: var(--sp-8);
}

.mk-wordmark {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    margin: 0 0 var(--sp-4);
}

.mk-wordmark-pre {
    font-family: var(--fm);
    font-size: var(--t-sm);
    letter-spacing: var(--track-label);
    text-transform: uppercase;
    color: var(--ink-3);
}

.mk-wordmark-main {
    font-family: var(--fu);
    font-weight: 900;
    font-size: clamp(2.2rem, 7vw, 3.4rem);
    line-height: 1;
    letter-spacing: var(--track-display);
    color: var(--accent-ink);
}

.mk-lede {
    max-width: 68ch;
    margin: 0 0 var(--sp-4);
}

.mk-desc {
    max-width: 68ch;
    margin: 0 0 var(--sp-5);
}

.mk-privacy {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    color: var(--accent-ink);
}

.mk-privacy p {
    margin: 0;
    font-size: var(--t-sm);
    line-height: 1.6;
    color: var(--ink-2);
}

/* ── Modes ────────────────────────────────────────────────────────────── */
.mk-modes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: var(--sp-2);
    margin-bottom: var(--sp-7);
}

.mk-mode {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    padding: var(--sp-4);
    text-align: left;
    border: var(--rule) solid var(--line);
    border-radius: var(--r-2);
    background: var(--surface-solid);
    color: var(--ink-2);
    cursor: pointer;
    transition:
        border-color var(--trans-fast),
        background var(--trans-fast),
        color var(--trans-fast);
}

.mk-mode:hover {
    color: var(--text);
    border-color: var(--accent-ink);
}

.mk-mode.is-active {
    background: var(--surface-solid-2);
    border-color: var(--accent-ink);
    color: var(--text);
}

.mk-mode-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.mk-mode-title {
    font-family: var(--fw);
    font-weight: 800;
    font-size: var(--t-sm);
}

.mk-mode-hint {
    font-size: var(--t-2xs);
    color: var(--ink-3);
    line-height: 1.4;
}

/* ── Panels ───────────────────────────────────────────────────────────── */
.mk-panel {
    margin-bottom: var(--sp-8);
}

.mk-input {
    display: block;
    width: 100%;
    margin-top: var(--sp-5);
    padding: var(--sp-4);
    background: var(--ground-2);
    border: var(--rule) solid var(--line);
    border-radius: var(--r-2);
    color: var(--text);
    font-family: var(--fm);
    font-size: var(--t-xs);
    line-height: 1.6;
    resize: vertical;
    word-break: break-all;
}

.mk-input:focus {
    outline: none;
    border-color: var(--accent-ink);
}

.mk-input--short {
    margin-top: var(--sp-2);
}

.mk-error {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: var(--sp-3) 0 0;
    font-size: var(--t-sm);
    color: var(--red);
}

.mk-note,
.mk-empty-note {
    margin: var(--sp-4) 0 0;
    font-size: var(--t-sm);
    color: var(--ink-3);
}

.mk-actions {
    gap: var(--sp-2);
    flex-wrap: wrap;
    margin-top: var(--sp-4);
}

.mk-handoff {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    margin-top: var(--sp-4);
    color: var(--accent-ink);
}

.mk-handoff p {
    margin: 0;
    font-size: var(--t-sm);
    line-height: 1.6;
    color: var(--ink-2);
}

/* ── Merge slots ──────────────────────────────────────────────────────── */
.mk-slots {
    display: grid;
    gap: var(--sp-4);
    margin-top: var(--sp-5);
}

.mk-slot-head {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex-wrap: wrap;
}

.mk-slot-drop {
    margin-left: auto;
}

.mk-stats {
    margin-top: var(--sp-5);
}

/* ── Fields ───────────────────────────────────────────────────────────── */
.mk-fields {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-3);
    margin-top: var(--sp-5);
}

.mk-field {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    flex: 1 1 220px;
}

.mk-field-label {
    font-family: var(--fm);
    font-size: var(--t-2xs);
    letter-spacing: var(--track-label);
    text-transform: uppercase;
    color: var(--ink-3);
}

.mk-text {
    padding: var(--sp-3) var(--sp-4);
    background: var(--ground-2);
    border: var(--rule) solid var(--line);
    border-radius: var(--r-1);
    color: var(--text);
    font-family: var(--fw);
    font-size: var(--t-sm);
}

.mk-text:focus {
    outline: none;
    border-color: var(--accent-ink);
}

.mk-parts {
    display: grid;
    gap: var(--sp-2);
    margin: var(--sp-4) 0 0;
    padding: 0;
    list-style: none;
}

.mk-part {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    background: var(--surface-solid);
    border: var(--rule) solid var(--line);
    border-radius: var(--r-1);
}

.mk-part .code {
    flex: 1;
}

/* ── Result ───────────────────────────────────────────────────────────── */
.mk-result {
    padding: var(--sp-6);
    background: var(--surface-solid);
    border: var(--rule) solid var(--line);
    border-radius: var(--r-3);
}

.mk-result-head {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    flex-wrap: wrap;
    margin-bottom: var(--sp-5);
}

.mk-result-head .h {
    margin: 0;
}

.mk-containers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--sp-3);
}

.mk-container {
    padding: var(--sp-4);
    background: var(--ground-2);
    border: var(--rule) solid var(--line-faint);
    border-radius: var(--r-1);
}

.mk-container-head {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex-wrap: wrap;
    margin-bottom: var(--sp-2);
}

.mk-container-label {
    font-family: var(--fw);
    font-weight: 800;
    font-size: var(--t-sm);
    color: var(--text);
}

.mk-container-name {
    font-size: var(--t-2xs);
}

.mk-container-addr {
    margin: var(--sp-2) 0 0;
    font-size: var(--t-2xs);
    color: var(--ink-3);
}

.mk-findings {
    display: grid;
    gap: var(--sp-2);
    margin: var(--sp-5) 0 0;
    padding: 0;
    list-style: none;
}

.mk-finding {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    font-size: var(--t-sm);
    line-height: 1.6;
    color: var(--ink-2);
    text-wrap: pretty;
}

.mk-finding .dot {
    margin-top: 0.5em;
    flex-shrink: 0;
}

.mk-finding.is-error {
    color: var(--text);
}

.mk-exports {
    margin-top: var(--sp-6);
}

.mk-export {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
}

.mk-export-value {
    flex: 1;
    min-width: 0;
    padding: var(--sp-3) var(--sp-4);
    overflow-x: auto;
    white-space: nowrap;
}

.is-done {
    color: var(--green);
}

.mk-service {
    margin-bottom: var(--sp-5);
}

.mk-service .panel-body {
    display: grid;
    gap: var(--sp-4);
}

.mk-stack-label {
    display: block;
    margin-top: var(--sp-5);
}

.mk-found {
    margin: var(--sp-3) 0 0;
    font-size: var(--t-xs);
    color: var(--accent-ink);
}

/* Inline marks inside the page's own prose. */
.mk :deep(code) {
    font-family: var(--fm);
    font-size: 0.88em;
    padding: 1px 5px;
    border-radius: var(--r-0);
    background: var(--ground-3);
    color: var(--accent-ink);
    white-space: nowrap;
}

.mk :deep(strong) {
    color: var(--text);
    font-weight: 700;
}

@media (max-width: 640px) {
    .mk {
        padding: var(--sp-6) var(--sp-gutter) var(--sp-8);
    }

    .mk-result {
        padding: var(--sp-4);
    }
}
</style>
