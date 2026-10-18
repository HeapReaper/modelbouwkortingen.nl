# Website (Next.js) — multi-stage build met standalone output.
# Bouwen:  docker build -t modelbouwkortingen-web .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Bij het bouwen is geen database nodig: alle data wordt per request opgehaald.
RUN npm run build

# Prisma-migraties (draait als eenmalige `migrate` service in docker-compose). Alleen de
# Prisma-CLI in de versie uit package-lock.json, niet alle dependencies van de website.
FROM node:22-alpine AS migrate
WORKDIR /app
COPY package-lock.json /tmp/package-lock.json
RUN v() { node -p "require('/tmp/package-lock.json').packages['node_modules/$1'].version"; } \
 && echo '{"private":true}' > package.json \
 && npm install --no-audit --no-fund "prisma@$(v prisma)" "dotenv@$(v dotenv)" \
 && npm cache clean --force && rm /tmp/package-lock.json
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY scripts/migrate.sh ./scripts/migrate.sh
CMD ["sh", "scripts/migrate.sh"]

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]

# CI: de build is al buiten de image gemaakt en klaargezet in dist/web
# (standalone + .next/static + public, zie .forgejo/workflows/images.yml).
FROM runtime AS runner-prebuilt
COPY --chown=nextjs:nodejs dist/web ./

FROM runtime AS runner
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
