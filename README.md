# multi-outlet-pos-system

## Quick start

Needs Docker with Compose 2.24 or newer. On a fresh clone:

```bash
docker compose up --build
```

The API runs on `http://localhost:4000/api/v1` and the web app on `http://localhost:3000`. Demo data and the
[demo logins](#demo-data) are added to the empty database. To change a setting, copy `.env.example` to `.env` in
`apps/api` or `apps/web` (the example file has `SEED_DEMO_DATA=false`, so set `true` there to keep demo data). After
packages change, add `-V` to the command so the containers get the new ones.

## Retry safety

Making a sale and changing stock need an `Idempotency-Key` header holding a new UUID. Sending the same request with
the same key again does nothing twice: it answers `200` with the first result (`201` the first time). The same key
for a different request is refused with `409`, and another person's key with `403`.

## Database settings for hosting

| Setting                          | Default | Use                                                        |
| -------------------------------- | ------- | ---------------------------------------------------------- |
| `POSTGRES_SSL`                   | `false` | Encrypt the connection (most hosted databases need `true`) |
| `POSTGRES_SSL_VERIFY`            | `true`  | `false` only when the host's certificate cannot be checked |
| `DB_STATEMENT_TIMEOUT_MS`        | `15000` | Longest query of the API                                   |
| `DB_LOCK_TIMEOUT_MS`             | `10000` | Longest wait for a locked row                              |
| `DB_IDLE_TRANSACTION_TIMEOUT_MS` | `30000` | Longest pause inside a transaction                         |

`0` switches a time limit off, for connection poolers that refuse them. A request cut off by a limit gets `503` and
can be sent again. Migrations run without time limits, and the admin database is used only when the app database is
missing.

## Staff accounts

Accounts are created from the command line, in `apps/api` (there is no screen for it). Set `JWT_SECRET` in `.env`
first (see `.env.example`).

```bash
yarn user:create --email admin@example.com --name "Head Office" --role HQ_ADMIN
yarn user:create --email manager@example.com --name "Branch Manager" --role OUTLET_MANAGER --outlet-code DHK
yarn user:set-password --email manager@example.com
yarn user:deactivate --email manager@example.com
```

- Without `--password` a random password is made and shown once. A password typed in a command stays in the shell
  history, so the random one is safer.
- A manager or cashier needs `--outlet-code`; an HQ admin must not have one.
- Changing a password ends every earlier login of that person.
- In the production image use `yarn user:prod create ...`.

| Action                                   | HQ admin | Outlet manager | Cashier    |
| ---------------------------------------- | -------- | -------------- | ---------- |
| Outlets, menu items, assignments, prices | Yes      | No             | No         |
| See an outlet and its menu               | Any      | Own outlet     | Own outlet |
| See and change stock, see stock history  | Any      | Own outlet     | No         |
| Make a sale                              | No       | Own outlet     | Own outlet |
| See sales and receipts                   | All      | Own outlet     | Own sales  |
| Reports and low stock list               | Yes      | No             | No         |

## Demo data

For trying the system out: 3 outlets in Dhaka, 10 menu items, outlet prices, 14 days of sales, one item running low
and one sold out. In `apps/api`, on a migrated and empty database:

```bash
SEED_DEMO_DATA=true yarn demo:seed
```

The containers run this on start when `SEED_DEMO_DATA=true`. It adds nothing if the database already has outlets.
**These accounts have a public password: never switch this on for a real installation.**

| Account                                                                   | Role           |
| ------------------------------------------------------------------------- | -------------- |
| `hq@demo.test`                                                            | HQ admin       |
| `manager.dhk@demo.test`, `manager.gul@demo.test`, `manager.utt@demo.test` | Outlet manager |
| `cashier.dhk@demo.test`, `cashier.gul@demo.test`, `cashier.utt@demo.test` | Cashier        |

Password for all of them: `demo-pos-2026`

## Checks

GitHub Actions runs on every pull request: lint, format, tests on a real PostgreSQL, build, a security audit of the
shipped packages and the production image build. See `.github/workflows/ci.yml`.
