# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Rebuilt the service from Python and FastAPI to Node 24 and Fastify. The evaluator is ported to plain ESM JavaScript with the same safety boundary and limits.
- Moved the static assets to `public/` and added a stateless contact form at `POST /api/tools/form`.
- Replaced the hand-written `docs/openapi.yaml` with the generated `docs/openapi.json`.
- Replaced the pytest and Playwright-Python suites with Vitest and a Playwright Node driver.
