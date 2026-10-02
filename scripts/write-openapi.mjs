#!/usr/bin/env node
// Build the Fastify app, read its OpenAPI document, and write docs/openapi.json.
// Needs no running server: it registers the plugins, calls ready(), and asks
// the swagger plugin for the generated document.
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "../src/app.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "..", "docs", "openapi.json");

const app = await buildApp();
await app.ready();
const document = app.swagger();
await writeFile(OUT, `${JSON.stringify(document, null, 2)}\n`, "utf8");
await app.close();

process.stdout.write(`write-openapi: wrote ${OUT}\n`);
