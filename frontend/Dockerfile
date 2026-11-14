# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN --mount=type=cache,target=/root/.npm \
    npm ci --registry="$NPM_REGISTRY" --no-audit --no-fund \
    --fetch-retries=1 --fetch-retry-mintimeout=1000 \
    --fetch-retry-maxtimeout=3000 --fetch-timeout=20000 --loglevel=http

COPY index.html vite.config.js ./
COPY src ./src
COPY assets ./assets
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
