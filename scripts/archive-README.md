# AmneziaWG Architect — __TAG__

Русский · [English below](#english)

Это собранный сайт. Ничего устанавливать не нужно, интернет для работы не
требуется — вся генерация идёт в браузере.

## Что здесь лежит

```
dist/            собранный сайт: HTML, CSS, JS, шрифты, изображения
scripts/
  awg-gen.sh     генератор конфигов прямо из терминала, без браузера
  serve.sh       запуск сайта — Linux / macOS
  serve.ps1      запуск сайта — Windows PowerShell
  serve.bat      запуск сайта — Windows CMD
bin/
  awg-serve*     готовый бинарник сервера, без зависимостей
README.md        этот файл
```

## Как запустить

**Самое простое — готовый бинарник.** Он ничего не требует и сам откроет
браузер:

```
bin/awg-serve-linux            # Linux
bin/awg-serve-macos            # macOS
bin\awg-serve-windows.exe      # Windows
```

На Linux и macOS может понадобиться разрешить запуск:
`chmod +x bin/awg-serve-*`

Порт по умолчанию 8080, можно задать свой: `awg-serve 3000`.
Не открывать браузер: `--no-open`.

**Если предпочитаете скрипты** — они найдут bun, npx или python, а если ничего
нет, предложат поставить bun:

```
./scripts/serve.sh             # Linux / macOS
.\scripts\serve.ps1            # Windows PowerShell
scripts\serve.bat              # Windows CMD
```

Проверить, что всё на месте, ничего не запуская: `./scripts/serve.sh --check`

**Совсем без сервера.** Откройте `dist/index.html` прямо в браузере. Работать
будет, но прямые ссылки на разделы — нет: браузер не умеет отдавать
`dist/faq/index.html` по адресу `/faq`.

Сайт откроется на русском; английская версия — по адресу `/en`.

## Генерация конфига из терминала

Браузер не обязателен. `awg-gen.sh` применяет те же правила:

```bash
./scripts/awg-gen.sh -v 3.0 -p quic          # один конфиг в stdout
./scripts/awg-gen.sh -v 3.0 -n 5 -d out/     # пять конфигов в каталог
./scripts/awg-gen.sh --help                  # все параметры
```

Скрипт выдаёт только параметры обфускации. Свои `PrivateKey`, `Address`, `DNS`
и секцию `[Peer]` добавьте сами — с ключами он не работает.

> **Важно.** `H1`–`H4`, `S1`–`S4` и все параметры 3.0 должны совпадать на
> клиенте и на сервере. `Jc`, `Jmin`, `Jmax` и `I1`–`I5` — только на клиенте.

## Проверка подлинности

Рядом с архивом в релизе лежит `checksums-__TAG__.sha256`:

```bash
sha256sum -c checksums-__TAG__.sha256
```

---

<a name="english"></a>

# AmneziaWG Architect — __TAG__

[Русский выше](#amneziawg-architect--__TAG__) · English

This is the built site. Nothing to install, and no internet needed — all
generation happens in your browser.

## What is in here

```
dist/            the built site: HTML, CSS, JS, fonts, images
scripts/
  awg-gen.sh     generate configs from a terminal, no browser required
  serve.sh       run the site — Linux / macOS
  serve.ps1      run the site — Windows PowerShell
  serve.bat      run the site — Windows CMD
bin/
  awg-serve*     prebuilt server binary, no dependencies
README.md        this file
```

## Running it

**Easiest — the prebuilt binary.** It needs nothing installed and opens a
browser for you:

```
bin/awg-serve-linux            # Linux
bin/awg-serve-macos            # macOS
bin\awg-serve-windows.exe      # Windows
```

On Linux and macOS you may need to make it executable first:
`chmod +x bin/awg-serve-*`

Default port is 8080; pass your own with `awg-serve 3000`, and `--no-open` to
skip launching a browser.

**If you prefer the scripts**, they look for bun, npx or python, and offer to
install bun if none is present:

```
./scripts/serve.sh             # Linux / macOS
.\scripts\serve.ps1            # Windows PowerShell
scripts\serve.bat              # Windows CMD
```

To check everything is in place without starting anything:
`./scripts/serve.sh --check`

**No server at all.** Open `dist/index.html` directly. It works, but deep links
to sections do not: a browser will not serve `dist/faq/index.html` for `/faq`.

The site opens in Russian; the English version lives at `/en`.

## Generating a config from a terminal

No browser required — `awg-gen.sh` applies the same rules:

```bash
./scripts/awg-gen.sh -v 3.0 -p quic          # one config to stdout
./scripts/awg-gen.sh -v 3.0 -n 5 -d out/     # five configs into a directory
./scripts/awg-gen.sh --help                  # every option
```

It emits obfuscation parameters only. Add your own `PrivateKey`, `Address`,
`DNS` and `[Peer]` section — it never touches key material.

> **Important.** `H1`–`H4`, `S1`–`S4` and every 3.0 parameter must match on
> both the client and the server. `Jc`, `Jmin`, `Jmax` and `I1`–`I5` are
> client-side only.

## Verifying the download

The release ships `checksums-__TAG__.sha256` next to the archives:

```bash
sha256sum -c checksums-__TAG__.sha256
```

---

MIT · https://architect.vai-rice.space
