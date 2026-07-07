import { patchBrokenNodeLocalStorage } from "./patch-localstorage.mjs";
patchBrokenNodeLocalStorage();

import next from "next";
import http from "http";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

// Profiling continu (Grafana Pyroscope) — activé uniquement si demandé ET configuré.
// Import dynamique + try/catch : le module natif (pprof) peut échouer à se charger dans
// certains environnements (ex: terminal VSCode/electron). On ne veut pas que le profiling
// empêche le serveur de démarrer. Voir memoire "server-pyroscope-startup-crash".
async function startPyroscope() {
  if (process.env.PYROSCOPE_ENABLED !== "true") {
    console.log("Pyroscope désactivé (PYROSCOPE_ENABLED != 'true')");
    return;
  }
  if (!process.env.PYROSCOPE_BASIC_AUTH_PASSWORD) {
    console.warn("Pyroscope: PYROSCOPE_BASIC_AUTH_PASSWORD manquant → profiling non démarré");
    return;
  }
  try {
    const { default: Pyroscope } = await import("@pyroscope/nodejs");
    // Credentials: Grafana Cloud → Pyroscope → Send Profiles → Details (URL, User, Password)
    Pyroscope.init({
      appName: process.env.PYROSCOPE_APP_NAME || "nextjs-api",
      serverAddress:
        process.env.PYROSCOPE_SERVER_URL || "https://profiles-prod-002.grafana.net",
      basicAuthUser: process.env.PYROSCOPE_BASIC_AUTH_USER || "1529919",
      basicAuthPassword: process.env.PYROSCOPE_BASIC_AUTH_PASSWORD,
    });
    Pyroscope.start();
    console.log("Pyroscope started");
  } catch (err) {
    console.error(
      "Pyroscope: échec du démarrage (profiling désactivé) —",
      err?.message || err,
    );
  }
}

// Pyroscope doit être initialisé AVANT Next pour instrumenter tout le process.
await startPyroscope();

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      handle(req, res);
    })
    .listen(port, () => {
      console.log(`Next.js running on http://localhost:${port} (dev=${dev})`);
    });
});
