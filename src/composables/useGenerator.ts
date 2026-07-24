/**
 * AmneziaWG Architect — useGenerator composable
 *
 * Содержит:
 *   - Реактивное состояние (version, intensity, config, currentAwg, iterCount, log)
 *   - generate() — главная точка входа (вызывает genCfg из generator.ts)
 *   - renderCfg / previewCode — вычисляемые представления конфига
 *   - copyConfig / downloadConfig — экспорт
 *   - feedback(ok) — подтверждение/отклонение конфига с автоусилением
 *   - setVersion / setIntensity — переключение режимов
 *   - addLog — журнал последних действий
 *   - hintMap / placeholderMap — подсказки по профилям
 */

import { ref, reactive, computed } from "vue";
import {
  genCfg,
  generateBatch,
  CLIENTS,
  DEFAULT_CLIENT_ID,
  type AWGConfig,
  type AWGVersion,
  type Intensity,
  type MimicProfile,
  type BrowserProfile,
  PROFILE_LABELS,
  renderConf,
  renderConfLines,
} from "../utils/generator";
import { confToVpn, buildVpnConfig } from "../utils/awgFormat";
import type { VpnConfig } from "../utils/awgFormat";
import type { AwgContainer } from "../utils/mergekeys";
import type { GeneratorInput } from "../utils/generator";

// ─────────────────────────────────────────────────────────────────────────────
// Типы
// ─────────────────────────────────────────────────────────────────────────────

export type LogType = "info" | "ok" | "bad" | "warn";

export interface LogEntry {
  msg: string;
  type: LogType;
  ts: number;
}

import { useGeneratorWorker } from "./useGeneratorWorker";

// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────

