FROM node:24-alpine AS dev

ENV NODE_ENV=development \
    PORT=3000 \
    UPDATE_INTERVAL_MS=1000 \
    OMM_FILE=/app/apps/api/data/omm.sample.json

WORKDIR /app

RUN chown node:node /app

USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node apps/api/package.json ./apps/api/package.json
COPY --chown=node:node apps/frontend/package.json ./apps/frontend/package.json
COPY --chown=node:node packages/db/package.json ./packages/db/package.json
RUN npm ci

COPY --chown=node:node apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY --chown=node:node apps/api/src ./apps/api/src
COPY --chown=node:node apps/api/data ./apps/api/data
COPY --chown=node:node apps/frontend ./apps/frontend
COPY --chown=node:node packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --chown=node:node packages/db/prisma ./packages/db/prisma
RUN npm run db:generate

EXPOSE 3000 5173

CMD ["sh"]

FROM dev AS build

ARG VITE_API_URL=http://localhost:3000
ARG VITE_CESIUM_ION_ACCESS_TOKEN=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CESIUM_ION_ACCESS_TOKEN=$VITE_CESIUM_ION_ACCESS_TOKEN

RUN npm run build

FROM node:24-alpine AS api-runtime

ENV NODE_ENV=production \
    PORT=3000 \
    UPDATE_INTERVAL_MS=1000 \
    OMM_FILE=/app/apps/api/data/omm.sample.json

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/db/package.json ./packages/db/package.json
RUN npm ci --omit=dev --workspace apps/api && npm cache clean --force

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY apps/api/data ./apps/api/data

USER node

EXPOSE 3000

CMD ["npm", "--workspace", "apps/api", "start"]

FROM node:24-alpine AS frontend-runtime

ENV NODE_ENV=production \
    PORT=5173

WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci --omit=dev --workspace apps/frontend && npm cache clean --force

COPY --from=build /app/apps/frontend/dist ./apps/frontend/dist

USER node

EXPOSE 5173

WORKDIR /app/apps/frontend

CMD ["npm", "run", "start"]
