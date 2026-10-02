# Calculator

The calculator evaluates one arithmetic expression. A reader opens the page, builds an expression, and gets a number.

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
| Missing `expression`, or a value that is not a string | `400`, rejected by the route body schema before evaluation. |
| An empty string or a whitespace-only `expression` such as `"   "` | `400` with `detail` `"expression is empty"`. |
| Malformed syntax such as `2 +` | `400` with `detail` `"expression is not valid syntax"`. |
| Division by zero, including `% 0` | `400` with `detail` `"division by zero"`. |
| A name, call, or attribute access such as `abs(-1)` | `400` with `detail` `"expression is not valid syntax"`. |
| A result that is not a real number, such as `(-1) ** 0.5` | `400` with `detail` `"result is not a real number"`. |
| A result that overflows a float, such as `9 ** 9 ** 9` | `400` with `detail` `"result is out of range"`. |
| An expression longer than 200 characters | `400`, rejected by the body schema before evaluation. |

## Safety invariant

The evaluator is the security boundary. It tokenizes first and rejects any character outside numbers, the allowed operators, and parentheses, so an expression can never call a function, read a global, or touch the host.
