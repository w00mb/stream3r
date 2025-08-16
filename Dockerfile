# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install build tools for native modules
RUN apk add --no-cache python3 build-base

RUN npm install

COPY . .
RUN node server/init-db.js

# Stage 2: Runner
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Copy only production dependencies and application code from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/server ./server
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/index.html ./index.html
COPY --from=builder /usr/src/app/admin.html ./admin.html
COPY --from=builder /usr/src/app/styles.css ./styles.css
COPY --from=builder /usr/src/app/schema.sql ./schema.sql
COPY --from=builder /usr/src/app/site.db ./site.db

EXPOSE 3000

CMD [ "node", "server/app.js" ]
