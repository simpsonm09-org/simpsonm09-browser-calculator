# browser-calculator working agreements

A Fastify service and a static page that evaluate arithmetic. It is the reference repository for the standard.

## Ground rules

- The evaluator is the security boundary. It accepts numbers, `+ - * / % **`, parentheses, and unary `+` and `-`. Never add a feature that lets an expression run code or touch the host.
- Keep the container image small and the server dependency list short.
- The form route is stateless. Keep state per request.
- No secret, credential, or machine path is committed.

## Commands

- `just install`, `just deps`, `just lint`, `just test`, `just spec`, `just verify`.
- `just docker-build` and `just docker-run` build and run the image.

## Repo facts

- Language and toolchain: Node 24, Fastify 5, plain ESM JavaScript, Vitest, pinned in `mise.toml` and `package.json`.
- Data: no database. State is per request.
- Domain: the page sends an expression to `POST /api/evaluate`. The server parses it with the safe evaluator in `src/evaluator.js` and returns the number. The page posts a form to `POST /api/tools/form`, which validates and acknowledges it.
- Contracts: `docs/openapi.json` is generated from the route schemas. Regenerate it with `just spec`; do not hand-edit it.
- Docs: `docs/README.md` indexes the architecture, the calculator feature, the form feature, and the OpenAPI contract.

## Skills

No repo-local skills. General best practices and integration come from the plugins.
