# Form

The contact form is a stateless submission. A reader fills in a name, an email, and a message, and gets a server-side acknowledgement.

## Sub-features

- `form-submit` sends the three fields to `POST /api/tools/form` and shows the acknowledgement.
- `form-validation` rejects a missing field, an empty field, a bad email, or an overlong field.

## How to get to it (user POV)

- Open `http://127.0.0.1:8010/`, scroll to the Contact section, fill in the fields, and click `Send`.
- POST `{"name":"<text>","email":"<text>","message":"<text>"}` to `http://127.0.0.1:8010/api/tools/form`.

## Driving it with Playwright and curl

Preconditions:

- The app is healthy at `http://127.0.0.1:8010`, or run the driver with no `--base-url` and let it launch the server.

- **Submit.** Fill `Name` with `Ada Lovelace`, `Email` with `ada@example.com`, `Message` with any text, and click `Send`. `#form-status` reads `Thanks, Ada Lovelace. Your message was received.`
- **HTTP contract.** Run `curl -s -X POST http://127.0.0.1:8010/api/tools/form -H 'content-type: application/json' -d '{"name":"Ada","email":"ada@example.com","message":"Hi"}'`. Status `200` and the body echoes the values with `"acknowledged":true` and a `receivedAt` timestamp.
- **HTTP rejection.** Post `{"name":"Ada","email":"not-an-email","message":"Hi"}`. Status `400`.
- **Proof.** The helper submits the form as part of its run and records the status in `artifacts/verify/calculator/evidence.json` under `form`.

## Gotchas

- The route is stateless, so a second submission never sees the first.
- The success is proven by the rendered `#form-status`, not by the request alone.
- The form has its own keyboard focus; the calculator keydown handler ignores keys while a form field is focused.
