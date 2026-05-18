# Multi-stage build for a lean production image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=builder /app/dist ./dist
# Keep src + ts-node in case we want to run the seed inside the container
COPY --from=builder /app/src ./src
COPY tsconfig.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
