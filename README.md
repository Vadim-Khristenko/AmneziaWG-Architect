<div align="center">

<img src=".github/assets/github-preview.png" alt="Any Tech Architect" width="100%">

**Русский** · [English](README.en.md)

[![Открыть генератор](https://img.shields.io/badge/Открыть_генератор-architect.vai--rice.space-e8a840?style=for-the-badge)](https://architect.vai-rice.space/)
[![AmneziaWG 3.0](https://img.shields.io/badge/AmneziaWG-3.0-5fbf7f?style=for-the-badge)](#поддерживаемые-версии)
[![MIT](https://img.shields.io/badge/Лицензия-MIT-c49040?style=for-the-badge)](LICENSE)

Генератор параметров обфускации AmneziaWG. Всё считается в браузере — ни ключи,
ни конфиги никуда не отправляются.

</div>

---

## Что это

Обычный WireGuard слишком легко опознать: фиксированный байт типа сообщения и
предсказуемые размеры пакетов (148 байт на handshake initiation, 92 на response)
позволяют DPI определить протокол по первому же пакету и заблокировать его целиком.

AmneziaWG добавляет поверх той же криптографии слой обфускации. **Architect**
подбирает его параметры так, чтобы они были корректными, совместимыми с вашим
клиентом и не воссоздавали случайно тот самый отпечаток, от которого вы уходите.

> [!IMPORTANT]
> Проект создан для исследовательских и образовательных целей и никогда не
> создавался для использования в России или странах СНГ. Применение инструментов
> обфускации трафика может нарушать законодательство вашей страны —
> ответственность за использование лежит на вас.

---

## Поддерживаемые версии

| | Junk `Jc/Jmin/Jmax` | `S1 S2` | `S3 S4` | CPS `I1–I5` | Заголовки `H1–H4` | Параметры 3.0 |
|:--|:--:|:--:|:--:|:--:|:--:|:--:|
| **1.0** | ✅ | ✅ | — | — | фиксированные | — |
| **1.5** | ✅ | ✅ | — | только клиент | фиксированные | — |
| **2.0** | ✅ | ✅ | ✅ | ✅ | диапазоны | — |
| **3.0** | ✅ | ✅ | ✅ | ✅ | диапазоны | ✅ |

### Что добавила 3.0

Параметры выверены **по исходникам** `amneziawg-go v3.0.1` и ветки `feat/awg3`
репозитория `amneziawg-tools`, а не по документации — она на момент написания
описывает 2.0.

| Параметр | Что делает |
|:--|:--|
| `HeaderProtectionKey` | Общий 32-байтный ключ ChaCha20. Хендшейк и cookie шифруются целиком, транспортные пакеты — только 16-байтный заголовок. В `.conf` пишется в base64, как `PrivateKey`; в UAPI — в hex. |
| `ContentPaddingAddition` | Случайный добавочный паддинг каждого транспортного пакета вместо выравнивания по 16 байт. |
| `RekeyAfterTime`<br>`RekeyTimeout`<br>`RejectAfterTime`<br>`KeepaliveTimeout`<br>`MaxHandshakeAttempts` | Диапазоны вместо фиксированных констант WireGuard — ровный ритм хендшейков перестаёт быть отпечатком. |

> [!WARNING]
> **При включённой защите заголовков S1–S4 не могут быть меньше 12.** Nonce
> шифра нигде не передаётся — он берётся из первых 12 байт S-паддинга. Если
> паддинг короче, срез уходит за его границу в тело сообщения, и «nonce»
> перестаёт быть случайным. Ошибки при этом не будет — шифр просто тихо
> ослабнет. Генератор поднимает S до 12 автоматически, а валидатор отклоняет
> конфиги, где это нарушено.

Теги `<d>`, `<ds>` и `<dz>` в v3.0.1 разбираются парсером, но не подключены к
отправке пакетов — это задел под AWG 4.0, поэтому генератор их не выдаёт.

---

## Инструменты

<table>
<tr>
<td width="50%" valign="top">
<img src="public/assets/og-mergekeys.png" alt="MergeKeys" width="100%">
<h3>MergeKeys</h3>
Редактор и объединение ключей <code>vpn://</code>. Обновляйте обфускацию
существующего ключа или собирайте контейнеры из нескольких ключей в один
мастер-ключ. Всё локально.
</td>
<td width="50%" valign="top">
<img src="public/assets/og-simulator.png" alt="Packet Simulator" width="100%">
<h3>Packet Simulator</h3>
Показывает, как выглядит старт сессии: CPS-цепочка, junk-train, хендшейк и
данные. Учитывает версию — 1.0 и 1.5 рисуются без того, чего у них нет.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<img src="public/assets/og-faq.png" alt="FAQ" width="100%">
<h3>FAQ</h3>
Разбор параметров, различий версий и типичных проблем. Поиск сразу по двум
языкам, категории и прямые ссылки на конкретные ответы.
</td>
<td width="50%" valign="top">
<img src="public/assets/og-vaiexia.png" alt="VAIEXIA" width="100%">
<h3>VAIEXIA</h3>
Веб-панель и бот для Telegram, Discord и Matrix: управление сервером или
кластером откуда угодно. Скоро.
</td>
</tr>
</table>

Плюс **11 профилей мимикрии** (QUIC Initial, QUIC 0-RTT, TLS 1.3, DTLS 1.3,
HTTP/3, SIP, DNS, Noise_IK и композитные), **матрица совместимости на 10
клиентов**, **batch-генерация до 1000 конфигов** в Web Worker и **проверка
конфигов** до передачи в клиент.

---

## Приватность

Бэкенда нет — принимать данные попросту нечему. Ни аналитики, ни трекеров, ни
cookies, ни сторонних скриптов; шрифты отдаются со своего домена, а не из Google
Fonts. Вся случайность берётся из `crypto.getRandomValues()` с отбраковкой,
исключающей смещение по модулю — `Math.random()` в генераторе нет нигде.

Страницу можно сохранить через <kbd>Ctrl</kbd>+<kbd>S</kbd> и пользоваться офлайн.

---

## Быстрый старт

**Онлайн:** [architect.vai-rice.space](https://architect.vai-rice.space/)

```bash
git clone https://github.com/Vadim-Khristenko/AmneziaWG-Architect.git
cd AmneziaWG-Architect
bun install
bun run dev
```

| Команда | Что делает |
|:--|:--|
| `bun run dev` | Dev-сервер с HMR |
| `bun run build` | Продакшн-сборка: заглушки для ботов, `sitemap.xml`, `robots.txt` |
| `bun run preview` | Просмотр собранного проекта |
| `bun run test:run` | Прогон тестов |
| `bun run typecheck` | Проверка типов |
| `bun run og` | Пересборка OG-изображений и превью для GitHub |

### Запуск без зависимостей

В релизных архивах лежит `awg-serve` — статический сервер на Rust без единой
зависимости, собранный под Linux, macOS и Windows. Ничего ставить не нужно:

```bash
bin/awg-serve-linux            # Linux
bin/awg-serve-macos            # macOS
bin\awg-serve-windows.exe      # Windows
```

Порт по умолчанию 8080 (`awg-serve 3000` — свой), `--no-open` не открывать
браузер. Исходник — в [`tools/awg-serve`](tools/awg-serve).

Скрипты `scripts/serve.*` остаются как альтернатива: они найдут bun, npx или
python, а `--check` покажет, что нашлось, ничего не запуская.

### Автономный генератор

Если браузер недоступен — те же правила в виде обычного shell-скрипта, без
зависимостей и без сети:

```bash
./scripts/awg-gen.sh -v 3.0 -p quic          # один конфиг в stdout
./scripts/awg-gen.sh -v 3.0 -n 5 -d out/     # пять конфигов в каталог
./scripts/awg-gen.sh --help                  # все параметры
```

### Установка на сервер

Конфигурация — половина дела; вторая половина — сервер, который её примет. Для
этого есть отдельный проект:
**[awg-containers-and-tools](https://github.com/Vadim-Khristenko/awg-containers-and-tools)**
— контейнеры AmneziaWG под все четыре версии протокола (1.0, 1.5, 2.0, 3.0) и
утилита `awg-tool` для развёртывания.

```bash
awg-tool gen --version 3.0 --profile quic --client amneziavpn
awg-tool install --host 203.0.113.9 --user root --key ~/.ssh/id_ed25519
```

Особенно он нужен для 3.0: официальный пайплайн настройки конфигурации этой
версии не разбирает, поэтому `awg-tool` обходит парсер `.conf` и говорит с
демоном напрямую через UAPI-сокет. Параметры рандомизируются на каждое
развёртывание — чтобы разные инстансы не выглядели для DPI одинаково.

Проект неофициальный и поддерживается сообществом, как и Architect.

### Если GitHub недоступен

Ссылка на GitHub в разделе про заблокированный GitHub — так себе помощь, поэтому
вот зеркала на своём Forgejo. Ими можно делиться:

| Что | Зеркало |
|:--|:--|
| Architect (этот репозиторий) | [git.vai-rice.space/vai_prog/AmneziaWG-Architect](https://git.vai-rice.space/vai_prog/AmneziaWG-Architect) |
| Установщик для сервера | [git.vai-rice.space/vai_prog/awg-containers-and-tools](https://git.vai-rice.space/vai_prog/awg-containers-and-tools) |
| Приложения Amnezia | [git.vai-rice.space/amnezia-vpn](https://git.vai-rice.space/amnezia-vpn) |

```bash
git clone https://git.vai-rice.space/vai_prog/AmneziaWG-Architect.git
```

Первые два — зеркала моих репозиториев. Третье, с приложениями Amnezia,
независимое, а не официальный сайт Amnezia: сверяйте контрольные суммы и
подписи релизов перед установкой.

---

## Нашли баг или есть идея?

Пишите — это лучший способ починить то, о чём мы не знаем. Заводите
[issue](https://github.com/Vadim-Khristenko/AmneziaWG-Architect/issues),
присоединяйтесь к обсуждению в чате, а вскоре и на `git.vai-rice.space`.

Если проблема в конкретном конфиге, приложите версию AmneziaWG, клиент и его
версию, а также сами параметры — **без приватных ключей**. Этого почти всегда
достаточно, чтобы воспроизвести.

Как устроена разработка — в [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Поддержать

Проект живёт на энтузиазме: ни рекламы, ни спонсоров, ни монетизации.

[![YooMoney](https://img.shields.io/badge/YooMoney-разовый-8b3ffd?style=flat-square)](https://yoomoney.ru/fundraise/1GA2JV51324.260304)
[![Patreon](https://img.shields.io/badge/Patreon-регулярно-f96854?style=flat-square)](https://patreon.com/VAI_PROG)
[![DaLink](https://img.shields.io/badge/DaLink-донат-4fb3c9?style=flat-square)](https://dalink.to/vai_prog)

<details>
<summary><b>Криптовалюта</b> — BTC, ETH, TON, USDT, TRX, SOL</summary>

<br>

> [!CAUTION]
> Проверяйте сеть перед отправкой: перевод в неверной сети означает
> безвозвратную потерю средств.

| Монета | Сеть | Адрес |
|:--|:--|:--|
| Bitcoin `BTC` | Bitcoin · Native SegWit | `bc1qwvfpdhjuzelw8s9vxcfjj6fatnq3cltf0d48jy` |
| Ethereum `ETH` | Ethereum · ERC-20 | `0x277195Ff068756F09683FAB523b2cdDf8Ef35B44` |
| Toncoin `TON` | The Open Network | `UQBVdcwKqy8lx_2plsf2YPbcBJdYbPtnKbddmFWZntqiAEME` |
| Tether `USDT` | JETTON · TON | `UQCaNScHxNbJsCi5Wc47rJqNpJPiDASUlMJ1nRwxq-hXSGoQ` |
| Tron `TRX` | Tron · TRC-20 | `TC8dYqkDYQkuCKe7A6PWXUgDRB8Rr2Xd9f` |
| Solana `SOL` | Solana | `4i2uWx82jhgVorPQyM2y47X2YvRgCVNNWPfNmVrGcCaE` |

</details>

---

<div align="center">

<img src="public/assets/og-about.png" alt="О проекте" width="100%">

Другие мои проекты — на **[vai-rice.space](https://vai-rice.space)**

Основано на идеях [Special Junk Packet List](https://voidwaifu.github.io/Special-Junk-Packet-List/)
от [@VoidWaifu](https://github.com/VoidWaifu)

**[MIT](LICENSE)** · Сделано для сообщества AmneziaVPN

</div>
