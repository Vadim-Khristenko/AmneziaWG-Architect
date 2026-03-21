<div align="center">

<img src=".github/assets/github-preview.png" width="800" alt="AmneziaWG Architect — Advanced DPI-bypass configuration generator" />

<br/><br/>

# AmneziaWG Architect

### Генератор продвинутой обфускации для обхода DPI

<br/>

[![Deploy to Pages](https://img.shields.io/github/actions/workflow/status/Vadim-Khristenko/AmneziaWG-Architect/deploy-pages.yml?branch=main&style=for-the-badge&logo=github&logoColor=white&label=Deploy&color=232a30)](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/actions)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-f5c060?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)
&nbsp;
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br/>

[![Stars](https://img.shields.io/github/stars/Vadim-Khristenko/AmneziaWG-Architect?style=flat-square&logo=github&color=f5c060&label=Stars)](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/stargazers)
&nbsp;
[![Issues](https://img.shields.io/github/issues/Vadim-Khristenko/AmneziaWG-Architect?style=flat-square&color=5cb87a&label=Issues)](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/issues)
&nbsp;
[![Contributors](https://img.shields.io/github/contributors/Vadim-Khristenko/AmneziaWG-Architect?style=flat-square&color=5b9bd5&label=Contributors)](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/graphs/contributors)
&nbsp;
[![Last Commit](https://img.shields.io/github/last-commit/Vadim-Khristenko/AmneziaWG-Architect?style=flat-square&color=c4a868&label=Last%20Commit)](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/commits/main)

<br/>

[**▶ Открыть генератор**](https://vadim-khristenko.github.io/AmneziaWG-Architect/)
&nbsp;·&nbsp;
[📋 Issues](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/issues)
&nbsp;·&nbsp;
[🤝 Contributing](CONTRIBUTING.md)
&nbsp;·&nbsp;
[💬 Флудильня Amnezia](https://t.me/amnezia_vpn/)

<br/>

> *Основано на идее [Special Junk Packet List](https://voidwaifu.github.io/Special-Junk-Packet-List/) от [@VoidWaifu](https://github.com/VoidWaifu) — спасибо за вклад!*

</div>

---

<br/>

## 🔭 О проекте

**AmneziaWG Architect** — это полностью клиентское веб-приложение для генерации параметров обфускации протокола [AmneziaWG](https://github.com/amnezia-vpn/amneziawg-linux-kernel-module). Если обычный VPN просто шифрует трафик, то Architect делает его **неотличимым** от обычного интернет-трафика (QUIC, TLS, SIP и др.), обходя системы глубокого анализа пакетов (DPI).

Приложение генерирует:

| Группа | Параметры | Назначение |
|:---|:---|:---|
| **Заголовки** | H1 – H4 | Динамические идентификаторы типов пакетов (диапазоны для AWG 2.0) |
| **Размеры** | S1 – S4 | Рандомизация длин пакетов для размытия статистического профиля |
| **Junk Train** | Jc, Jmin, Jmax | Серия шумовых UDP-пакетов перед хендшейком |
| **CPS-сигнатуры** | I1 – I5 | Кастомные пакеты, имитирующие реальные протоколы |

> **Ничего не покидает ваш браузер.** Ни один байт данных не отправляется на сервер. Нет аналитики. Нет трекеров. Нет баз данных.

<br/>

## ✨ Возможности

<table>
<tr>
<td width="50%" valign="top">

### 🎯 Генератор обфускации
- **9 профилей мимикрии:** QUIC Initial, QUIC 0-RTT, TLS 1.3, DTLS 1.3, HTTP/3, SIP, Noise_IK и другие.
- **3 версии AWG:** полная поддержка AWG 1.0, 1.5 и 2.0
- **Browser Fingerprint:** имитация размера пакетов Chrome, Firefox, Safari, Edge, Яндекс
- **Feedback-система:** кнопки «Работает / Не работает» — автоматическое усиление параметров
- **История генераций:** последние 20 конфигов с возможностью копирования
- **Экспорт:** копирование, скачивание `.conf`, побайтовое копирование отдельных групп

</td>
<td width="50%" valign="top">

### 🔑 MergeKeys
- **Обновление обфускации:** применить новые Jc/Jmin/Jmax и I1–I5 к существующему `vpn://`-ключу
- **Объединение ключей:** собрать контейнеры из нескольких ключей в один мастер-ключ
- **Декодирование:** просмотр JSON-содержимого ключа без модификации
- **Интеграция с генератором:** параметры передаются автоматически через sessionStorage

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🛡 Приватность
- **100% Client-Side** — весь код в браузере
- **Zero-Data** — нет серверов, БД, аналитики, cookies
- **Offline Ready** — работает без интернета через локальный сервер
- **Открытый код** — весь TypeScript доступен для аудита

</td>
<td width="50%" valign="top">

### 🚀 Технологии
- **Vue 3** с Composition API и `<script setup>`
- **TypeScript** — строгая типизация на всех уровнях
- **Vite 7** — мгновенный HMR и быстрые билды
- **Lucide Icons** — 50+ иконок, tree-shakeable
- **pako** — zlib для декодирования `vpn://` ключей

</td>
</tr>
</table>

<br/>

## 🔄 Поддерживаемые версии AmneziaWG

| Параметр | AWG 1.0 | AWG 1.5 | AWG 2.0 |
|:---|:---:|:---:|:---:|
| H1–H4 (одно значение) | ✅ | ✅ | — |
| H1–H4 (диапазон) | — | — | ✅ |
| S1–S2 | ✅ | ✅ | ✅ |
| S3–S4 | — | — | ✅ |
| Jc / Jmin / Jmax | ✅ | ✅ | ✅ |
| I1–I5 (только клиент) | — | ✅ | — |
| I1–I5 (сервер + клиент) | — | — | ✅ |

> **AWG 1.0:** Минимальные требования — `Jc ≥ 4`, `Jmax > 81`.
> **AWG 1.5:** I1–I5 работают только на стороне клиента.
> **AWG 2.0:** Полная синхронизация всех параметров между клиентом и сервером.

<br/>

## 📐 Ограничения протокола

Генератор автоматически соблюдает все ограничения:

```
S4 ≤ 32                  — Data prefix не более 32 байт
S1 + 56 ≠ S2             — Init и Response не совпадают по длине
H1, H2, H3, H4           — Диапазоны не пересекаются (AWG 2.0)
Jc ≥ 4, Jmax > 81        — Минимальные требования AWG 1.0
```

<br/>

## ⚡ Быстрый старт

### Онлайн

Просто откройте **[vadim-khristenko.github.io/AmneziaWG-Architect/](https://vadim-khristenko.github.io/AmneziaWG-Architect/)**

### Локальная разработка

```bash
# Клонировать
git clone https://github.com/Vadim-Khristenko/AmneziaWG-Architect.git
cd AmneziaWG-Architect

# Установить зависимости (bun или npm)
bun install      # или npm install

# Dev-сервер с HMR
bun run dev      # или npm run dev

# Продакшн-билд
bun run build    # или npm run build

# Превью билда
bun run preview  # или npm run preview
```

### Просмотр собранного проекта

После сборки (`bun run build`) файлы находятся в папке `dist/`. Для их просмотра **необходим локальный веб-сервер** — прямое открытие `index.html` через `file://` не работает из-за ограничений CORS для ES-модулей в браузерах.

**Варианты запуска:**

```bash
# 1. Встроенный превью Vite (рекомендуется)
bun run preview

# 2. Python (если установлен)
cd dist
python -m http.server 8000
# Откройте: http://localhost:8000

# 3. Node.js (npx)
npx serve dist
# или
npx http-server dist

# 4. VS Code
# Установите расширение "Live Server" и откройте dist/index.html
```

> **Почему не работает file://?** Современные браузеры блокируют загрузку ES-модулей через `file://` протокол из соображений безопасности (CORS policy). Это стандартное ограничение, не связанное с проектом.

<br/>

## 🗂 Структура проекта

```
AmneziaWG-Architect/
├── public/
│   └── assets/               # OG-изображения, favicon, manifest
├── src/
│   ├── views/
│   │   ├── HomeView.vue      # Генератор обфускации (главная страница)
│   │   ├── MergeKeysView.vue # Обновление и объединение vpn://-ключей
│   │   ├── AboutView.vue     # О проекте, таймлайн, контакты
│   │   └── IaaView.vue       # Install AmneziaWG Anywhere (в разработке)
│   ├── components/
│   │   ├── MainHeader.vue    # Навигация
│   │   └── MainFooter.vue    # Подвал
│   ├── composables/
│   │   ├── useGenerator.ts   # Реактивное состояние генератора
│   │   └── useMergeKeys.ts   # Логика MergeKeys
│   ├── utils/
│   │   ├── generator.ts      # Ядро генерации: профили, CPS, H/S/Jc
│   │   └── mergekeys.ts      # Кодеки vpn://, pako, патчинг
│   ├── router/               # Vue Router
│   ├── App.vue               # Корневой компонент
│   └── main.ts               # Точка входа
├── assets/                   # Глобальные CSS (main.css, nav.css, footer.css)
├── ogImageGen.py             # Генератор OG-изображений (Pillow)
├── index.html                # SPA shell
├── vite.config.ts            # Конфигурация Vite
├── tsconfig.json             # Конфигурация TypeScript
└── package.json
```

<br/>

## 🌐 Домены и пулы мимикрии

Каждый профиль использует собственный пул доменов (~540 хостов), проверенных на доступность:

| Пул | Протокол | Хостов |
|:---|:---|:---:|
| `quic_initial` | QUIC Initial (0xC0–0xC3) | ~138 |
| `quic_0rtt` | QUIC 0-RTT / Early Data | ~54 |
| `tls_client_hello` | TLS 1.3 ClientHello | ~199 |
| `dtls` | DTLS 1.3 / WebRTC STUN-TURN | ~82 |
| `sip` | SIP REGISTER (UDP) | ~67 |

<details>
<summary><b>Исключённые сервисы (Россия, 2026)</b></summary>

| Сервис | Причина |
|:---|:---|
| YouTube / Cloudflare | Заблокированы ТСПУ (2024) |
| Discord | Заблокирован (2024) |
| Facebook / Instagram / WhatsApp | Meta — ЭО; WhatsApp — 11.02.2026 |
| Twitter / X | Деградация до полной недоступности |
| Telegram CDN | Троттлинг с 2025, ожидается полная блокировка |
| Google STUN (74.125.x.x) | IP пересекаются с блокировками YouTube |

</details>

<br/>

## 🔒 Безопасность

- **Офлайн-генерация** — весь код исполняется в браузере, ничего не логируется
- **CPS = транспортный силуэт** — криптографический уровень WireGuard не затрагивается: Curve25519, ChaCha20-Poly1305, BLAKE2s остаются неизменными
- **Доменная стратегия** — предпочтительны домены CDN-инфраструктуры, обслуживающей банки и госсервисы (блокировка = экономический ущерб)
- **Аудит** — весь исходный код TypeScript открыт и не обфусцирован

<br/>

## 📝 Эволюция проекта

| Версия | Что произошло |
|:---:|:---|
| **0.1** | Первый прототип — чистый HTML/CSS/JS, один файл, базовая генерация |
| **0.5** | MergeKeys — декодирование и патчинг vpn://-ключей в браузере (pako/zlib) |
| **1.0** | Полный переезд на **Vue 3 + TypeScript + Vite**. Тёмная тема, SPA, анимации |
| **1.1** | AWG 2.0, CPS I1–I5, 7 профилей мимикрии, Browser Fingerprint, история |
| **1.1+** | Группировка параметров, интеграция генератор↔MergeKeys, FAQ-grid, микроанимации |
| **2.0** | Router Mode, Инспектор ключей, проверка доменов, композитные профили, 130+ автотестов |
| **2.1** | Разрешение инцидента с роутингом (SPA-белый экран), умная 404-заглушка с fallback, модульный CI (GitLab) |

За этим проектом стоит один разработчик, который оперативно устраняет баги и непрерывно улучшает UX. Каждое обновление — только на пользу.

<br/>

## 🤝 Contributing

Мы рады внешним вкладчикам! Подробности — в [CONTRIBUTING.md](CONTRIBUTING.md).

**Кратко:**
1. Форкните репозиторий
2. Создайте ветку `feature/your-change` или `fix/issue-123`
3. Откройте Pull Request с описанием изменений

<br/>

## 💬 Обратная связь

Нашли баг? Есть идея? Пишите во **Флудильне Amnezia VPN** в Telegram по юзернейму:

> **@VAI_Programmer**

⚠️ Пожалуйста, не спамьте в ЛС — заблочу 😅 Только через Флудильню или [GitHub Issues](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/issues).

<br/>

## ☕ Поддержать проект

Этот проект живёт благодаря свободному времени и энтузиазму одного человека. Здесь нет рекламы, спонсоров или монетизации. Если Architect вам помог — буду рад монетке на кофе:

<div align="center">

[![Поддержать автора](https://img.shields.io/badge/Поддержать_автора-❤_YooMoney-ff5e6e?style=for-the-badge&logo=heart&logoColor=white)](https://yoomoney.ru/fundraise/1GA2JV51324.260304)

*Каждый донат — это ещё одна фича, фикс или улучшение. Спасибо!*

## 📄 Лицензия 📄

**Этот проект распространяется под лицензией [MIT](LICENSE) — свободное использование, модификация и распространение.**

---

**AmneziaWG Architect** · 2026

[🌐 GitHub Pages](https://vadim-khristenko.github.io/AmneziaWG-Architect/)
&nbsp;·&nbsp;
[💬 Amnezia Telegram](https://t.me/amnezia_vpn/)
&nbsp;·&nbsp;
[🐙 AmneziaVPN GitHub](https://github.com/amnezia-vpn/)

Разработано с ❤️ для сообщества AmneziaVPN

</div>
