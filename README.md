# browser-calculator

A browser calculator served by Fastify. The page sends an arithmetic expression to the server, the server evaluates it with a small safe evaluator, and the page shows the number. The page also posts a stateless contact form.

This repository lives in `simpsonm09-projects/simpsonm09-browser-calculator`. Work happens on a branch
with a pull request into `main`.
See [`repo-standard`](https://github.com/simpsonm09-projects/simpsonm09-repo-standard)
for the branch model and the protection rules.

## What it does

The page sends an expression to `POST /api/evaluate`. The server parses it with a safe evaluator and returns the number. The evaluator accepts numbers, `+ - * / % **`, parentheses, and unary `+` and `-`. It rejects everything else, so an expression can never run code. The page also sends a name, an email, and a message to `POST /api/tools/form`, which validates the payload and acknowledges it without storing anything.

## Run it

With Docker:

```bash
docker build -t browser-calculator:local .
docker run --rm -p 8000:8000 browser-calculator:local
```

Then open <http://localhost:8000>.

Locally, with the pinned Node:

```bash
just deps
just serve
```

## Commands

| Command | Does |
| --- | --- |
| `just install` | Installs the pinned tools. |
| `just deps` | Installs the Node dependencies with `npm ci`. |
| `just lint` | Runs the linters. |
| `just test` | Runs the vitest suite. |
| `just coverage` | Runs the tests and writes `coverage/lcov.info`. |
| `just spec` | Regenerates `docs/openapi.json` from the route schemas. |
| `just verify` | Lints and tests. |
| `just serve` | Serves the app on port 8000. |
| `just docker-build` | Builds the container image. |
| `just docker-run` | Runs the container on port 8000. |

## Documentation

Read [`docs/README.md`](docs/README.md) for the architecture, the calculator feature, the form feature, and the OpenAPI contract.

## License

MIT. See [`LICENSE`](LICENSE).
