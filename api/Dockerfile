FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
LABEL org.opencontainers.image.source="https://github.com/snetv2/roast"
LABEL org.opencontainers.image.description="roast — Express API"
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/migrations ./dist/migrations
RUN mkdir -p /data/logos
EXPOSE 3000
CMD ["node", "dist/index.js"]
