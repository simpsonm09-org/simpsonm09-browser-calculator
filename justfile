# Cross-platform task runner for humans and agents. `just --list` shows every
# recipe. Keep each recipe a thin call to a portable tool or a script under
# scripts/. See https://github.com/simpsonm09-org/simpsonm09-repo-standard/blob/main/docs/task-runner.md
set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

# List the recipes.
default:
    @just --list

# Install the pinned tools.
install:
    mise install

# Install the Python dependencies for local runs and tests.
deps:
    mise run deps

# Run every linter over the tracked files.
lint:
    mise exec -- flint run --full

# Fix what the linters can fix.
lint-fix:
    mise exec -- flint run --fix

# Run the AI-slop gate.
aislop:
    npx --yes aislop@0.16.1 ci

# Run the test suite. `mise run test` should hold the repository test command.
test:
    mise run test

# Serve the calculator on http://127.0.0.1:8000 without a container.
serve:
    mise run serve

# Build the container image.
docker-build:
    docker build -t browser-calculator:local .

# Run the container on http://localhost:8000.
docker-run:
    docker run --rm -p 8000:8000 browser-calculator:local

# Lint and test.
verify: lint test


# Prune remote-tracking refs and delete local branches merged into main.
prune:
    node scripts/prune.mjs