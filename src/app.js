// The Fastify application that serves the calculator.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import Fastify from "fastify";
import {
  ExpressionError,
  evaluate,
  MAX_EXPRESSION_LENGTH,
} from "./evaluator.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(HERE, "..", "public");

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Browser Calculator API",
    description:
      "Evaluate a single arithmetic expression and accept one form submission.",
    version: "0.1.0",
  },
  tags: [
    { name: "calculator", description: "Evaluate arithmetic." },
    { name: "tools", description: "Small stateless utilities." },
    { name: "health", description: "Liveness." },
  ],
};

const evaluateBody = {
  type: "object",
  required: ["expression"],
  additionalProperties: false,
  properties: {
    expression: {
      type: "string",
      minLength: 1,
      maxLength: MAX_EXPRESSION_LENGTH,
    },
  },
};

const evaluateResponse = {
  type: "object",
  required: ["expression", "result"],
  properties: {
    expression: { type: "string" },
    result: { type: "number" },
  },
};

const formBody = {
  type: "object",
  required: ["name", "email", "message"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 100 },
    email: {
      type: "string",
      minLength: 3,
      maxLength: 254,
      pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
    },
    message: { type: "string", minLength: 1, maxLength: 1000 },
  },
};

const formResponse = {
  type: "object",
  required: ["name", "email", "message", "acknowledged", "receivedAt"],
  properties: {
    name: { type: "string" },
    email: { type: "string" },
    message: { type: "string" },
    acknowledged: { type: "boolean" },
    receivedAt: { type: "string", format: "date-time" },
  },
};

export async function buildApp(options = {}) {
  const app = Fastify({ logger: options.logger ?? false });

  // The swagger plugin must finish loading before the routes are registered,
  // or its onRoute hook misses them and the document comes out empty.
  await app.register(fastifySwagger, { openapi: openApiDocument });
  await app.register(fastifyStatic, { root: PUBLIC_DIR, index: false });

  registerPage(app);
  registerHealth(app);
  registerEvaluate(app);
  registerForm(app);
  registerOpenApi(app);

  return app;
}

function registerPage(app) {
  app.get("/", { schema: { hide: true } }, (request, reply) =>
    reply.sendFile("index.html"),
  );
}

function registerHealth(app) {
  app.get(
    "/healthz",
    {
      schema: {
        tags: ["health"],
        summary: "Report that the service is up.",
        operationId: "health",
        response: {
          200: {
            type: "object",
            required: ["status"],
            properties: { status: { type: "string" } },
          },
        },
      },
    },
    async () => ({ status: "ok" }),
  );
}

function registerEvaluate(app) {
  app.post(
    "/api/evaluate",
    {
      schema: {
        tags: ["calculator"],
        summary: "Evaluate an arithmetic expression.",
        operationId: "evaluateExpression",
        body: evaluateBody,
        response: {
          200: evaluateResponse,
          400: {
            type: "object",
            properties: { detail: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = evaluate(request.body.expression);
        return { expression: request.body.expression, result };
      } catch (error) {
        if (error instanceof ExpressionError) {
          return reply.code(400).send({ detail: error.message });
        }
        throw error;
      }
    },
  );
}

function registerForm(app) {
  app.post(
    "/api/tools/form",
    {
      schema: {
        tags: ["tools"],
        summary: "Validate a contact form submission and acknowledge it.",
        operationId: "submitForm",
        body: formBody,
        response: { 200: formResponse },
      },
    },
    async (request) => {
      const { name, email, message } = request.body;
      return {
        name,
        email,
        message,
        acknowledged: true,
        receivedAt: new Date().toISOString(),
      };
    },
  );
}

function registerOpenApi(app) {
  app.get("/openapi.json", { schema: { hide: true } }, async () =>
    app.swagger(),
  );
}
