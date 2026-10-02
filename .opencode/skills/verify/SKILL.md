---
name: verify
description: Drive the browser-calculator FastAPI app the way a user does and prove the calculator works end to end. Use when verifying a change to the evaluator, the page, or the POST /api/evaluate contract.
---

# Verify browser-calculator

browser-calculator is a FastAPI service that serves a calculator page at `/` and evaluates expressions at `POST /api/evaluate`. The primary surface is the web page; the HTTP endpoint is the secondary surface. This skill launches the real app, drives both, and captures proof.

## Launch

Run from the repository root with the pinned Python and its dependencies (`just deps` installs them, including Chromium):

```bash
python -m browser_calculator --host 127.0.0.1 --port 8010
```

Use port 8010 for verification so a developer instance on 8000 (`just serve`) is left alone. The server is ready when `/healthz` answers:

```bash
curl -s http://127.0.0.1:8010/healthz
# {"status":"ok"}
```

Teardown stops only the process this run started. Do not kill by port or process name, because that also kills a developer's instance.

## Doctor

One read-only check that decides whether the instance is worth driving:

```bash
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8010/healthz
# 200
```

If it is not 200, the instance is not ours or not up. Stop and relaunch from Launch rather than driving a stale server.

## Drive

Run the shipped helper against the running instance:

```bash
python .opencode/skills/verify/scripts/drive.py --base-url http://127.0.0.1:8010 --out artifacts/verify/calculator
```

The helper drives the page with Chromium, captures a screenshot, an ARIA snapshot, and `evidence.json`, and exits non-zero when any expected result is wrong. For the HTTP contract on its own:

```bash
curl -s -X POST http://127.0.0.1:8010/api/evaluate -H 'content-type: application/json' -d '{"expression":"7*6"}'
# {"expression":"7*6","result":42}
```

## Evidence

Proof artifacts go to `artifacts/verify/<feature>/` and survive teardown. `artifacts/` is gitignored.

- The action and the resulting state, not only the final screen. Click `7`, `*`, `6`, then `=`, and assert both `#expression` reads `7*6` and `#result` reads `42`.
- The page errors list is empty for a normal flow. The helper records `pageerror` events in `evidence.json`.
- The HTTP path is checked with its real status code and body, not assumed from the page.
- A change to the evaluator is proven by an expression that exercises it, not by the page loading.

## Cleanup

Stop the server started in Launch and leave `artifacts/verify/` in place. Cleanup removes the instance and its scratch state, never the proof.

## Helpers

`scripts/drive.py` is the driver. It accepts `--base-url` and `--out`, prints the evidence as JSON, and returns non-zero on a failed assertion.
