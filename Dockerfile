FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install build tools for native modules
RUN apk add --no-cache python3 build-base

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
