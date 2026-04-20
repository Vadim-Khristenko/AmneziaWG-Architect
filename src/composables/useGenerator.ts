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
  type AWGConfig,
  type AWGVersion,
  type Intensity,
  type MimicProfile,
  type BrowserProfile,
  PROFILE_LABELS,
} from "../utils/generator";

// ─────────────────────────────────────────────────────────────────────────────
// Типы
// ─────────────────────────────────────────────────────────────────────────────

export type LogType = "info" | "ok" | "bad" | "warn";

export interface LogEntry {
  msg: string;
  type: LogType;
  ts: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────

export function useGenerator() {
  // ── Версия и интенсивность ────────────────────────────────────────────────

  const version = ref<AWGVersion>("2.0");
  const intensity = ref<Intensity>("medium");

  // ── Настройки генератора ──────────────────────────────────────────────────

  const config = reactive({
    profile: "quic_initial" as MimicProfile,
    customHost: "",
    mimicAll: false,

    // Теги CPS
    useTagC: false, // <c> — счётчик пакетов. Отключён по умолчанию: старые версии AWG-go
    // не реализуют этот тег и возвращают ErrorCode 1000.
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

    // Экстремальные максимумы (Jc до 128, S3/S4 расширенные, H разброс 10M)
    useExtremeMax: false,
  });

  // ── Состояние UI ──────────────────────────────────────────────────────────

  /**
   * Результат последней генерации.
   * Инициализируем сразу, чтобы не было layout shift на первом рендере HomeView.
   */
  const currentAwg = ref<AWGConfig | null>(
    genCfg({
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
      iterCount: 0,
      routerMode: config.routerMode,
      useExtremeMax: config.useExtremeMax,
    }),
  );

  /** Счётчик неудачных попыток (используется для автоусиления параметров) */
  const iterCount = ref(0);

  /** Журнал последних 4 действий */
  const log = ref<LogEntry[]>([]);

  /** Флаг анимации кнопки генерации */
  const isGenerating = ref(false);

  // ── Генерация ─────────────────────────────────────────────────────────────

  /**
   * generate() — собирает GeneratorInput из текущего состояния и вызывает genCfg.
   * Автоматически добавляет запись в лог.
   */
  function generate() {
    isGenerating.value = true;

    // Небольшой тайм-аут для shimmer-анимации
    setTimeout(() => {
      isGenerating.value = false;
    }, 650);

    currentAwg.value = genCfg({
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
    });

    const label = PROFILE_LABELS[config.profile] ?? config.profile;
    addLog(`✦ Сгенерирован — ${label}`, "info");
    if (config.routerMode) {
      addLog("⚡ Роутер-режим: минимальные шумы", "warn");
    }
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
    const v = version.value;

    const lines: string[] = [
      `# AmneziaWG ${v}`,
      "[Interface]",
      "# PrivateKey = <ключ>",
      "# Address = 10.0.0.2/32",
    ];

    if (v === "2.0") {
      lines.push(
        `H1 = ${p.h1}`,
        `H2 = ${p.h2}`,
        `H3 = ${p.h3}`,
        `H4 = ${p.h4}`,
        `S1 = ${p.s1}`,
        `S2 = ${p.s2}`,
        `S3 = ${p.s3}`,
        `S4 = ${p.s4}`,
        `Jc = ${p.jc}`,
        `Jmin = ${p.jmin}`,
        `Jmax = ${p.jmax}`,
        `I1 = ${p.i1}`,
        `I2 = ${p.i2}`,
        `I3 = ${p.i3}`,
        `I4 = ${p.i4}`,
        `I5 = ${p.i5}`,
      );
    } else if (v === "1.5") {
      lines.push(
        `H1 = ${p.h1s}`,
        `H2 = ${p.h2s}`,
        `H3 = ${p.h3s}`,
        `H4 = ${p.h4s}`,
        `S1 = ${p.s1}`,
        `S2 = ${p.s2}`,
        `Jc = ${p.jc}`,
        `Jmin = ${p.jmin}`,
        `Jmax = ${p.jmax}`,
        "# I1-I5 только клиент (AWG 1.5):",
        `I1 = ${p.i1}`,
        `I2 = ${p.i2}`,
        `I3 = ${p.i3}`,
        `I4 = ${p.i4}`,
        `I5 = ${p.i5}`,
      );
    } else {
      // AWG 1.0 — нет CPS
      lines.push(
        `H1 = ${p.h1s}`,
        `H2 = ${p.h2s}`,
        `H3 = ${p.h3s}`,
        `H4 = ${p.h4s}`,
        `S1 = ${p.s1}`,
        `S2 = ${p.s2}`,
        `Jc = ${p.jc}`,
        `Jmin = ${p.jmin}`,
        `Jmax = ${p.jmax}`,
      );
    }

    return lines.join("\n");
  });

