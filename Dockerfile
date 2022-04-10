FROM node:17-alpine
WORKDIR /usr/src/app
ENV PREFIX docker
COPY package*.json ./
RUN apk add python make gcc g++
RUN npm ci
COPY bot.js .
USER node
ENTRYPOINT ["node", "bot.js"]
