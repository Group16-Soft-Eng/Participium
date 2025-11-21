FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install all dependencies (including dev) and build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app and uploads if present
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/uploads ./uploads
COPY --from=builder /usr/src/app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh || true

EXPOSE 5000

ENTRYPOINT ["/bin/sh","-c","/usr/src/app/docker-entrypoint.sh && exec \"$@\""]
CMD ["node","dist/index.js"]
