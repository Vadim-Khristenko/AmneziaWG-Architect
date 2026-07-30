<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
    ArrowLeft,
    Play,
    RefreshCw,
    Activity,
    Server,
    Monitor,
    ArrowRight,
    ArrowLeft as ArrowLeftIcon,
    Info,
    Clock,
    Database,
    Gauge,
    ShieldCheck,
    Lock,
} from "lucide-vue-next";
import {
    simulateHandshake,
    kindColor,
    kindLabel,
    kindDescription,
} from "@/engines/awg/packetSim";
import type { SimPacket, SimResult } from "@/engines/awg/packetSim";
import type { AWGConfig, AWGVersion } from "@/engines/awg/generator/types";
import { localizePath, useI18n } from "@/i18n";

const { locale, t } = useI18n();

const router = useRouter();

const cfg = ref<AWGConfig | null>(null);
const sim = ref<SimResult | null>(null);
const selectedPacket = ref<SimPacket | null>(null);

onMounted(() => {
    loadConfig();
    runSim();
});

function loadConfig() {
    try {
        const raw = sessionStorage.getItem("awg_pending_cfg");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed.cfg) return;
        const c = parsed.cfg;
        const version: AWGVersion = parsed.ver || "2.0";

        // 1.0 has no CPS chains at all; 1.5 sends them client-side only. Both
        // predate S3/S4. Zeroing them here keeps the simulation honest about
        // what each version actually puts on the wire.
        const hasCps = version !== "1.0";
        const hasS34 = version === "2.0" || version === "3.0";

        cfg.value = {
            version,
            profile: parsed.profile || "quic_initial",
            h1: c.h1 || "100000000-100000100",
            h2: c.h2 || "1200000000-1200000100",
            h3: c.h3 || "2400000000-2400000100",
            h4: c.h4 || "3600000000-3600000100",
            h1s: c.h1s ?? 100_000_000,
            h2s: c.h2s ?? 1_200_000_000,
            h3s: c.h3s ?? 2_400_000_000,
            h4s: c.h4s ?? 3_600_000_000,
            s1: c.s1 ?? 10,
            s2: c.s2 ?? 10,
            s3: hasS34 ? (c.s3 ?? 10) : 0,
            s4: hasS34 ? (c.s4 ?? 10) : 0,
            jc: c.jc ?? 5,
            jmin: c.jmin ?? 100,
            jmax: c.jmax ?? 200,
            i1: hasCps ? c.i1 || "" : "",
            i2: hasCps ? c.i2 || "" : "",
            i3: hasCps ? c.i3 || "" : "",
            i4: hasCps ? c.i4 || "" : "",
            i5: hasCps ? c.i5 || "" : "",
            ...(version === "3.0" && c.awg3 ? { awg3: c.awg3 } : {}),
        };
    } catch {
        cfg.value = null;
    }
}

function runSim() {
    if (!cfg.value) return;
    sim.value = simulateHandshake(cfg.value);
    selectedPacket.value = null;
}

function goBack() {
    router.push(localizePath("/", locale.value));
}

function selectPacket(p: SimPacket) {
    selectedPacket.value = selectedPacket.value?.id === p.id ? null : p;
}

const profileName = computed(() => cfg.value?.profile ?? "unknown");

/** True when this config carries a header-protection key (3.0 only). */
const headerProtected = computed(
    () => cfg.value?.version === "3.0" && !!cfg.value.awg3?.headerProtectionKey,
);

/** Explains what the selected version omits, for 1.0 and 1.5. */
const versionNote = computed(() => {
    const v = cfg.value?.version;
    if (v === "1.0") return t("sim.version.note.10");
    if (v === "1.5") return t("sim.version.note.15");
    return "";
});

const stats = computed(() => {
    if (!sim.value) return null;
    return {
        total: sim.value.totalBytes,
        handshake: sim.value.handshakeBytes,
        data: sim.value.dataBytes,
        overhead: sim.value.overheadBytes,
        count: sim.value.packets.length,
        seconds: sim.value.estSeconds10mbps,
    };
});
</script>

