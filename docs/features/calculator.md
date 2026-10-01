# Calculator

The calculator is the one user-facing feature. A reader opens the page, builds an expression, and gets a number.

## What it does

The page collects an expression from the on-screen buttons or the keyboard. It sends the expression to `POST /api/evaluate` and shows the returned number. The clear button empties the expression and the backspace button removes the last character.

The server accepts:

- Integer and decimal numbers.
- The binary operators `+`, `-`, `*`, `/`, `%`, and `**`.
- Parentheses, which override precedence.
- Unary `+` and `-`.
- Whitespace, which is ignored.

Everything else is rejected.

## Data shape

The request body is `{"expression": "<text>"}`. The success body is `{"expression": "<text>", "result": <number>}`. `result` is always a number, so a whole value comes back as `42` and a fractional value as `3.5`.

## Failure modes

| Input | Response |
| --- | --- |
| Missing `expression`, or an empty string | `422`, rejected by the request model before evaluation. |
| A whitespace-only `expression` such as `"   "` | `400` with `detail` `"expression is empty"`. |
| Malformed syntax such as `2 +` | `400` with `detail` `"expression is not valid syntax"`. |
| Division by zero | `400` with `detail` `"division by zero"`. |
| A name, call, or attribute access | `400`, because the node is not in the dispatch table. |
| A result that is not a real number, such as `(-1) ** 0.5` | `400` with `detail` `"result is not a real number"`. |
| A result that overflows a float | `400` with `detail` `"result is out of range"`. |
| An expression longer than 200 characters | `400`, and `422` before evaluation when it exceeds the field limit. |
