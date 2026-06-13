<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import MainHeader from "./components/MainHeader.vue";
import MainFooter from "./components/MainFooter.vue";

onMounted(() => {
    console.log(
        "%c AmneziaWG Architect %c Vue + TS + Router ",
        "background: #e8a840; color: #0a0806; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;",
        "background: #181410; color: #e0d4b8; padding: 2px 6px; border-radius: 0 4px 4px 0;",
    );
});
</script>

<template>
    <div class="app-wrapper">
        <!-- ── Layered Background FX ──────────────────────────────────── -->
        <div class="bg-fx" aria-hidden="true">
            <!-- Noise grain texture -->
            <div class="bg-noise"></div>

            <!-- Grid mesh overlay -->
            <div class="bg-grid"></div>

            <!-- Primary aurora: warm amber, top-left -->
            <div class="bg-glow bg-glow-1"></div>

            <!-- Secondary aurora: cool teal, bottom-right -->
            <div class="bg-glow bg-glow-2"></div>

            <!-- Tertiary: deep amber center pulse -->
            <div class="bg-glow bg-glow-3"></div>

            <!-- Quaternary: subtle magenta far corner -->
            <div class="bg-glow bg-glow-4"></div>

            <!-- Horizon line accent -->
            <div class="bg-horizon"></div>

            <!-- Radial vignette -->
            <div class="bg-vignette"></div>
        </div>

        <!-- ── App Shell ──────────────────────────────────────────────── -->
        <MainHeader />

        <main class="main-content">
            <RouterView v-slot="{ Component, route }">
                <transition name="page-fade" mode="out-in">
                    <component :is="Component" :key="route.path" />
                </transition>
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
    padding-top: 80px;
    /* Reserve the viewport below the header so the footer always starts below
       the fold. Without this, the app shell (header + footer) paints instantly
       while the lazy-loaded route chunk is still in flight, parking the footer
       right under the header — then the route content pushes it down a whole
       page, which was the real CLS ~0.9 culprit (not the font swap). */
    min-height: 100vh;
    min-height: 100dvh;
}

/* ── Page Transition ──────────────────────────────────────────────────── */
.page-fade-enter-active,
.page-fade-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.page-fade-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

.page-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
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

/* ── Noise Grain ──────────────────────────────────────────────────────── */
.bg-noise {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 256px 256px;
    opacity: 0.025;
    mix-blend-mode: overlay;
    z-index: 10;
    animation: noise-drift 8s linear infinite;
}

@keyframes noise-drift {
    0% {
        transform: translate(0, 0);
    }
    100% {
        transform: translate(64px, 64px);
    }
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

/* ── Aurora Glows ─────────────────────────────────────────────────────── */
.bg-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(1px);
    will-change: transform;
}

/* Primary warm amber — top-left */
.bg-glow-1 {
    top: -25vw;
    left: -15vw;
    width: 70vw;
    height: 70vw;
    background: radial-gradient(
        circle,
        rgba(232, 168, 64, 0.1) 0%,
        rgba(232, 168, 64, 0.04) 30%,
        rgba(196, 133, 32, 0.01) 50%,
        transparent 70%
    );
    filter: blur(80px);
    animation: aurora-1 26s ease-in-out infinite alternate;
}

/* Cool teal accent — bottom-right */
.bg-glow-2 {
    bottom: -28vw;
    right: -18vw;
    width: 75vw;
    height: 75vw;
    background: radial-gradient(
        circle,
        rgba(80, 200, 220, 0.06) 0%,
        rgba(60, 160, 200, 0.03) 30%,
        rgba(40, 120, 180, 0.01) 50%,
        transparent 70%
    );
    filter: blur(100px);
    animation: aurora-2 30s ease-in-out infinite alternate-reverse;
}

/* Deep warm center pulse */
.bg-glow-3 {
    top: 30%;
    left: 45%;
    transform: translate(-50%, -50%);
    width: 50vw;
    height: 50vw;
    background: radial-gradient(
        circle,
        rgba(232, 168, 64, 0.05) 0%,
        rgba(200, 140, 50, 0.02) 35%,
        transparent 65%
    );
    filter: blur(90px);
    animation: aurora-3 22s ease-in-out infinite alternate;
}

/* Subtle magenta far top-right */
.bg-glow-4 {
    top: -10vw;
    right: -5vw;
    width: 40vw;
    height: 40vw;
    background: radial-gradient(
        circle,
        rgba(180, 100, 160, 0.03) 0%,
        rgba(140, 70, 130, 0.015) 30%,
        transparent 60%
    );
    filter: blur(80px);
    animation: aurora-4 35s ease-in-out infinite alternate;
}

/* ── Horizon Line ─────────────────────────────────────────────────────── */
.bg-horizon {
    position: absolute;
    top: 35%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(232, 168, 64, 0.04) 15%,
        rgba(232, 168, 64, 0.08) 50%,
        rgba(232, 168, 64, 0.04) 85%,
        transparent 100%
    );
    z-index: 3;
    opacity: 0.6;
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

/* ── Aurora Keyframes ─────────────────────────────────────────────────── */
@keyframes aurora-1 {
    0% {
        transform: translate(0, 0) scale(1) rotate(0deg);
        opacity: 0.8;
    }
    33% {
        transform: translate(3vw, 5vw) scale(1.08) rotate(2deg);
        opacity: 1;
    }
    66% {
        transform: translate(-2vw, 3vw) scale(0.95) rotate(-1deg);
        opacity: 0.85;
    }
    100% {
        transform: translate(1vw, -2vw) scale(1.03) rotate(1deg);
        opacity: 0.9;
    }
}

@keyframes aurora-2 {
    0% {
        transform: translate(0, 0) scale(1);
        opacity: 0.7;
    }
    50% {
        transform: translate(-4vw, -3vw) scale(1.12);
        opacity: 1;
    }
    100% {
        transform: translate(2vw, -5vw) scale(0.92);
        opacity: 0.75;
    }
}

@keyframes aurora-3 {
    0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.6;
    }
    40% {
        transform: translate(-48%, -52%) scale(1.15);
        opacity: 0.9;
    }
    100% {
        transform: translate(-52%, -48%) scale(0.9);
        opacity: 0.5;
    }
}

@keyframes aurora-4 {
    0% {
        transform: translate(0, 0) scale(1);
        opacity: 0.5;
    }
    50% {
        transform: translate(-3vw, 4vw) scale(1.1);
        opacity: 0.8;
    }
    100% {
        transform: translate(2vw, -2vw) scale(0.95);
        opacity: 0.4;
    }
}

/* ── Reduced Motion ───────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
    .bg-noise,
    .bg-glow {
        animation: none !important;
    }
}
</style>
