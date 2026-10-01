from __future__ import annotations

from playwright.sync_api import Page, expect


def test_button_clicks_evaluate(page: Page, server_url: str) -> None:
    page.goto(server_url)
    for label in ["7", "*", "6"]:
        page.get_by_role("button", name=label, exact=True).click()
    expect(page.locator("#expression")).to_have_text("7*6")
    page.get_by_role("button", name="=", exact=True).click()
    expect(page.locator("#result")).to_have_text("42")


def test_keyboard_typing_evaluates(page: Page, server_url: str) -> None:
    page.goto(server_url)
    page.keyboard.type("2+3")
    expect(page.locator("#expression")).to_have_text("2+3")
    page.keyboard.press("Enter")
    expect(page.locator("#result")).to_have_text("5")


def test_power_key_inserts_double_star(page: Page, server_url: str) -> None:
    page.goto(server_url)
    page.keyboard.type("2^3")
    expect(page.locator("#expression")).to_have_text("2**3")
    page.keyboard.press("Enter")
    expect(page.locator("#result")).to_have_text("8")


def test_backspace_removes_the_last_character(page: Page, server_url: str) -> None:
    page.goto(server_url)
    page.keyboard.type("78")
    page.keyboard.press("Backspace")
    expect(page.locator("#expression")).to_have_text("7")


def test_escape_clears_the_display(page: Page, server_url: str) -> None:
    page.goto(server_url)
    page.keyboard.type("12")
    page.keyboard.press("Escape")
    expect(page.locator("#expression")).to_have_text("0")


def test_division_by_zero_shows_the_error(page: Page, server_url: str) -> None:
    page.goto(server_url)
    page.keyboard.type("1/0")
    page.keyboard.press("Enter")
    expect(page.locator("#result")).to_have_text("division by zero")


def test_no_page_errors_during_a_normal_flow(page: Page, server_url: str) -> None:
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(server_url)
    page.keyboard.type("9*9")
    page.keyboard.press("Enter")
    expect(page.locator("#result")).to_have_text("81")
    assert errors == []
