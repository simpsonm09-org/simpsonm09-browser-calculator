#!/usr/bin/env python
"""Drive the browser calculator and capture evidence.

Start the app first, then run:

    python .opencode/skills/verify/scripts/drive.py \
        --base-url http://127.0.0.1:8010 \
        --out artifacts/verify/calculator

Exits non-zero when an expected result is wrong.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from playwright.sync_api import expect, sync_playwright


def drive(base_url: str, out: Path) -> dict[str, Any]:
    out.mkdir(parents=True, exist_ok=True)
    evidence: dict[str, Any] = {}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))

        page.goto(base_url)
        for label in ["7", "*", "6"]:
            page.get_by_role("button", name=label, exact=True).click()
        expect(page.locator("#expression")).to_have_text("7*6")
        page.get_by_role("button", name="=", exact=True).click()
        expect(page.locator("#result")).to_have_text("42")
        evidence["buttons"] = {
            "expression": page.locator("#expression").inner_text(),
            "result": page.locator("#result").inner_text(),
        }

        page.goto(base_url)
        page.keyboard.type("2+3")
        expect(page.locator("#expression")).to_have_text("2+3")
        page.keyboard.press("Enter")
        expect(page.locator("#result")).to_have_text("5")
        evidence["keyboard"] = {
            "expression": page.locator("#expression").inner_text(),
            "result": page.locator("#result").inner_text(),
        }

        page.goto(base_url)
        page.keyboard.type("1/0")
        page.keyboard.press("Enter")
        expect(page.locator("#result")).to_have_text("division by zero")
        evidence["division_by_zero"] = {"result": page.locator("#result").inner_text()}

        page.screenshot(path=str(out / "calculator.png"), full_page=True)
        (out / "calculator.aria.txt").write_text(
            page.locator("body").aria_snapshot(), encoding="utf-8"
        )
        evidence["page_errors"] = errors
        browser.close()

    (out / "evidence.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8010")
    parser.add_argument("--out", default="artifacts/verify/calculator")
    args = parser.parse_args()

    evidence = drive(args.base_url, Path(args.out))
    print(json.dumps(evidence, indent=2))

    ok = (
        evidence["buttons"] == {"expression": "7*6", "result": "42"}
        and evidence["keyboard"] == {"expression": "2+3", "result": "5"}
        and evidence["division_by_zero"] == {"result": "division by zero"}
        and evidence["page_errors"] == []
    )
    print("verify: pass" if ok else "verify: FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
