# ---- Dependencies ----
FROM node:17-alpine AS dependencies

WORKDIR /app

COPY yarn.lock ./

COPY *.json ./

RUN yarn install &&\
	yarn cache clean

# ---- Copy Files/Build ----
FROM node:17-alpine AS build

WORKDIR /app

COPY src /app

RUN yarn build

# --- Release with Alpine ----
FROM node:16-alpine AS release

WORKDIR /app

COPY --from=dependencies /app/package.json ./

RUN yarn install --prod &&\
	yarn cache clean

COPY --from=build /app ./

EXPOSE 5000

ENTRYPOINT ["yarn", "run", "start"]