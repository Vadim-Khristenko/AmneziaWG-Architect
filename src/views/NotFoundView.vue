<script setup lang="ts">
import { AlertTriangle, Home, ArrowLeft } from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();

function goHome() {
    router.push("/");
}

function goBack() {
    router.back();
}
</script>

<template>
    <div class="nf-wrap fade-in">
        <div class="nf-content">
            <div class="nf-icon-wrap">
                <AlertTriangle :size="48" class="nf-icon" />
            </div>

            <h1 class="nf-title">404</h1>
            <h2 class="nf-subtitle">Страница не найдена</h2>

            <p class="nf-desc">
                Кажется, вы перешли по неверной ссылке или эта страница была
                удалена. Не переживайте, главное — ключи в безопасности.
            </p>

            <div class="nf-actions">
                <button class="btn btn-primary" @click="goHome">
                    <Home :size="16" />
                    На главную
                </button>
                <button class="btn btn-secondary" @click="goBack">
                    <ArrowLeft :size="16" />
                    Вернуться назад
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.nf-wrap {
    min-height: calc(100vh - 80px - 200px); /* App header + footer approx */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
}

.nf-content {
    max-width: 500px;
    width: 100%;
    text-align: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 60px 40px;
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
}

.nf-content::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, var(--red), transparent);
    opacity: 0.8;
}

.nf-icon-wrap {
    width: 90px;
    height: 90px;
    margin: 0 auto 24px;
    background: var(--red-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--red);
    box-shadow: 0 0 40px var(--red-bg);
    animation: pulse 3s infinite alternate;
}

.nf-title {
    font-family: var(--fu);
    font-size: 5rem;
    font-weight: 900;
    margin: 0;
    line-height: 1;
    background: linear-gradient(135deg, var(--red2), var(--red));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 4px 20px rgba(212, 96, 74, 0.2);
}

.nf-subtitle {
    font-family: var(--fu);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 10px 0 20px;
}

.nf-desc {
    color: var(--text2);
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 30px;
}

.nf-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 600;
}

.btn-primary {
    background: linear-gradient(180deg, var(--red2), var(--red));
    color: #fff;
    border-color: rgba(255, 143, 125, 0.6);
    box-shadow: 0 6px 20px rgba(212, 96, 74, 0.25);
}

.btn-primary:hover {
    box-shadow: 0 8px 25px rgba(212, 96, 74, 0.4);
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 20px rgba(212, 96, 74, 0.1);
        transform: scale(0.98);
    }
    100% {
        box-shadow: 0 0 40px rgba(212, 96, 74, 0.25);
        transform: scale(1.02);
    }
}

@media (max-width: 480px) {
    .nf-content {
        padding: 40px 24px;
    }
    .nf-title {
        font-size: 4rem;
    }
    .nf-actions {
        flex-direction: column;
    }
    .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
