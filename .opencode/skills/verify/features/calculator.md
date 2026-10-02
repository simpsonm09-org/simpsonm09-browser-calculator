# Calculator

The calculator is the one user-facing feature. A reader builds an arithmetic expression with the on-screen buttons or the keyboard and gets a number back.

## Sub-features

- `calc-buttons` builds and evaluates an expression from the on-screen buttons.
- `calc-keyboard` builds and evaluates an expression from the keyboard, where `^` inserts `**`.
- `calc-clear` resets the display to `0` with the clear button or `Escape`.
- `calc-backspace` removes the last character with the backspace button or `Backspace`.
- `calc-api` evaluates the same expression over `POST /api/evaluate`.
- `calc-errors` shows the reason for a rejected expression, such as `division by zero`.

## How to get to it (user POV)

- Open `http://127.0.0.1:8010/` and choose a button or type an expression, then `=`.
- Type an expression and press `Enter`.
- POST `{"expression":"<text>"}` to `http://127.0.0.1:8010/api/evaluate`.

## Driving it with Playwright and curl

Preconditions:

- The app is healthy at `http://127.0.0.1:8010`.
- Chromium is installed for the pinned Python (`just deps`).

- **Buttons.** Choose `7`, `*`, `6`, then `=`. Run `python .opencode/skills/verify/scripts/drive.py --base-url http://127.0.0.1:8010 --out artifacts/verify/calculator`. `#expression` reads `7*6` and `#result` reads `42`.
- **Keyboard.** Type `2+3` and press `Enter`. `#expression` reads `2+3` and `#result` reads `5`.
- **Power key.** Type `2^3` and press `Enter`. `#expression` reads `2**3` and `#result` reads `8`.
- **Clear.** Type `12` and press `Escape`. `#expression` reads `0`.
- **Backspace.** Type `78` and press `Backspace`. `#expression` reads `7`.
- **Error state.** Type `1/0` and press `Enter`. `#result` reads `division by zero`.
- **HTTP contract.** Run `curl -s -X POST http://127.0.0.1:8010/api/evaluate -H 'content-type: application/json' -d '{"expression":"7*6"}'`. Status `200` and the body is `{"expression":"7*6","result":42}`.
- **HTTP rejection.** Post `{"expression":"2 +"}`. Status `400` with `detail` `"expression is not valid syntax"`.
- **Proof.** Run the helper once and keep `artifacts/verify/calculator/calculator.png`, `calculator.aria.txt`, and `evidence.json`. A passing run has an empty `page_errors` list.

## Gotchas

- A green unit test is not proof of the page; drive the real page and assert the rendered `#result`.
- The page sends the expression to the server, so an evaluator change must be exercised through a real expression, not by reading the module.
- `^` is rewritten to `**` in the display, so assert `2**3`, not `2^3`.
- Drive a verification port such as 8010 so `just serve` on 8000 keeps working.
- Keep the artifacts; cleanup stops the server, not the proof.
