<script setup lang="ts">
import { RouterView } from "vue-router";
import MainHeader from "./components/MainHeader.vue";
import MainFooter from "./components/MainFooter.vue";
</script>

<template>
    <div class="app-wrapper">
        <!-- ── Layered Background FX ──────────────────────────────────── -->
        <div class="bg-fx" aria-hidden="true">
            <!-- Grid mesh overlay -->
            <div class="bg-grid"></div>

            <!-- Radial vignette -->
            <div class="bg-vignette"></div>
        </div>

        <!-- ── App Shell ──────────────────────────────────────────────── -->
        <MainHeader />

        <main class="main-content">
            <RouterView v-slot="{ Component, route }">
                <component :is="Component" :key="route.path" />
            </RouterView>
        </main>

        <MainFooter />
    </div>
</template>

<style>
/* ── App Wrapper ──────────────────────────────────────────────────────── */
.app-wrapper {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    z-index: 1;
    isolation: isolate;
}

.main-content {
    flex: 1;
    position: relative;
    z-index: 2;
    padding-top: 64px;
    min-height: calc(100vh - 64px - 96px);
}

/* ══════════════════════════════════════════════════════════════════════════
   BACKGROUND FX — Layered Aurora + Grid Mesh + Noise + Vignette
   ══════════════════════════════════════════════════════════════════════════ */
.bg-fx {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    background-color: var(--bg);
}

/* ── Grid Mesh ────────────────────────────────────────────────────────── */
.bg-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(232, 168, 64, 0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(232, 168, 64, 0.018) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(
        ellipse 80% 60% at 50% 30%,
        rgba(0, 0, 0, 0.5) 0%,
        transparent 100%
    );
    -webkit-mask-image: radial-gradient(
        ellipse 80% 60% at 50% 30%,
        rgba(0, 0, 0, 0.5) 0%,
        transparent 100%
    );
    z-index: 2;
}

/* ── Radial Vignette ──────────────────────────────────────────────────── */
.bg-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
        ellipse 70% 50% at 50% 40%,
        transparent 0%,
        rgba(10, 8, 6, 0.3) 60%,
        rgba(10, 8, 6, 0.7) 100%
    );
    z-index: 5;
}
</style>
