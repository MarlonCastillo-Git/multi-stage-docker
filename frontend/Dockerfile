# syntax=docker/dockerfile:1.7
FROM node:24-alpine@sha256:a34ab6d7f6f4813f4d0c5469d74685604b962fbdbf5793a7bc7b4998ecb867c8 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS tooling
RUN npm install --global pnpm@12.3.4

FROM tooling AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --store-dir=/pnpm/store

FROM dependencies AS build
COPY . .
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RUN pnpm build && rm -rf .next/cache

FROM tooling AS production-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --prod --frozen-lockfile --store-dir=/pnpm/store \
    && find node_modules -type f -name "*.map" -delete

FROM base AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/package.json /app/next.config.mjs ./
USER node
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
