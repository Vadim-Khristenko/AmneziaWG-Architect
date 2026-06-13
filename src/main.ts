import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Self-hosted variable fonts — bundled & served same-origin, so the UI no
// longer depends on fonts.gstatic.com being reachable (it is throttled/blocked
// for much of our RU/CIS audience). One woff2 per family, subset-gated by
// unicode-range; Vite hashes them and our _headers caches them immutably.
import "@fontsource-variable/manrope/index.css";
import "@fontsource-variable/unbounded/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";

import "../assets/main.css";

const app = createApp(App);
app.use(router);
app.mount("#app");
