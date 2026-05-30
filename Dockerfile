FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
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
