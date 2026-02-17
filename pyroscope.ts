import pyroscope from "@pyroscope/nodejs";

pyroscope.init({
  appName: "nextjs-api",
  serverAddress: "http://localhost:4040",
});

pyroscope.start();
