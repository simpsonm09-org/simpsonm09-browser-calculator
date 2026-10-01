# browser-calculator working agreements

A FastAPI service and a static page that evaluate arithmetic. It is the reference repository for the standard.

## Ground rules

- The evaluator is the security boundary. It accepts numbers, `+ - * / % **`, parentheses, and unary `+` and `-`. Never add a feature that lets an expression run code or touch the host.
- Keep the container image small and the server dependency list short.
- No secret, credential, or machine path is committed.

## Commands

- `just install`, `just deps`, `just lint`, `just test`, `just verify`.
- `just docker-build` and `just docker-run` build and run the image.

## Repo facts

- Language and toolchain: Python 3.12 and FastAPI, pinned in `mise.toml` and `pyproject.toml`.
- Data: no database. State is per request.
- Domain: the page sends an expression to `POST /api/evaluate`. The server parses it with the safe evaluator and returns the number.
- Docs: `docs/README.md` indexes the architecture, the calculator feature, and the OpenAPI contract.

## Skills

No repo-local skills. General best practices and integration come from the plugins.
