// Serve the browser calculator.
import { buildApp } from "./app.js";

function readOption(argv, name, fallback) {
  const index = argv.indexOf(name);
  if (index !== -1 && index + 1 < argv.length) {
    return argv[index + 1];
  }
  return fallback;
}

const argv = process.argv.slice(2);
const host = readOption(argv, "--host", process.env.HOST ?? "127.0.0.1");
const port = Number(readOption(argv, "--port", process.env.PORT ?? "8000"));

const app = await buildApp({ logger: true });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
