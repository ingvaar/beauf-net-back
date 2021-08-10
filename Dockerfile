FROM node:15-alpine

WORKDIR /usr/src/app

COPY package.json ./

RUN yarn install

COPY . .

EXPOSE 5000

ENTRYPOINT yarn run start:dev
