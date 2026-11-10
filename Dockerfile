FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV DATABASE_URL=file:/data/clinivet.db
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN npm run db:generate && npm run build \
    && mkdir -p /data \
    && chown -R node:node /data /app/.next

USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run db:setup && npm run start"]
