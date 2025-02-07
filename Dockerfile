FROM node:21-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .
RUN npm install

FROM node:21-alpine as builder
ARG BUILD_ENV=production
ARG NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
ENV NODE_ENV=${NODE_ENV}
RUN npm run build -- --mode ${BUILD_ENV}

FROM node:21-alpine
WORKDIR /app
COPY package.json package-lock.json .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
ENTRYPOINT [ "node", "build" ]

