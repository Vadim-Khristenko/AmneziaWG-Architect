<template>
    <footer class="footer">
        <div class="container footer-inner">
            <div class="footer-brand">
                <span class="footer-title">AmneziaWG Architect Lite</span>
                <span class="footer-note"
                    >Potato build: минимальный вес и быстрый запуск.</span
                >
            </div>

            <nav class="footer-links" aria-label="Footer links">
                <a
                    href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                    target="_blank"
                    rel="noopener noreferrer"
                    >GitHub</a
                >
                <a
                    href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    >Issues</a
                >
                <a
                    href="https://t.me/amnezia_vpn"
                    target="_blank"
                    rel="noopener noreferrer"
                    >Telegram</a
                >
            </nav>

            <div class="footer-meta">100% local. No telemetry. No trackers.</div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    margin-top: auto;
    border-top: 1px solid var(--border2);
    background: var(--bg2);
    padding: 18px 0;
    position: relative;
    z-index: 10;
}

.footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.footer-brand {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 220px;
}

.footer-title {
    font-family: var(--fu);
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text);
}

.footer-note {
    font-size: 0.72rem;
    color: var(--text3);
}

.footer-links {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.footer-links a {
    font-size: 0.78rem;
    color: var(--text2);
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--border3);
}

.footer-links a:hover {
    color: var(--accent);
    border-color: var(--border);
}

.footer-meta {
    font-size: 0.72rem;
    color: var(--text3);
}

@media (max-width: 760px) {
    .footer-inner {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
