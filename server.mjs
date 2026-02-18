import Pyroscope from "@pyroscope/nodejs";
import next from "next";
import http from "http";

// initialise pyroscope AVANT Next
// Credentials: Grafana Cloud → Pyroscope → Send Profiles → Details (URL, User, Password)
Pyroscope.init({
  appName: "nextjs-api",
  serverAddress: process.env.PYROSCOPE_SERVER_URL || "https://profiles-prod-002.grafana.net",
  basicAuthUser: process.env.PYROSCOPE_BASIC_AUTH_USER || "1529919",
  basicAuthPassword: process.env.PYROSCOPE_BASIC_AUTH_PASSWORD,
});

Pyroscope.start();

console.log("Pyroscope started");

// démarre next
const dev = true;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      handle(req, res);
    })
    .listen(3000, () => {
      console.log("Next.js running on http://localhost:3000");
    });
});
