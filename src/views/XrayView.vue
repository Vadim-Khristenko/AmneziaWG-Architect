<script setup lang="ts">
/**
 * XRay — the page the engine does not yet have an interface for.
 *
 * It exists because the landing points here and a link that goes nowhere is
 * worse than a page that says what is true: the engine is written and tested,
 * the interface is not built, and here is exactly what is done and what is
 * not. Nothing on it pretends to be a control.
 */

import {
    Network,
    KeyRound,
    Braces,
    Route,
    Fingerprint,
    FlaskConical,
    ArrowRight,
} from "lucide-vue-next";
import { localizePath, useI18n } from "@/i18n";

const { locale, t } = useI18n();

const READY = [
    { icon: KeyRound, key: "xray.ready.reality" },
    { icon: Braces, key: "xray.ready.vless" },
    { icon: Route, key: "xray.ready.xhttp" },
    { icon: Fingerprint, key: "xray.ready.fp" },
    { icon: FlaskConical, key: "xray.ready.tests" },
] as const;
</script>

<template>
    <div class="xray">
        <header class="xray-head k-stagger">
            <span class="k-badge">{{ t("xray.badge") }}</span>
            <h1 class="k-display k-display--sm xray-title">
                <Network :size="28" class="xray-title-icon" />
                {{ t("xray.title") }}
            </h1>
            <p class="k-lede">{{ t("xray.lede") }}</p>
        </header>

        <section class="k-panel">
            <div class="k-panel-head">
                <span class="k-panel-title">{{ t("xray.ready.title") }}</span>
            </div>
            <ul class="k-list">
                <li v-for="r in READY" :key="r.key" class="k-list-item">
                    <component :is="r.icon" :size="17" class="xray-item-icon" />
                    <span>{{ t(r.key) }}</span>
                </li>
            </ul>
        </section>

        <!-- Hatched, because that is this kit's mark for "not available". -->
        <section class="k-void xray-left">
            <h2 class="k-h3">{{ t("xray.left.title") }}</h2>
            <p class="k-prose">{{ t("xray.left.desc") }}</p>
        </section>

        <router-link
            :to="localizePath('/amneziawg', locale)"
            class="k-btn k-btn--primary xray-cta"
        >
            {{ t("xray.meanwhile") }}
            <ArrowRight :size="16" />
        </router-link>
    </div>
</template>

<style scoped>
.xray {
    max-width: 760px;
    margin: 0 auto;
    padding: var(--sp-8) var(--sp-gutter) var(--sp-10);
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
}

.xray-head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-4);
}

.xray-title {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin: 0;
}

.xray-title-icon {
    color: var(--accent-ink);
    flex-shrink: 0;
}

.xray-item-icon {
    color: var(--accent-ink);
    flex-shrink: 0;
}

.xray-left {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-5);
}

.xray-cta {
    align-self: flex-start;
    text-decoration: none;
}
</style>