<template>
    <div class="simulator-page fade-in">
        <div class="container">
            <header class="sim-header">
                <button class="btn btn-ghost btn-icon" @click="goBack">
                    <ArrowLeft :size="18" />
                </button>
                <div class="sim-title">
                    <Activity :size="20" class="text-accent" />
                    <div>
                        <h1>Packet Simulator</h1>
                        <span v-if="cfg" class="sim-subtitle">
                            {{ profileName }} · AWG {{ cfg.version }}
                        </span>
                    </div>
                </div>
            </header>

            <div v-if="!cfg" class="alert alert-info">
                {{ t("sim.noData") }}
                <router-link :to="localizePath('/', locale)" class="link">{{ t("sim.noData.link") }}</router-link>.
            </div>

            <template v-else>
                <!-- What this version actually puts on the wire -->
                <div v-if="versionNote" class="alert alert-info">
                    <Info :size="16" class="alert-icon" />
                    <div class="alert-content">{{ versionNote }}</div>
                </div>

                <div v-if="headerProtected" class="alert alert-success">
                    <ShieldCheck :size="16" class="alert-icon" />
                    <div class="alert-content">{{ t("sim.hp.note") }}</div>
                </div>

                <div class="sim-toolbar">
                    <button class="btn btn-primary" @click="runSim">
                        <RefreshCw :size="15" /> {{ t("sim.restart") }}
                    </button>
                </div>

                <div v-if="stats" class="sim-stats">
                    <div class="stat-card">
                        <span class="stat-value">{{ stats.count }}</span>
                        <span class="stat-label">{{ t("sim.stat.packets") }}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">{{ stats.total }}</span>
                        <span class="stat-label">{{ t("sim.stat.bytes") }}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">{{ stats.handshake }}</span>
                        <span class="stat-label">{{ t("sim.stat.handshake") }}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">{{ stats.overhead }}</span>
                        <span class="stat-label">{{ t("sim.stat.overhead") }}</span>
                    </div>
                    <div class="stat-card">
                        <Clock :size="16" class="stat-icon" />
                        <span class="stat-value">~{{ stats.seconds }}s</span>
                        <span class="stat-label">{{ t("sim.stat.at10mbit") }}</span>
                    </div>
                </div>

                <!-- Sequence diagram -->
                <div class="sim-diagram panel">
                    <div class="panel-head">
                        <Play :size="14" class="text-accent" />
                        <span class="panel-title">{{ t("sim.diagram.title") }}</span>
                    </div>

                    <div class="diagram-canvas">
                        <div class="lane">
                            <div class="lane-title">
                                <Monitor :size="14" /> {{ t("sim.client") }}
                            </div>
                            <div class="lane-line"></div>
                        </div>
                        <div class="timeline">
                            <div
                                v-for="(p, idx) in sim?.packets"
                                :key="p.id"
                                class="packet-row"
                                :class="{ right: p.from === 'client' }"
                                :style="{
                                    '--kind-color': kindColor(p.kind),
                                }"
                                @click="selectPacket(p)"
                            >
                                <span class="packet-step">{{ p.step }}</span>
                                <span class="packet-badge">
                                    {{ kindLabel(p.kind) }}
                                </span>
                                <component
                                    :is="
                                        p.from === 'client'
                                            ? ArrowRight
                                            : ArrowLeftIcon
                                    "
                                    :size="14"
                                    class="packet-arrow"
                                />
                                <span class="packet-size">{{ p.size }} B</span>
                            </div>
                        </div>
                        <div class="lane">
                            <div class="lane-title">
                                <Server :size="14" /> {{ t("sim.server") }}
                            </div>
                            <div class="lane-line"></div>
                        </div>
                    </div>
                </div>

                <!-- Legend -->
                <div class="sim-legend panel">
                    <div class="panel-head">
                        <Info :size="14" class="text-accent" />
                        <span class="panel-title">{{ t("sim.legend.title") }}</span>
                    </div>
                    <div class="legend-grid">
                        <div
                            v-for="kind in [
                                'cps',
                                'junk',
                                'init',
                                'response',
                                'cookie',
                                'data',
                            ]"
                            :key="kind"
                            class="legend-item"
                        >
                            <span
                                class="legend-dot"
                                :style="{
                                    background: kindColor(kind as any),
                                }"
                            ></span>
                            <div class="legend-text">
                                <strong>{{ kindLabel(kind as any) }}</strong>
                                <span>{{ kindDescription(kind as any) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Selected packet detail -->
                <div v-if="selectedPacket" class="packet-detail panel">
                    <div class="panel-head">
                        <Database :size="14" class="text-accent" />
                        <span class="panel-title">
                            {{ t("sim.packet") }} {{ selectedPacket.step }} —
                            {{ kindLabel(selectedPacket.kind) }}
                        </span>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">{{ t("sim.detail.direction") }}</span>
                            <span class="detail-value">
                                {{ selectedPacket.from === 'client' ? t('sim.client') : t('sim.server') }}
                                →
                                {{ selectedPacket.to === 'client' ? t('sim.client') : t('sim.server') }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">{{ t("sim.detail.size") }}</span>
                            <span class="detail-value"
                                >{{ selectedPacket.size }} {{ t("sim.bytes") }}</span
                            >
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">{{ t("sim.detail.header") }}</span>
                            <span class="detail-value"
                                >{{ selectedPacket.header || '—' }}</span
                            >
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">{{ t("sim.detail.payload") }}</span>
                            <span class="detail-value"
                                >{{ selectedPacket.payload }} {{ t("sim.bytes") }}</span
                            >
                        </div>
                    </div>
                    <p class="detail-desc">{{ selectedPacket.description }}</p>
                    <p
                        v-if="selectedPacket.headerProtected"
                        class="detail-crypto"
                    >
                        <Lock :size="13" />
                        {{
                            selectedPacket.encryptedWhole
                                ? t("sim.hp.whole")
                                : t("sim.hp.badge")
                        }}
                    </p>
                </div>

                <!-- Packet list -->
                <div class="sim-table panel">
                    <div class="panel-head">
                        <Gauge :size="14" class="text-accent" />
                        <span class="panel-title">{{ t("sim.table.title") }}</span>
                    </div>
                    <div class="table-wrap">
                        <table class="sim-table-inner">
                            <thead>
                                <tr>
                                    <th>#)</th>
                                    <th>{{ t("sim.table.type") }}</th>
                                    <th>{{ t("sim.table.direction") }}</th>
                                    <th>{{ t("sim.table.size") }}</th>
                                    <th>{{ t("sim.table.header") }}</th>
                                    <th class="desc">{{ t("sim.table.desc") }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="p in sim?.packets"
                                    :key="p.id"
                                    :class="{ active: selectedPacket?.id === p.id }"
                                    @click="selectPacket(p)"
                                >
                                    <td>{{ p.step }}</td>
                                    <td>
                                        <span
                                            class="kind-badge"
                                            :style="{
                                                background:
                                                    kindColor(p.kind) + '22',
                                                color: kindColor(p.kind),
                                            }"
                                        >
                                            {{ kindLabel(p.kind) }}
                                        </span>
                                    </td>
                                    <td>
                                        {{ p.from === 'client' ? 'C' : 'S' }} →
                                        {{ p.to === 'client' ? 'C' : 'S' }}
                                    </td>
                                    <td>{{ p.size }}</td>
                                    <td>{{ p.header || '—' }}</td>
                                    <td class="desc">{{ p.description }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.simulator-page {
    padding: 24px 0 48px;
}
.sim-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}
.sim-title {
    display: flex;
    align-items: center;
    gap: 12px;
}
.sim-title h1 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0;
}
.sim-subtitle {
    display: block;
    font-size: 0.78rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.sim-toolbar {
    margin-bottom: 16px;
}
.sim-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
}
.stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    text-align: center;
}
.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
}
.stat-label {
    font-size: 0.72rem;
    color: var(--muted);
}
.stat-icon {
    color: var(--muted);
    margin-bottom: 2px;
}

