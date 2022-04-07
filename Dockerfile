# ---- Base Node ----

FROM node:17-alpine AS base

WORKDIR /app

# ---- Dependencies ----
FROM base AS dependencies

COPY yarn.lock ./

COPY *.json ./

RUN yarn install &&\
	yarn cache clean

# ---- Copy Files/Build ----
FROM dependencies AS build

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