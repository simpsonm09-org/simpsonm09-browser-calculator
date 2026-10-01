"""A small, safe arithmetic evaluator for the browser calculator.

The evaluator parses an expression with :mod:`ast` and walks the tree through a
dispatch table. Every node type outside the table is rejected, so an expression
can never call a function, read a name, or touch an attribute.
"""

from __future__ import annotations

import ast
import math
import operator
from collections.abc import Callable

__all__ = ["MAX_EXPRESSION_LENGTH", "ExpressionError", "evaluate"]

MAX_EXPRESSION_LENGTH = 200

_BINARY_OPS: dict[type[ast.operator], Callable[[float, float], float]] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}

_UNARY_OPS: dict[type[ast.unaryop], Callable[[float], float]] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


class ExpressionError(ValueError):
    """Raised when an expression is empty, malformed, or not supported."""


def _eval(node: ast.AST) -> float:
    match node:
        case ast.Expression(body=body):
            return _eval(body)
        case ast.Constant(value=value) if isinstance(value, int | float) and not isinstance(
            value, bool
        ):
            return float(value)
        case ast.BinOp(left=left, op=op, right=right) if handler := _BINARY_OPS.get(type(op)):
            return handler(_eval(left), _eval(right))
        case ast.UnaryOp(op=op, operand=operand) if handler := _UNARY_OPS.get(type(op)):
            return handler(_eval(operand))
        case _:
            raise ExpressionError(f"unsupported expression: {type(node).__name__}")


def evaluate(expression: str) -> float:
    """Return the numeric value of ``expression``.

    Raise :class:`ExpressionError` for anything that is not plain arithmetic on
    numbers, including a syntax error, an unknown node, or a division by zero.
    """
    if not isinstance(expression, str):
        raise ExpressionError("expression must be text")
    text = expression.strip()
    if not text:
        raise ExpressionError("expression is empty")
    if len(text) > MAX_EXPRESSION_LENGTH:
        raise ExpressionError("expression is too long")

    try:
        tree = ast.parse(text, mode="eval")
    except SyntaxError as error:
        raise ExpressionError("expression is not valid syntax") from error
    except (RecursionError, ValueError) as error:
        raise ExpressionError("expression is too complex") from error

    try:
        result = _eval(tree)
    except ZeroDivisionError as error:
        raise ExpressionError("division by zero") from error
    except (OverflowError, RecursionError) as error:
        raise ExpressionError("result is out of range") from error

    if isinstance(result, complex):
        raise ExpressionError("result is not a real number")
    if math.isnan(result) or math.isinf(result):
        raise ExpressionError("result is out of range")
    return result