/* Diagram */
.sim-diagram {
    margin-bottom: 24px;
}
.diagram-canvas {
    display: grid;
    grid-template-columns: 110px 1fr 110px;
    gap: 12px;
    padding: 20px;
}
.lane {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
.lane-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    text-align: center;
}
.lane-line {
    width: 2px;
    height: 100%;
    min-height: 200px;
    background: var(--border);
}
.timeline {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.packet-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-left: 4px solid var(--kind-color);
    cursor: pointer;
    transition: var(--trans-fast);
}
.packet-row:hover,
.packet-row.active {
    background: var(--bg2);
}
.packet-row.right {
    justify-content: flex-start;
}
.packet-row:not(.right) {
    justify-content: flex-end;
}
.packet-step {
    font-size: 0.7rem;
    color: var(--muted);
    min-width: 26px;
}
.packet-badge {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--kind-color);
}
.packet-arrow {
    color: var(--muted);
}
.packet-size {
    font-size: 0.72rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
}

/* Legend */
.sim-legend {
    margin-bottom: 24px;
}
.legend-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
    padding: 16px;
}
.legend-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}
.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: 3px;
    flex-shrink: 0;
}
.legend-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.78rem;
    color: var(--muted);
}
.legend-text strong {
    color: var(--text);
}

/* Detail */
.packet-detail {
    margin-bottom: 24px;
}
.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    padding: 16px 16px 0;
}
.detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.detail-label {
    font-size: 0.7rem;
    color: var(--muted);
}
.detail-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
}
.detail-desc {
    margin: 12px 16px 16px;
    font-size: 0.82rem;
    color: var(--muted);
    line-height: 1.5;
}

.detail-crypto {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: -8px 16px 16px;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    background: var(--green-bg);
    color: var(--green);
    font-family: var(--fw);
    font-weight: 700;
    font-size: 0.74rem;
}

/* Table */
.table-wrap {
    overflow-x: auto;
}
.sim-table-inner {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
}
.sim-table-inner th,
.sim-table-inner td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    text-align: left;
}
.sim-table-inner th {
    color: var(--muted);
    font-weight: 600;
}
.sim-table-inner tbody tr {
    cursor: pointer;
    transition: var(--trans-fast);
}
.sim-table-inner tbody tr:hover,
.sim-table-inner tbody tr.active {
    background: var(--panel-2);
}
.kind-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
}
.desc {
    color: var(--muted);
}
.link {
    color: var(--accent);
    text-decoration: underline;
}

@media (max-width: 640px) {
    .diagram-canvas {
        grid-template-columns: 60px 1fr 60px;
        gap: 6px;
        padding: 12px;
    }
    .lane-title {
        font-size: 0.65rem;
    }
    .packet-row {
        padding: 6px 8px;
        gap: 6px;
    }
    .packet-step {
        min-width: 22px;
    }
    .packet-size {
        display: none;
    }
    .legend-grid {
        grid-template-columns: 1fr;
    }
}
</style>
