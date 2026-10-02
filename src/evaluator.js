// A small, safe arithmetic evaluator for the browser calculator.
//
// The evaluator tokenizes an expression and parses it with recursive descent.
// Only number literals, the binary operators + - * / % **, parentheses, and
// unary + and - are accepted. Any other character or shape is rejected before
// it can run, so an expression can never call a function, read a name, or touch
// the host.

export const MAX_EXPRESSION_LENGTH = 200;

export class ExpressionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ExpressionError";
  }
}

const NUMBER = /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
const BINARY = new Set(["+", "-", "*", "/", "%", "**"]);

function tokenize(text) {
  const tokens = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      index += 1;
      continue;
    }
    if (char === "*" && text[index + 1] === "*") {
      tokens.push({ type: "operator", value: "**" });
      index += 2;
      continue;
    }
    if (BINARY.has(char) || char === "(" || char === ")") {
      tokens.push({
        type: char === "(" || char === ")" ? "paren" : "operator",
        value: char,
      });
      index += 1;
      continue;
    }
    if (char === "." || (char >= "0" && char <= "9")) {
      NUMBER.lastIndex = index;
      const match = NUMBER.exec(text);
      if (match === null) {
        throw new ExpressionError("expression is not valid syntax");
      }
      tokens.push({ type: "number", value: Number(match[0]) });
      index = NUMBER.lastIndex;
      continue;
    }
    throw new ExpressionError("expression is not valid syntax");
  }
  return tokens;
}

// Python's % is floored (the result takes the sign of the divisor), while the
// JavaScript operator truncates. Match Python so the port is faithful.
function modulo(left, right) {
  if (right === 0) {
    throw new ExpressionError("division by zero");
  }
  const remainder = left % right;
  if (remainder !== 0 && remainder < 0 !== right < 0) {
    return remainder + right;
  }
  return remainder;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  atEnd() {
    return this.position >= this.tokens.length;
  }

  peek() {
    return this.atEnd() ? null : this.tokens[this.position];
  }

  parseExpression() {
    return this.parseAdditive();
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    let token = this.peek();
    while (
      token !== null &&
      token.type === "operator" &&
      (token.value === "+" || token.value === "-")
    ) {
      this.position += 1;
      const right = this.parseMultiplicative();
      left = token.value === "+" ? left + right : left - right;
      token = this.peek();
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    let token = this.peek();
    while (
      token !== null &&
      token.type === "operator" &&
      "+-".indexOf(token.value) === -1
    ) {
      this.position += 1;
      const right = this.parseUnary();
      if (token.value === "*") {
        left = left * right;
      } else if (token.value === "/") {
        if (right === 0) {
          throw new ExpressionError("division by zero");
        }
        left = left / right;
      } else {
        left = modulo(left, right);
      }
      token = this.peek();
    }
    return left;
  }

  parseUnary() {
    const token = this.peek();
    if (
      token !== null &&
      token.type === "operator" &&
      (token.value === "+" || token.value === "-")
    ) {
      this.position += 1;
      const operand = this.parseUnary();
      return token.value === "-" ? -operand : operand;
    }
    return this.parsePower();
  }

  // Python's ** is right associative and binds tighter than unary minus, so
  // `-2 ** 2` is -4 while `2 ** 3 ** 2` is 512.
  parsePower() {
    const base = this.parsePrimary();
    const token = this.peek();
    if (token !== null && token.type === "operator" && token.value === "**") {
      this.position += 1;
      return base ** this.parseUnary();
    }
    return base;
  }

  parsePrimary() {
    const token = this.peek();
    if (token === null) {
      throw new ExpressionError("expression is not valid syntax");
    }
    if (token.type === "number") {
      this.position += 1;
      return token.value;
    }
    if (token.type === "paren" && token.value === "(") {
      this.position += 1;
      const value = this.parseExpression();
      const closing = this.peek();
      if (
        closing === null ||
        closing.type !== "paren" ||
        closing.value !== ")"
      ) {
        throw new ExpressionError("expression is not valid syntax");
      }
      this.position += 1;
      return value;
    }
    throw new ExpressionError("expression is not valid syntax");
  }
}

// Return the numeric value of `expression`.
//
// Throw an ExpressionError for anything that is not plain arithmetic on
// numbers, including a syntax error, an unknown token, or a division by zero.
export function evaluate(expression) {
  if (typeof expression !== "string") {
    throw new ExpressionError("expression must be text");
  }
  const text = expression.trim();
  if (text === "") {
    throw new ExpressionError("expression is empty");
  }
  if (text.length > MAX_EXPRESSION_LENGTH) {
    throw new ExpressionError("expression is too long");
  }

  const parser = new Parser(tokenize(text));
  const result = parser.parseExpression();
  if (!parser.atEnd()) {
    throw new ExpressionError("expression is not valid syntax");
  }

  if (typeof result !== "number" || Number.isNaN(result)) {
    throw new ExpressionError("result is not a real number");
  }
  if (!Number.isFinite(result)) {
    throw new ExpressionError("result is out of range");
  }
  return result;
}
