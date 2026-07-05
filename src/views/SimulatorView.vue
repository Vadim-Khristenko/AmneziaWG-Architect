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
} from "lucide-vue-next";
import { simulateHandshake, kindColor, kindLabel } from "@/utils/packetSim";
import type { SimPacket, SimResult } from "@/utils/packetSim";
import type { AWGConfig } from "@/utils/generator/types";

const router = useRouter();

const cfg = ref<AWGConfig | null>(null);
const sim = ref<SimResult | null>(null);

onMounted(() => {
  try {
    const raw = sessionStorage.getItem("awg_pending_cfg");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.cfg) {
        const c = parsed.cfg;
        cfg.value = {
          version: parsed.ver || "2.0",
          profile: "quic_initial",
          h1: c.h1 || "100000000-100000100",
          h2: c.h2 || "1200000000-1200000100",
          h3: c.h3 || "2400000000-2400000100",
          h4: c.h4 || "3600000000-3600000100",
          h1s: 100_000_000,
          h2s: 1_200_000_000,
          h3s: 2_400_000_000,
          h4s: 3_600_000_000,
          s1: c.s1 ?? 10,
          s2: c.s2 ?? 10,
          s3: c.s3 ?? 10,
          s4: c.s4 ?? 10,
          jc: c.jc ?? 5,
          jmin: c.jmin ?? 100,
          jmax: c.jmax ?? 200,
          i1: c.i1 || "",
          i2: c.i2 || "",
          i3: c.i3 || "",
          i4: c.i4 || "",
          i5: c.i5 || "",
        };
      }
    }
  } catch {
    cfg.value = null;
  }
  runSim();
});

function runSim() {
  if (!cfg.value) return;
  sim.value = simulateHandshake(cfg.value);
}

const stats = computed(() => {
  if (!sim.value) return null;
  return {
    total: sim.value.totalBytes,
    handshake: sim.value.handshakeBytes,
    overhead: sim.value.overheadBytes,
    count: sim.value.packets.length,
  };
});

function goBack() {
  router.push("/");
}
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
          <h1>Packet Simulator</h1>
        </div>
      </header>

      <div v-if="!cfg" class="alert alert-info">
        Нет данных для симуляции. Сначала
        <router-link to="/" class="link">сгенерируйте конфиг</router-link>.
      </div>

      <template v-else>
        <div class="sim-toolbar">
          <button class="btn btn-primary" @click="runSim">
            <RefreshCw :size="15" /> Перезапустить
          </button>
        </div>

        <div v-if="stats" class="sim-stats">
          <div class="stat-card">
            <span class="stat-value">{{ stats.count }}</span>
            <span class="stat-label">пакетов</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">байт всего</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.handshake }}</span>
            <span class="stat-label">рукопожатие</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.overhead }}</span>
            <span class="stat-label">оверхед</span>
          </div>
        </div>

        <!-- Sequence diagram -->
        <div class="sim-diagram panel">
          <div class="panel-head">
            <Play :size="14" class="text-accent" />
            <span class="panel-title">Sequence Diagram</span>
          </div>
          <div class="diagram-body">
            <div class="lane">
              <div class="lane-title">
                <Monitor :size="14" /> Client
              </div>
              <div class="lane-line"></div>
            </div>
            <div class="lane">
              <div class="lane-title">
                <Server :size="14" /> Server
              </div>
              <div class="lane-line"></div>
            </div>
          </div>

          <div class="diagram-packets">
            <div
              v-for="p in sim?.packets"
              :key="p.id"
              class="diagram-packet"
              :style="{ borderColor: kindColor(p.kind) }"
            >
              <span class="dp-kind" :style="{ color: kindColor(p.kind) }">
                {{ kindLabel(p.kind) }}
              </span>
              <span class="dp-size">{{ p.size }} B</span>
              <ArrowRight :size="12" class="dp-arrow" />
            </div>
          </div>
        </div>

        <!-- Packet list -->
        <div class="sim-table panel">
          <div class="panel-head">
            <Activity :size="14" class="text-accent" />
            <span class="panel-title">Пакеты</span>
          </div>
          <div class="table-wrap">
            <table class="sim-table-inner">
              <thead>
                <tr>
                  <th>#)</th>
                  <th>Тип</th>
                  <th>Размер</th>
                  <th>Заголовок</th>
                  <th>Описание</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in sim?.packets" :key="p.id">
                  <td>{{ p.id }}</td>
                  <td>
                    <span
                      class="kind-badge"
                      :style="{ background: kindColor(p.kind) + '22', color: kindColor(p.kind) }"
                    >
                      {{ kindLabel(p.kind) }}
                    </span>
                  </td>
                  <td>{{ p.size }}</td>
                  <td>{{ p.header }}</td>
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
  gap: 10px;
}
.sim-title h1 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}
.sim-toolbar {
  margin-bottom: 16px;
}
.sim-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
}
.stat-label {
  font-size: 0.75rem;
  color: var(--muted);
}
.sim-diagram {
  margin-bottom: 24px;
}
.diagram-body {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}
.lane {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.lane-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
}
.lane-line {
  width: 2px;
  height: 100%;
  min-height: 120px;
  background: var(--border);
}
.diagram-packets {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 20px 20px;
}
.diagram-packet {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-left: 4px solid;
  background: var(--panel-2);
  border-radius: var(--radius-sm);
}
.dp-kind {
  font-weight: 600;
  font-size: 0.78rem;
  min-width: 70px;
}
.dp-size {
  font-size: 0.78rem;
  color: var(--muted);
}
.dp-arrow {
  margin-left: auto;
  color: var(--muted);
}
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
  .sim-title h1 {
    font-size: 1.1rem;
  }
}
</style>
