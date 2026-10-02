#!/usr/bin/env node
// Drive the browser calculator and capture evidence.
//
// Starts the Fastify server on a free port, drives the page with Chromium, then
// stops the server it started. Exits non-zero when an expected result is wrong.
//
//   node .opencode/skills/verify/scripts/drive.mjs --out artifacts/verify/calculator
//
// Pass --base-url to drive an instance that is already running instead of
// starting one.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..", "..", "..");

function parseArgs(argv) {
  const options = { baseUrl: null, port: null, out: "artifacts/verify/calculator" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--base-url") options.baseUrl = argv[i + 1];
    else if (argv[i] === "--port") options.port = Number(argv[i + 1]);
    else if (argv[i] === "--out") options.out = argv[i + 1];
  }
  return options;
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

async function waitForHealth(baseUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.status === 200) return;
    } catch {
      // not up yet
    }
    await new Promise((done) => setTimeout(done, 150));
  }
  throw new Error(`the server did not become healthy within ${timeoutMs}ms`);
}

function startServer(port) {
  const child = spawn(process.execPath, ["src/server.js", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: REPO,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return child;
}

async function stopServer(child) {
  if (child === null || child.exitCode !== null) return;
  const exited = new Promise((done) => child.once("exit", done));
  child.kill();
  await Promise.race([exited, new Promise((done) => setTimeout(done, 3000))]);
}

async function waitForText(page, selector, expected, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let seen = "";
  while (Date.now() < deadline) {
    seen = (await page.locator(selector).textContent()) ?? "";
    if (seen.trim() === expected) return seen.trim();
    await page.waitForTimeout(50);
  }
  throw new Error(`${selector} reads ${JSON.stringify(seen.trim())}, expected ${JSON.stringify(expected)}`);
}

async function drive(baseUrl, out) {
  await mkdir(out, { recursive: true });
  const evidence = {};
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto(baseUrl);
    for (const label of ["7", "*", "6"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
    }
    const expression = await waitForText(page, "#expression", "7*6");
    await page.getByRole("button", { name: "=", exact: true }).click();
    const result = await waitForText(page, "#result", "42");
    evidence.buttons = { expression, result };

    await page.getByLabel("Name").fill("Ada Lovelace");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("Message").fill("Hello from the verify driver.");
    await page.getByRole("button", { name: "Send" }).click();
    const deadline = Date.now() + 5000;
    let status = "";
    while (Date.now() < deadline) {
      status = (await page.locator("#form-status").textContent()) ?? "";
      if (status.includes("received")) break;
      await page.waitForTimeout(50);
    }
    evidence.form = { status: status.trim() };

    await page.screenshot({ path: resolve(out, "calculator.png"), fullPage: true });
    await writeFile(resolve(out, "calculator.aria.txt"), await page.locator("body").ariaSnapshot(), "utf8");
    evidence.page_errors = errors;
  } finally {
    await browser.close();
  }

  await writeFile(resolve(out, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return evidence;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const out = resolve(REPO, options.out);

  let child = null;
  let baseUrl = options.baseUrl;
  if (baseUrl === null) {
    const port = options.port ?? (await freePort());
    baseUrl = `http://127.0.0.1:${port}`;
    child = startServer(port);
  }

  try {
    await waitForHealth(baseUrl, 10000);
    const evidence = await drive(baseUrl, out);
    process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
    const ok =
      evidence.buttons.expression === "7*6" &&
      evidence.buttons.result === "42" &&
      evidence.form.status.includes("received") &&
      evidence.page_errors.length === 0;
    process.stdout.write(ok ? "verify: pass\n" : "verify: FAIL\n");
    process.exitCode = ok ? 0 : 1;
  } finally {
    await stopServer(child);
  }
}

await main();
