import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

let app;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("GET /", () => {
  it("serves the page", async () => {
    const response = await app.inject({ method: "GET", url: "/" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain('id="expression"');
    expect(response.body).toContain('id="contact-form"');
  });
});

describe("GET /healthz", () => {
  it("reports ok", async () => {
    const response = await app.inject({ method: "GET", url: "/healthz" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});

describe("static assets", () => {
  it("serves the stylesheet and the script", async () => {
    const css = await app.inject({ method: "GET", url: "/style.css" });
    const js = await app.inject({ method: "GET", url: "/app.js" });
    expect(css.statusCode).toBe(200);
    expect(css.headers["content-type"]).toContain("css");
    expect(js.statusCode).toBe(200);
    expect(js.headers["content-type"]).toContain("javascript");
  });
});

describe("POST /api/evaluate", () => {
  it("returns the result", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/evaluate",
      payload: { expression: "6 * 7" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ expression: "6 * 7", result: 42 });
  });

  it("returns a float result", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/evaluate",
      payload: { expression: "7 / 2" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ expression: "7 / 2", result: 3.5 });
  });

  it.each([
    ["1 / 0", "division by zero"],
    ["2 +", "expression is not valid syntax"],
    ["abs(-1)", "expression is not valid syntax"],
    ["(-1) ** 0.5", "result is not a real number"],
    ["9 ** 9 ** 9", "result is out of range"],
  ])("rejects %j with 400 and a detail", async (expression, detail) => {
    const response = await app.inject({
      method: "POST",
      url: "/api/evaluate",
      payload: { expression },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toBe(detail);
  });

  it("rejects an empty expression", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/evaluate",
      payload: { expression: "" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects an overlong expression", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/evaluate",
      payload: { expression: `${"1 + ".repeat(100)}1` },
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects a missing expression", async () => {
    const response = await app.inject({ method: "POST", url: "/api/evaluate", payload: {} });
    expect(response.statusCode).toBe(400);
  });

  it("rejects an injection attempt instead of running it", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/evaluate",
      payload: { expression: "__import__('os').system('echo hi')" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().detail).toBe("expression is not valid syntax");
  });
});

describe("POST /api/tools/form", () => {
  it("validates and acknowledges a submission", async () => {
    const payload = {
      name: "Ada",
      email: "ada@example.com",
      message: "Hello there",
    };
    const response = await app.inject({ method: "POST", url: "/api/tools/form", payload });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe(payload.name);
    expect(body.email).toBe(payload.email);
    expect(body.message).toBe(payload.message);
    expect(body.acknowledged).toBe(true);
    expect(Number.isNaN(Date.parse(body.receivedAt))).toBe(false);
  });

  it("is stateless across submissions", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/api/tools/form",
      payload: { name: "A", email: "a@example.com", message: "one" },
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/tools/form",
      payload: { name: "B", email: "b@example.com", message: "two" },
    });
    expect(first.json().name).toBe("A");
    expect(second.json().name).toBe("B");
  });

  it.each([
    [{ name: "Ada", email: "not-an-email", message: "Hi" }],
    [{ name: "", email: "ada@example.com", message: "Hi" }],
    [{ name: "Ada", email: "ada@example.com", message: "" }],
    [{ name: "Ada", email: "ada@example.com" }],
    [{}],
  ])("rejects the invalid payload %j", async (payload) => {
    const response = await app.inject({ method: "POST", url: "/api/tools/form", payload });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /openapi.json", () => {
  it("serves a generated document that lists the endpoints", async () => {
    const response = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(response.statusCode).toBe(200);
    const document = response.json();
    expect(document.openapi).toBeTruthy();
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining(["/api/evaluate", "/api/tools/form", "/healthz"]),
    );
  });
});
