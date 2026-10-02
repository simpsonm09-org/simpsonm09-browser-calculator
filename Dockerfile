FROM node:26-slim

ENV NODE_ENV=production

WORKDIR /app

RUN useradd --create-home --uid 10001 calculator

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY src ./src

USER calculator

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8000/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js", "--host", "0.0.0.0", "--port", "8000"]
