FROM node:18 as builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build


FROM node:18

ENV NODE_ENV production
USER node

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=builder --chown=node:node /usr/src/app/dist ./dist

EXPOSE 3333
VOLUME "/services.yaml"
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "curl", "--fail", "http://localhost:3333/hass-proxy/health" ]

CMD [ "node", "./dist/server.js"]
