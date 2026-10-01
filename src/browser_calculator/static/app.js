"use strict";

const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const keypadEl = document.getElementById("keypad");

const OPERAND_START = /^[0-9.(]$/;
const TYPED_KEYS = new Set("0123456789.+-*/%()".split(""));
const REQUEST_TIMEOUT_MS = 8000;

let expression = "";
let lastResult = "";
let evaluated = false;
let inFlight = false;

function render() {
  expressionEl.textContent = expression === "" ? "0" : expression;
}

function show(message, isError) {
  resultEl.textContent = message;
  resultEl.classList.toggle("display__result--error", isError === true);
}

function insert(token) {
  // A result is a dead end for digits, but an operator should chain from it.
  if (evaluated) {
    expression = OPERAND_START.test(token) ? "" : lastResult;
    evaluated = false;
  }
  expression += token;
  render();
  show("");
}

function clearAll() {
  expression = "";
  lastResult = "";
  evaluated = false;
  render();
  show("");
}

function backspace() {
  expression = expression.slice(0, -1);
  evaluated = false;
  render();
  show("");
}

async function describeFailure(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const detail = payload !== null && typeof payload === "object" ? payload.detail : undefined;
  if (typeof detail === "string" && detail !== "") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first !== null && typeof first === "object" && typeof first.msg === "string") {
      return first.msg;
    }
  }
  return "Request failed (HTTP " + response.status + ")";
}

async function evaluate() {
  // Enter activates a focused key and also reaches the keydown handler, so the
  // in-flight flag is what keeps a second submit harmless.
  if (inFlight) {
    return;
  }
  const submitted = expression.trim();
  if (submitted === "") {
    show("Enter an expression", true);
    return;
  }

  inFlight = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  show("\u2026", false);
  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression: submitted }),
      signal: controller.signal,
    });

    if (expression.trim() !== submitted) {
      show("", false);
      return;
    }

    if (!response.ok) {
      show(await describeFailure(response), true);
      return;
    }

    const payload = await response.json();
    if (payload === null || typeof payload !== "object" || typeof payload.result !== "number") {
      show("The server returned an unexpected result", true);
      return;
    }
    lastResult = String(payload.result);
    evaluated = true;
    show(lastResult, false);
  } catch (error) {
    const timedOut = error !== null && error.name === "AbortError";
    show(timedOut ? "The server took too long" : "Could not reach the server", true);
  } finally {
    clearTimeout(timer);
    inFlight = false;
  }
}

keypadEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-insert], button[data-action]");
  if (button === null) {
    return;
  }
  const token = button.dataset.insert;
  if (typeof token === "string" && token !== "") {
    insert(token);
    return;
  }
  switch (button.dataset.action) {
    case "clear":
      clearAll();
      break;
    case "backspace":
      backspace();
      break;
    case "equals":
      evaluate();
      break;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    if (!event.repeat) {
      evaluate();
    }
    return;
  }
  if (event.key === "Backspace") {
    event.preventDefault();
    backspace();
    return;
  }
  if (event.key === "Escape") {
    clearAll();
    return;
  }
  if (event.key === "^") {
    event.preventDefault();
    insert("**");
    return;
  }
  if (TYPED_KEYS.has(event.key)) {
    event.preventDefault();
    insert(event.key);
  }
});

render();
