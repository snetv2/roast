FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE=/api
ARG APP_VERSION=dev
ARG APP_SHA=
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_APP_VERSION=$APP_VERSION
ENV VITE_APP_SHA=$APP_SHA
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine
LABEL org.opencontainers.image.source="https://github.com/snetv2/roast"
LABEL org.opencontainers.image.description="roast — React SPA + nginx proxy"
LABEL org.opencontainers.image.licenses="MIT"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
