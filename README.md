# Beauf.net - API

###### Quotes API powered by

<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" />     </a>
</p>

### Deployment


This project uses [Docker](https://www.docker.com/) to deploy.
There is a production ready `Dockerfile` on the project's root.
You just have to build the Docker image to deploy/run the API.
The API is set to use a **PostgreSQL** database **only**.

### Configuration

We are using the **environment** to configure the API.
You can find a `.env.example` at the project's root. The values defined are placeholders used for example purpose.
For a production deployments, these values must be set in the production environment.

### Documentation

The API documentation is accessible via an embedded [Swagger](https://swagger.io/).
It can be accessed via `[api_url]/swagger`.
Every routes are described there.

### Accessing the API

The default port of the API is `5000`, but this value can be changed in the `env`.

### Development

#### Usage

**For development purpose only**, we are using Docker compose.
Everything is embedded in the docker-compose (database, API, [Adminer](https://www.adminer.org/)).
To run the docker compose, use `docker-compose up --build`. We are using hot reload, so you don't have to restart the compose on each change.
The default port for [Adminer](https://www.adminer.org/) is `8080`.
The credentials for Adminer can be set in the env but the server will always be `db`.

To use the default values of the env, copy/paste the `.env.example` to a `.env` file, on the project's root.

#### Migrations

When you add a new `entity` to the project, you must use `yarn migrate` to generate a migration.

#### Architecture

This project is based on [service pattern](https://en.wikipedia.org/wiki/Service_layer_pattern), following [NestJS example](https://github.com/nestjs/nest/tree/master/sample/01-cats-app/).
