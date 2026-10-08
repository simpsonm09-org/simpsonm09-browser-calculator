# browser-calculator verification map

This directory is the maintained source for verifying the user-facing behavior of browser-calculator. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- The driver launches the server on a free port; to drive a hand-started instance, launch it at `http://127.0.0.1:8010` with the pinned Node (see the skill's Launch section).
- Confirm `/healthz` returns `{"status":"ok"}` before driving anything.
- Never drive an instance that this run did not start; do not share a port with `just serve`.
- Write proof under `artifacts/verify/<feature>/`.

## Driving conventions

- Start every recipe from the loaded page at `/`.
- Prefer ARIA roles and accessible names (`getByRole("button", { name: "7" })`) over CSS position.
- The display uses `#expression` for the input and `#result` for the evaluated number.
- The form uses `#contact-name`, `#contact-email`, `#contact-message`, and `#form-status`.
- Run browser actions through `scripts/drive.mjs` or an equivalent Playwright flow.
- Run terminal actions with `curl` against `POST /api/evaluate` and `POST /api/tools/form`.
- Keep proof artifacts during cleanup.

## Proof and skip reporting

- Capture the action and the resulting state, not only the final screen.
- Browser proof includes a screenshot and an ARIA snapshot with the page identity visible.
- HTTP proof includes the request, the status code, and the response body.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph of user-visible behavior, then exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, and `Gotchas`.

## Features

- [Calculator](./calculator.md) covers button and keyboard entry, clear and backspace, the HTTP contract, and the error states.
- [Form](./form.md) covers the contact form submission, its validation, and its acknowledgement.
