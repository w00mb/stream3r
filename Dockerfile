# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install build tools for native modules
RUN apk add --no-cache python3 build-base

RUN npm install

COPY src ./src
COPY public ./public
RUN node src/backend/db/init.js

# Stage 2: Runner
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Copy only production dependencies and application code from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/src/backend ./src/backend
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/src/frontend/main/index.html ./src/frontend/main/index.html
COPY --from=builder /usr/src/app/src/frontend/admin/index.html ./src/frontend/admin/index.html
COPY --from=builder /usr/src/app/public/css/styles.css ./public/css/styles.css
COPY --from=builder /usr/src/app/src/backend/db/schema.sql ./src/backend/db/schema.sql
COPY --from=builder /usr/src/app/site.db ./site.db

EXPOSE 3000

CMD [ "node", "src/backend/app.js" ]
