"""Serve the browser calculator."""

from __future__ import annotations

import argparse

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the browser calculator.")
    parser.add_argument("--host", default="127.0.0.1", help="Interface to bind.")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind.")
    args = parser.parse_args()
    uvicorn.run("browser_calculator.app:app", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
