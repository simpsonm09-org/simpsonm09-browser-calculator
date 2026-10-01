# browser-calculator

A light example built from [`repo-template`](https://github.com/simpsonm09-org/simpsonm09-repo-template). It is a browser calculator that evaluates arithmetic on the server through a FastAPI endpoint, and ships as a container image. Use it as a working reference for the repository standard: the task runner, the pinned tools, the shared CI, the documentation layout, and the container build all fit together.

The original lives in `simpsonm09-org/simpsonm09-browser-calculator`; work happens on the personal fork. See [`repo-standard`](https://github.com/simpsonm09-org/simpsonm09-repo-standard).

## What it does

The page sends an expression to `POST /api/evaluate`. The server parses it with a small, safe evaluator and returns the number. The evaluator accepts numbers, `+ - * / % **`, parentheses, and unary `+` and `-`. It rejects everything else, so an expression can never run code.

## Run it

With Docker:

```bash
docker build -t browser-calculator:local .
docker run --rm -p 8000:8000 browser-calculator:local
```

Then open <http://localhost:8000>.

Locally, with the pinned Python:

```bash
just deps
just serve
```

`just deps` also installs Chromium, so `just test` drives the page in a real browser alongside the unit and HTTP tests.

## Commands

| Command | Does |
| --- | --- |
| `just install` | Installs the pinned tools. |
| `just deps` | Installs the Python dependencies and the Chromium build for the browser tests. |
| `just lint` | Runs the linters. |
| `just test` | Runs the unit, HTTP, and browser tests. |
| `just verify` | Lints and tests. |
| `just docker-build` | Builds the container image. |
| `just docker-run` | Runs the container on port 8000. |

## Documentation

Read [`docs/README.md`](docs/README.md) for the architecture and the calculator feature.

## License

MIT. See [`LICENSE`](LICENSE).