export function useGenerator() {
  // Worker instance for large batches
  const { isRunning: isWorkerRunning, generateInWorker } = useGeneratorWorker();

  // ── Версия и интенсивность ────────────────────────────────────────────────

  const version = ref<AWGVersion>("2.0");
  const intensity = ref<Intensity>("medium");

  // ── Настройки генератора ──────────────────────────────────────────────────

  const config = reactive({
    profile: "quic_initial" as MimicProfile,
    customHost: "",
    mimicAll: false,

    // Теги CPS
    useTagC: false, // <c> — счётчик пакетов.
    // ⚠️ Не работает в старых версиях AWG-go (ErrorCode 1000).
    // Разработчики Amnezia позднее отказались от него; он может
    // перестать работать в новых релизах клиентов.
    useTagT: true,
    useTagR: true,
    useTagRC: true,
    useTagRD: true,

    // Browser Fingerprint
    useBrowserFp: false,
    browserProfile: "chrome" as BrowserProfile,

    // MTU (допустимый диапазон 576–9000; по умолчанию стандартный Ethernet)
    mtu: 1500,

    // Junk-train (0 = отключён, рекомендовано 3–7)
    junkLevel: 5,

    // Режим роутера (минимальные шумы для слабых устройств)
    routerMode: false,

    // Экстремальные максимумы (Jc до 128, S3 расширенный, H разброс 10M)
    useExtremeMax: false,

    // Целевой клиент для фильтрации совместимости
    clientId: DEFAULT_CLIENT_ID,

    // ── AWG 3.0 ─────────────────────────────────────────────────────────────
    // Защита заголовков ChaCha20. Поднимает S1–S4 до 12 байт: из паддинга
    // берётся nonce шифра.
    useHeaderProtection: true,
    // Случайный паддинг транспортных пакетов (вместо выравнивания по 16).
    useContentPadding: true,
    // Рандомизация таймеров протокола вместо фиксированных констант.
    useRandomTimings: true,
  });

  // ── Состояние UI ──────────────────────────────────────────────────────────

  /** Результат последней генерации */
  const currentAwg = ref<AWGConfig | null>(null);

  /** Счётчик неудачных попыток (используется для автоусиления параметров) */
  const iterCount = ref(0);

  /** Журнал последних 4 действий */
  const log = ref<LogEntry[]>([]);

  /** Флаг анимации кнопки генерации */
  const isGenerating = ref(false);

  /** Batch generation state */
  const batchCount = ref(10);
  const batchResults = ref<AWGConfig[]>([]);

  // ── Генерация ─────────────────────────────────────────────────────────────

  function buildInput(): GeneratorInput {
    return {
      version: version.value,
      intensity: intensity.value,
      profile: config.profile,
      customHost: config.customHost,
      mimicAll: config.mimicAll,
      useTagC: config.useTagC,
      useTagT: config.useTagT,
      useTagR: config.useTagR,
      useTagRC: config.useTagRC,
      useTagRD: config.useTagRD,
      useBrowserFp: config.useBrowserFp,
      browserProfile: config.browserProfile,
      mtu: config.mtu,
      junkLevel: config.junkLevel,
      iterCount: iterCount.value,
      routerMode: config.routerMode,
      useExtremeMax: config.useExtremeMax,
      clientId: config.clientId,
      useHeaderProtection: config.useHeaderProtection,
      useContentPadding: config.useContentPadding,
      useRandomTimings: config.useRandomTimings,
    };
  }

  /**
   * generate() — главная точка входа.
   */
  function generate() {
    isGenerating.value = true;

    setTimeout(() => {
      isGenerating.value = false;
    }, 650);

    currentAwg.value = genCfg(buildInput());

    const label = PROFILE_LABELS[config.profile] ?? config.profile;
    addLog(`✦ Сгенерирован — ${label}`, "info");
    if (config.routerMode) {
      addLog("⚡ Роутер-режим: минимальные шумы", "warn");
    }
  }

  /**
   * runBatch — generate `batchCount` independent configs.
   * Uses a Web Worker when count > 50 to keep the UI responsive.
   */
  async function runBatch() {
    const count = batchCount.value;
    if (count < 1 || count > 1000) {
      addLog("⚠ Количество должно быть от 1 до 1000", "bad");
      return;
    }

    try {
      batchResults.value =
        count > 50
          ? await generateInWorker(buildInput(), count)
          : generateBatch(buildInput(), count);
      addLog(`✦ Сгенерировано ${count} конфигов`, "ok");
    } catch (e) {
      addLog(
        `⚠ Batch ошибка: ${e instanceof Error ? e.message : String(e)}`,
        "bad",
      );
    }
  }

  /**
   * downloadBatch — download all batch configs as a single .txt file.
   */
  function downloadBatch() {
    if (!batchResults.value.length) {
      addLog("⚠ Сначала сгенерируйте batch", "bad");
      return;
    }

    const blocks = batchResults.value.map((p, idx) =>
      renderConf(p, {
        caption: `config ${idx + 1}/${batchResults.value.length}`,
      }),
    );

    downloadBlob(
      blocks.join("\n\n" + "=".repeat(40) + "\n\n"),
      `amneziawg-batch-${batchResults.value.length}-${Date.now()}.txt`,
      "text/plain",
    );
  }

  // ── Переключение версии / интенсивности ───────────────────────────────────

  function setVersion(v: AWGVersion) {
    version.value = v;
    generate();
  }

  function setIntensity(level: Intensity) {
    intensity.value = level;
    generate();
  }

  // ── Фидбэк ────────────────────────────────────────────────────────────────

  /**
   * feedback(ok) — подтверждение или отклонение конфига.
   *
   * ok=true:  сбрасывает итерации, пишет успех в лог.
   * ok=false: наращивает iterCount (усиливает параметры при следующей генерации),
   *           автоматически перегенерирует конфиг.
   */
  function feedback(ok: boolean) {
    if (ok) {
      addLog("✓ Конфигурация подтверждена!", "ok");
      iterCount.value = 0;
    } else {
      iterCount.value++;
      generate();
      addLog(
        iterCount.value > 3
          ? `✗ Попытка ${iterCount.value}: HIGH режим, максимальная обфускация...`
          : `✗ Попытка ${iterCount.value}: перегенерация, усиленные параметры`,
        "bad",
      );
    }
  }

  // ── Экспорт ───────────────────────────────────────────────────────────────

  /**
   * plainText — финальный текст конфигурационного файла .conf
   * Вычисляется по currentAwg и version.
   */
  const plainText = computed((): string => {
    const p = currentAwg.value;
    if (!p) return "";
    return renderConf(p);
  });

  /**
   * previewLines — структурированные строки для отрисовки синтаксически-окрашенного превью.
   * Каждый элемент: { key: string, value: string, type: 'header'|'kv'|'comment' }
   */
  const previewLines = computed(() => {
    const p = currentAwg.value;
    if (!p) return [];
    return renderConfLines(p, { preview: true });
  });

  /**
   * jsonPayload — формальный Amnezia VpnConfig JSON (как в vpn://).
   */
  const jsonPayload = computed((): VpnConfig | null => {
    const text = plainText.value;
    if (!text) return null;
    try {
      return buildVpnConfig(text);
    } catch {
      return null;
    }
  });

  const jsonText = computed(() =>
    jsonPayload.value ? JSON.stringify(jsonPayload.value, null, 4) : "",
  );

  /**
   * copyConfig — копирует plainText в буфер обмена.
   * Возвращает Promise<boolean>: true = успех, false = ошибка.
   */
  async function copyConfig(): Promise<boolean> {
    return copyToClipboard(plainText.value, "Конфиг скопирован в буфер");
  }

  /**
   * downloadConfig — скачивает конфиг как .conf файл.
   */
  function downloadConfig() {
    downloadBlob(
      plainText.value,
      `amneziawg-${version.value}-${Date.now()}.conf`,
      "text/plain",
    );
  }

  /**
   * copyJson — копирует JSON-представление конфигурации.
   */
  async function copyJson(): Promise<boolean> {
    return copyToClipboard(jsonText.value, "JSON скопирован в буфер");
  }

  /**
   * downloadJson — скачивает JSON-представление конфигурации.
   */
  function downloadJson() {
    downloadBlob(
      jsonText.value,
      `amneziawg-${version.value}-${Date.now()}.json`,
      "application/json",
    );
  }

  async function copyToClipboard(text: string, okMsg: string): Promise<boolean> {
    if (!text) {
      addLog("⚠ Сначала сгенерируйте конфиг", "bad");
      return false;
    }
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      addLog(`✓ ${okMsg}`, "ok");
      return true;
    } catch {
      addLog("⚠ Не удалось скопировать в буфер", "bad");
      return false;
    }
  }

  function downloadBlob(text: string, filename: string, mime: string) {
    if (!text) {
      addLog("⚠ Сначала сгенерируйте конфиг", "bad");
      return;
    }
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addLog("↓ Конфиг сохранён в файл", "info");
  }

  // ── Лог ───────────────────────────────────────────────────────────────────

  /**
   * addLog(msg, type) — добавляет запись в начало журнала.
   * Журнал ограничен 4 записями (старые удаляются).
   */
  function addLog(msg: string, type: LogType = "info") {
    log.value.unshift({ msg, type, ts: Date.now() });
    if (log.value.length > 4) log.value.pop();
  }

  // ── Проверка доступности доменов ──────────────────────────────────────────

  const domainStatus = ref<"idle" | "checking" | "ok" | "blocked" | "unknown">("idle");
  const domainCheckedHost = ref("");

  async function checkSelectedDomain() {
    const { isKnownBlocked, checkDomain } = await import("../utils/domainCheck");
    const host = config.customHost.trim();
    if (!host) {
      addLog("Укажите хост для проверки", "warn");
      return;
    }
    domainStatus.value = "checking";
    domainCheckedHost.value = host;

    if (isKnownBlocked(host)) {
      domainStatus.value = "blocked";
      addLog(`⛔ ${host} — в списке заблокированных`, "bad");
      return;
    }

    const result = await checkDomain(host);
    domainStatus.value = result.accessible ? "ok" : "blocked";
    addLog(
      result.accessible
        ? `✓ ${host} — доступен`
        : `✗ ${host} — недоступен (${result.error ?? "blocked"})`,
      result.accessible ? "ok" : "bad",
    );
  }

  // ── Подсказки по профилям ─────────────────────────────────────────────────

  /** Подсказки под полем кастомного хоста */
  const hintMap: Record<MimicProfile, string> = {
    quic_initial: "QUIC-capable: fastly.net, cdn-apple.com, yastatic.net …",
    quic_0rtt: "QUIC 0-RTT: fastly.net, s3.amazonaws.com, yastatic.net …",
    tls_client_hello: "Любой HTTPS-хост: vk.com, github.com, ozon.ru …",
    dtls: "STUN/TURN-сервер: stun.yandex.net, stun.jit.si …",
    http3: "HTTP/3-хост: fastly.net, cdn.gcore.com, yandex.net …",
    sip: "SIP-регистратор: sip.zadarma.com, sip.linphone.org …",
    wireguard_noise: "WireGuard Noise_IK — хост не используется",
    tls_to_quic: "TLS+QUIC: vk.com, yandex.ru, ozon.ru …",
    quic_burst: "QUIC-burst: fastly.net, cdn-apple.com, yastatic.net …",
    dns_query: "DNS-сервер: 8.8.8.8, 1.1.1.1, 77.88.8.8 (или оставьте пустым для пула)",
    random:
      "Пул выбирается по случайному профилю (опционально укажите свой хост)",
  };

  /** Placeholder для поля кастомного хоста */
  const placeholderMap: Record<MimicProfile, string> = {
    quic_initial: "Хост с QUIC (напр., fastly.net)",
    quic_0rtt: "Хост с QUIC 0-RTT (напр., cdn-apple.com)",
    tls_client_hello: "Любой домен (напр., github.com)",
    dtls: "STUN/TURN-хост (напр., stun.jit.si)",
    http3: "HTTP/3-домен (напр., vk.com)",
    sip: "SIP-сервер (напр., sip.zadarma.com)",
    wireguard_noise: "Хост не используется для этого профиля",
    tls_to_quic: "TLS→QUIC хост (напр., vk.com)",
    quic_burst: "QUIC-хост (напр., fastly.net)",
    dns_query: "DNS-сервер (напр., 8.8.8.8) или домен",
    random: "Свой домен (опционально)",
  };

  // ── Вычисляемые свойства UI ───────────────────────────────────────────────

  /** true если для текущего профиля поле хоста актуально */
  const showCustomHost = computed(() => config.profile !== "wireguard_noise");

  /** true если включён режим роутера */
  const isRouterMode = computed(() => config.routerMode);

  /** true для AWG 1.0 (CPS не поддерживается) */
  const isCPSSupported = computed(() => version.value !== "1.0");

  /** true для AWG 2.0+ (S3/S4 и H1–H4 диапазонами) */
  const isFullObfuscation = computed(
    () => version.value === "2.0" || version.value === "3.0",
  );

  /** true только для AWG 3.0 (защита заголовков, паддинг, тайминги) */
  const isAwg3 = computed(() => version.value === "3.0");

  /** Метка режима интенсивности (для отображения в UI) */
  const intensityLabel = computed(() => intensity.value.toUpperCase());

  /** Dots прогресса итераций (5 точек) */
  const iterDots = computed(() =>
    Array.from({ length: 5 }, (_, i) => ({
      filled: i < iterCount.value,
      critical: iterCount.value > 3,
    })),
  );

  return {
    // Состояние
    version,
    intensity,
    config,
    currentAwg,
    iterCount,
    log,
    isGenerating,

    // Действия
    generate,
    runBatch,
    downloadBatch,
    setVersion,
    setIntensity,
    feedback,
    copyConfig,
    downloadConfig,
    copyJson,
    downloadJson,
    addLog,

    // Вычисляемые
    plainText,
    previewLines,
    jsonPayload,
    jsonText,
    showCustomHost,
    isCPSSupported,
    isFullObfuscation,
    isAwg3,
    isRouterMode,
    intensityLabel,
    iterDots,
    hintMap,
    placeholderMap,

    // Batch
    batchCount,
    batchResults,

    // Worker
    isWorkerRunning,

    // Проверка доменов
    domainStatus,
    domainCheckedHost,
    checkSelectedDomain,
  };
}
