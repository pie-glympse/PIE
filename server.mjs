import Pyroscope from "@pyroscope/nodejs";
import next from "next";
import http from "http";

// initialise pyroscope AVANT Next
Pyroscope.init({
  appName: "nextjs-api",
  serverAddress: "http://localhost:4040",
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