  /**
   * previewLines — структурированные строки для отрисовки синтаксически-окрашенного превью.
   * Каждый элемент: { key: string, value: string, type: 'header'|'kv'|'comment' }
   */
  const previewLines = computed(() => {
    const p = currentAwg.value;
    if (!p) return [];
    const v = version.value;

    type LineType = "comment" | "kv" | "section";
    const lines: { key: string; value: string; type: LineType }[] = [];

    const cm = (v: string) => ({
      key: "",
      value: v,
      type: "comment" as LineType,
    });
    const kv = (k: string, val: string) => ({
      key: k,
      value: val,
      type: "kv" as LineType,
    });

    lines.push(cm(`# AmneziaWG ${v}`));
    lines.push(cm("[Interface]"));
    lines.push(cm("# PrivateKey = <ключ>  Address = 10.0.0.2/32"));

    if (v === "2.0") {
      lines.push(
        kv("H1", p.h1),
        kv("H2", p.h2),
        kv("H3", p.h3),
        kv("H4", p.h4),
      );
      lines.push(
        kv("S1", String(p.s1)),
        kv("S2", String(p.s2)),
        kv("S3", String(p.s3)),
        kv("S4", String(p.s4)),
      );
      lines.push(
        kv("Jc", String(p.jc)),
        kv("Jmin", String(p.jmin)),
        kv("Jmax", String(p.jmax)),
      );
      lines.push(
        kv("I1", p.i1),
        kv("I2", p.i2),
        kv("I3", p.i3),
        kv("I4", p.i4),
        kv("I5", p.i5),
      );
    } else if (v === "1.5") {
      lines.push(
        kv("H1", String(p.h1s)),
        kv("H2", String(p.h2s)),
        kv("H3", String(p.h3s)),
        kv("H4", String(p.h4s)),
      );
      lines.push(kv("S1", String(p.s1)), kv("S2", String(p.s2)));
      lines.push(
        kv("Jc", String(p.jc)),
        kv("Jmin", String(p.jmin)),
        kv("Jmax", String(p.jmax)),
      );
      lines.push(cm("# I1-I5 только клиент (AWG 1.5):"));
      lines.push(
        kv("I1", p.i1),
        kv("I2", p.i2),
        kv("I3", p.i3),
        kv("I4", p.i4),
        kv("I5", p.i5),
      );
    } else {
      lines.push(
        kv("H1", String(p.h1s)),
        kv("H2", String(p.h2s)),
        kv("H3", String(p.h3s)),
        kv("H4", String(p.h4s)),
      );
      lines.push(kv("S1", String(p.s1)), kv("S2", String(p.s2)));
      lines.push(
        kv("Jc", String(p.jc)),
        kv("Jmin", String(p.jmin)),
        kv("Jmax", String(p.jmax)),
      );
      lines.push(cm("# I1-I5 не поддерживаются в AWG 1.0"));
    }

    return lines;
  });

  /**
   * copyConfig — копирует plainText в буфер обмена.
   * Возвращает Promise<boolean>: true = успех, false = ошибка.
   */
  async function copyConfig(): Promise<boolean> {
    const text = plainText.value;
    if (!text) {
      addLog("⚠ Сначала сгенерируйте конфиг", "bad");
      return false;
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback для старых браузеров / HTTP-контекста
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      addLog("✓ Конфиг скопирован в буфер", "ok");
      return true;
    } catch {
      addLog("⚠ Не удалось скопировать в буфер", "bad");
      return false;
    }
  }

  /**
   * downloadConfig — скачивает конфиг как .conf файл.
   */
  function downloadConfig() {
    const text = plainText.value;
    if (!text) {
      addLog("⚠ Сначала сгенерируйте конфиг", "bad");
      return;
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amneziawg-${version.value}-${Date.now()}.conf`;
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

  /** true для AWG 2.0 (S3/S4/H3/H4 диапазоны) */
  const isFullObfuscation = computed(() => version.value === "2.0");

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
    setVersion,
    setIntensity,
    feedback,
    copyConfig,
    downloadConfig,
    addLog,

    // Вычисляемые
    plainText,
    previewLines,
    showCustomHost,
    isCPSSupported,
    isFullObfuscation,
    isRouterMode,
    intensityLabel,
    iterDots,
    hintMap,
    placeholderMap,

    // Проверка доменов
    domainStatus,
    domainCheckedHost,
    checkSelectedDomain,
  };
}
