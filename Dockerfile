FROM node:24-alpine AS dev

ENV NODE_ENV=development \
    PORT=3000 \
    UPDATE_INTERVAL_MS=1000 \
    OMM_FILE=/app/data/omm.sample.json

WORKDIR /app

RUN chown node:node /app

USER node

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node data ./data

EXPOSE 3000

CMD ["sh"]

FROM dev AS build

RUN npm run build

FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    UPDATE_INTERVAL_MS=1000 \
    OMM_FILE=/app/data/omm.sample.json

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY data ./data

USER node

EXPOSE 3000

CMD ["npm", "start"]
