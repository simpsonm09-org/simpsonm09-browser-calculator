import { describe, expect, it } from "vitest";
import {
  ExpressionError,
  evaluate,
  MAX_EXPRESSION_LENGTH,
} from "../src/evaluator.js";

describe("evaluate", () => {
  it("adds", () => {
    expect(evaluate("2 + 3")).toBe(5);
  });

  it("respects precedence", () => {
    expect(evaluate("2 + 3 * 4")).toBe(14);
  });

  it("lets parentheses override precedence", () => {
    expect(evaluate("(2 + 3) * 4")).toBe(20);
  });

  it("makes power right associative", () => {
    expect(evaluate("2 ** 3 ** 2")).toBe(512);
  });

  it("binds power tighter than unary minus", () => {
    expect(evaluate("-2 ** 2")).toBe(-4);
  });

  it("accepts unary minus", () => {
    expect(evaluate("-5 + 2")).toBe(-3);
  });

  it("accepts a unary minus in the exponent", () => {
    expect(evaluate("2 ** -1")).toBe(0.5);
  });

  it("divides to a float", () => {
    expect(evaluate("7 / 2")).toBe(3.5);
  });

  it("takes a Python-floored modulo", () => {
    expect(evaluate("7 % 3")).toBe(1);
    expect(evaluate("-7 % 3")).toBe(2);
  });

  it("ignores whitespace", () => {
    expect(evaluate("  10  ")).toBe(10);
  });

  it.each(["", "   "])("rejects the empty expression %j", (expression) => {
    expect(() => evaluate(expression)).toThrow(ExpressionError);
  });

  it("rejects division by zero", () => {
    expect(() => evaluate("1 / 0")).toThrowError("division by zero");
    expect(() => evaluate("1 % 0")).toThrowError("division by zero");
  });

  it("rejects malformed syntax", () => {
    expect(() => evaluate("2 +")).toThrow(ExpressionError);
    expect(() => evaluate("2 ** ")).toThrow(ExpressionError);
    expect(() => evaluate("()")).toThrow(ExpressionError);
    expect(() => evaluate("1 2")).toThrow(ExpressionError);
  });

  it("rejects a non-real result", () => {
    expect(() => evaluate("(-1) ** 0.5")).toThrowError(
      "result is not a real number",
    );
  });

  it("rejects an out-of-range result", () => {
    expect(() => evaluate("9 ** 9 ** 9")).toThrowError(
      "result is out of range",
    );
  });

  it("rejects an overlong expression", () => {
    const expression = `${"1 + ".repeat(100)}1`;
    expect(expression.length).toBeGreaterThan(MAX_EXPRESSION_LENGTH);
    expect(() => evaluate(expression)).toThrowError("expression is too long");
  });

  it("rejects a non-string input", () => {
    expect(() => evaluate(42)).toThrow(ExpressionError);
  });
});

describe("evaluate refuses to run code", () => {
  const injections = [
    "__import__('os').system('echo hi')",
    "process.exit(1)",
    "require('node:fs')",
    "globalThis.process.pid",
    "[].constructor",
    "this.constructor.constructor('return 1')()",
    "(() => 1)()",
    "1; process.exit(1)",
    "1, 2",
    "name",
    "(1).__proto__",
    "`${1}`",
    'alert("x")',
  ];

  it.each(injections)("rejects %j", (attack) => {
    expect(() => evaluate(attack)).toThrow(ExpressionError);
  });

  it("still evaluates a benign expression after a rejected attack", () => {
    expect(() => evaluate("1 + 1")).not.toThrow();
    expect(evaluate("1 + 1")).toBe(2);
  });
});
