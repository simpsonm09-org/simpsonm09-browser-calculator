---
name: verify
description: Drive the browser-calculator Fastify app the way a user does and prove the calculator and the form work end to end. Use when verifying a change to the evaluator, the page, the form, or the HTTP contracts.
---

# Verify browser-calculator

browser-calculator is a Fastify service that serves a calculator page and a contact form at `/`, and evaluates expressions at `POST /api/evaluate`. The primary surface is the web page; the HTTP endpoint is the secondary surface. This skill launches the real app, drives both surfaces, and captures proof.

## Launch

The driver starts the server itself on a free port, so there is nothing to launch by hand. To drive an instance that is already running instead, start it with the pinned Node and dependencies (`just deps` installs them, including Chromium):

```bash
node src/server.js --host 127.0.0.1 --port 8010
```

Use port 8010 for verification so a developer instance on 8000 (`just serve`) is left alone. The server is ready when `/healthz` answers:

```bash
curl -s http://127.0.0.1:8010/healthz
# {"status":"ok"}
```

## Doctor

One read-only check that decides whether a running instance is worth driving:

```bash
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8010/healthz
# 200
```

If it is not 200, the instance is not ours or not up. The driver's own launch path waits for this check and fails if it does not pass. Do not drive a stale server.

## Drive

Run the shipped helper. With no `--base-url` it launches the server, drives the page, and stops the server it started:

```bash
node .claude/skills/verify/scripts/drive.mjs --out artifacts/verify/calculator
```

To target an already-running instance, pass its base URL:

```bash
node .claude/skills/verify/scripts/drive.mjs --base-url http://127.0.0.1:8010 --out artifacts/verify/calculator
```

The helper drives the page with Chromium, clicks `7`, `*`, `6`, then `=`, asserts the display, submits the contact form, captures a screenshot, an ARIA snapshot, and `evidence.json`, and exits non-zero when an expected result is wrong. For the HTTP contract on its own:

```bash
curl -s -X POST http://127.0.0.1:8010/api/evaluate -H 'content-type: application/json' -d '{"expression":"7*6"}'
# {"expression":"7*6","result":42}
curl -s -X POST http://127.0.0.1:8010/api/tools/form -H 'content-type: application/json' -d '{"name":"Ada","email":"ada@example.com","message":"Hi"}'
# {"name":"Ada","email":"ada@example.com","message":"Hi","acknowledged":true,"receivedAt":"..."}
```

## Evidence

Proof artifacts go to `artifacts/verify/<feature>/` and survive teardown. `artifacts/` is gitignored.

- The action and the resulting state, not only the final screen. Click `7`, `*`, `6`, then `=`, and assert both `#expression` reads `7*6` and `#result` reads `42`.
- The form submission is proven by the rendered acknowledgement in `#form-status`, not by the request returning 200 alone.
- The page errors list is empty for a normal flow. The helper records `pageerror` events in `evidence.json`.
- The HTTP path is checked with its real status code and body, not assumed from the page.
- A change to the evaluator is proven by an expression that exercises it, not by the page loading.

## Cleanup

The helper stops the server it started. When you launched one by hand, stop only the process this run started; do not kill by port or process name. Leave `artifacts/verify/` in place. Cleanup removes the instance and its scratch state, never the proof.

## Helpers

`scripts/drive.mjs` is the driver. It accepts `--base-url`, `--port`, and `--out`, prints the evidence as JSON, and returns non-zero on a failed assertion.
