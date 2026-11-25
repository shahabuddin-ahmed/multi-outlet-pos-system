# AGENTS.md · api

Rules for agents working in `apps/api`.

## Structure

Requests go **router → controller → service → repo → model**. Keep each layer to its job.

| Layer                | Does                                                                     | Never                                  |
| -------------------- | ------------------------------------------------------------------------ | -------------------------------------- |
| `src/web/router`     | Routes and middleware                                                    | Logic                                  |
| `src/web/controller` | Joi checks with `validateRequest`, then one service call, `sendResponse` | Database calls                         |
| `src/web/dto`        | Build the answer: one mapper per record, fields listed one by one        | Database calls                         |
| `src/service`        | Business logic, transactions                                             | Express objects (`req`, `res`)         |
| `src/repo`           | Run queries and return the result                                        | Business rules, try/catch              |
| `src/model`          | Sequelize table definitions                                              | Logic                                  |
| `src/constant`       | Enums, limits, error codes, messages                                     | Magic numbers or strings anywhere else |
| `src/infra`          | Database connection, migrations, seeders, logger                         | Business rules                         |

-   Errors: throw the exceptions in `src/web/exception` with a code from `ERROR_CODES`. Use try/catch only when the
    error leads to another action (a fallback, a retry), never just to log it.
-   Validation is strict: a field the Joi schema does not list is rejected.
-   A new setting goes in `src/config/config.ts` (checked with Joi at start-up), `.env.example` and the README.
-   Money is stored as integer minor units (paisa), never as a float.

## Ids

-   The integer `id` is internal. It is never sent to a client and never accepted from one.
-   A record the API shows has `public_id` (UUID). In JSON it is `id`; routes and bodies use it.
-   Controllers never send a model or repository record as it is: it goes through a mapper in `src/web/dto`.

## Database

-   Tables come from migrations in `src/infra/migrations` (raw SQL), never from `sequelize.sync()`.
-   **Never edit a migration that has already run.** Add a new file named `YYYYMMDDHHMMSS-what-it-does.ts` with both
    `up` and `down`.
-   Columns are `snake_case` in the database; models use `underscored: true`, so code uses camelCase.
-   Simple one-table records use a model. Joins and writes that must be safe under concurrency use SQL in the
    repository, with every value passed through `replacements`.
-   Records are switched off (`is_active`), never deleted; foreign keys are `ON DELETE RESTRICT`.
-   Rules that must always hold (no negative stock, one receipt number per outlet) belong in the database as
    `CHECK` and `UNIQUE` constraints, as well as in the service.
-   Do not run migrations on the dev database without approval. Tests use a database whose name ends with `_test`.

## Tests

| Command           | What                                                           |
| ----------------- | -------------------------------------------------------------- |
| `yarn lint`       | Type check + ESLint (run after every change)                   |
| `yarn test-unit`  | Unit tests, no database                                        |
| `yarn test-integ` | Integration tests; need PostgreSQL (`docker compose up db -d`) |

-   Tests live next to the code in `test/` folders: `*.unit.test.ts` and `*.integ.test.ts`.
-   Integration tests share one database, so they run with `--runInBand` (the scripts already do).

## Style

Prettier: 4 spaces, double quotes, 120 columns. Format only the files you change (`npx prettier --write <file>`),
never the whole repository.
