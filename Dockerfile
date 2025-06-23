FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install

COPY . .
RUN yarn run build

FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/dist/ ./
RUN yarn install

ENV NODE_ENV=production

ENTRYPOINT ["node","src/index.js"]
