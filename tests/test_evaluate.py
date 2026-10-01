from __future__ import annotations

import pytest

from browser_calculator import ExpressionError, evaluate


def test_addition() -> None:
    assert evaluate("2 + 3") == 5


def test_precedence() -> None:
    assert evaluate("2 + 3 * 4") == 14


def test_parentheses_override_precedence() -> None:
    assert evaluate("(2 + 3) * 4") == 20


def test_power_is_right_associative() -> None:
    assert evaluate("2 ** 3 ** 2") == 512


def test_unary_minus() -> None:
    assert evaluate("-5 + 2") == -3


def test_float_division() -> None:
    assert evaluate("7 / 2") == 3.5


def test_modulo() -> None:
    assert evaluate("7 % 3") == 1


def test_whitespace_is_ignored() -> None:
    assert evaluate("  10  ") == 10


@pytest.mark.parametrize("expression", ["", "   "])
def test_empty_expression_is_rejected(expression: str) -> None:
    with pytest.raises(ExpressionError):
        evaluate(expression)


def test_division_by_zero_is_rejected() -> None:
    with pytest.raises(ExpressionError, match="division by zero"):
        evaluate("1 / 0")


def test_syntax_error_is_rejected() -> None:
    with pytest.raises(ExpressionError):
        evaluate("2 +")


def test_name_is_rejected() -> None:
    with pytest.raises(ExpressionError):
        evaluate("__import__('os').system('echo hi')")


def test_attribute_access_is_rejected() -> None:
    with pytest.raises(ExpressionError):
        evaluate("(1).__class__")


def test_call_is_rejected() -> None:
    with pytest.raises(ExpressionError):
        evaluate("abs(-1)")


def test_overflow_is_rejected() -> None:
    with pytest.raises(ExpressionError, match="out of range"):
        evaluate("9 ** 9 ** 9")


def test_negative_base_fractional_power_is_rejected() -> None:
    with pytest.raises(ExpressionError, match="not a real number"):
        evaluate("(-1) ** 0.5")


def test_complex_constant_is_rejected() -> None:
    with pytest.raises(ExpressionError):
        evaluate("1j")


def test_overlong_expression_is_rejected() -> None:
    with pytest.raises(ExpressionError, match="too long"):
        evaluate("1 + " * 100 + "1")
