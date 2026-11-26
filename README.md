# Multi-Outlet POS

One company with a head office (HQ) and many food outlets. HQ manages the menu and prices, each outlet sells and
keeps its own stock, and HQ sees the reports.

**Architecture document:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (ERD, scaling plan, microservices, offline POS
and kitchen display).

## Live demo

**App:** https://multi-outlet-pos-system.vercel.app

**API health check:** https://multi-outlet-pos-api.onrender.com/api/v1/health

Sign in with one of the demo account buttons, then follow the [demo walkthrough](#demo-walkthrough). The accounts are
listed under [Demo data](#demo-data).

-   **First visit:** the API runs on a free plan that sleeps after 15 minutes without visitors. A sign-in may answer
    "Could not reach the POS API." while it wakes up: wait about a minute and sign in again.
-   **Shared data:** all visitors use the same demo data, so amounts can differ. If SKU `DR-100` already exists, use
    another SKU in the walkthrough.

Hosted on Vercel (web, `apps/web`), Render (API, built from `apps/api/Dockerfile`) and Neon (PostgreSQL).

## Contents

-   [Live demo](#live-demo)
-   [What it does](#what-it-does)
-   [Quick start](#quick-start)
-   [Run without Docker](#run-without-docker)
-   [Demo data](#demo-data)
-   [Staff accounts and roles](#staff-accounts-and-roles)
-   [Settings](#settings)
-   [Production run](#production-run)
-   [API endpoints](#api-endpoints)
-   [Database schema](#database-schema)
-   [Architecture](#architecture)
-   [Scaling strategy](#scaling-strategy)
-   [Tests and checks](#tests-and-checks)
-   [Not built](#not-built)

## What it does

| Need                      | How it works                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Master menu               | HQ creates and edits items. Items and outlets are switched off, never deleted              |
| Assign items to outlets   | HQ picks what each outlet sells                                                            |
| Price per outlet          | An outlet price replaces the master price; without one the outlet follows the master price |
| Outlet menu               | An outlet gets only the items assigned to it that are switched on                          |
| Stock per outlet          | Restock, waste and count corrections, with a history of every change                       |
| No negative stock         | Checked in the same statement that changes the stock, and by a database constraint         |
| Sale with many items      | One database transaction: stock, receipt number and sale are saved together or not at all  |
| Receipt number per outlet | 1, 2, 3 ... with no gaps and no repeats, also when many sales arrive at once               |
| No double charge          | A sale sent again with the same key returns the first receipt                              |
| Reports                   | Revenue and top 5 items per outlet, for all time or chosen days, and a low stock list      |

Money is stored as whole paisa, VAT is added on the subtotal, and report days follow the business time zone
(`Asia/Dhaka` by default).

## Tech stack

| Part     | Used                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| API      | Node.js 24, Express 4, TypeScript, PostgreSQL 16, Sequelize 6 with raw SQL, Joi, JWT  |
| Web      | React 19 with Next.js 16 (screens only, all rules live in the API), Tailwind 4, Redux |
| Delivery | Docker, Docker Compose, GitHub Actions                                                |

```text
apps/api   Express API          (routes, controllers, services, repositories)
apps/web   React screens        (HQ pages and the outlet till)
docs       Architecture document
```

## Quick start

Needs Docker with Compose 2.24 or newer. On a fresh clone:

```bash
docker compose up --build
```

| Open                  | Address                               |
| --------------------- | ------------------------------------- |
| Web app               | `http://localhost:3000`               |
| API                   | `http://localhost:4000/api/v1`        |
| API health            | `http://localhost:4000/api/v1/health` |
| pgAdmin (database UI) | `http://localhost:8080`               |

The database is created, migrated and filled with [demo data](#demo-data). Pick a demo account on the login page, then
follow the [demo walkthrough](#demo-walkthrough).

To change a setting, copy `.env.example` to `.env` in `apps/api` or `apps/web`. The example files switch the demo off:
set `SEED_DEMO_DATA=true` for the API and `NEXT_PUBLIC_DEMO_PASSWORD` for the web app to keep it. After packages
change, add `-V` to the command so the containers get the new ones.

## Run without Docker

Needs Node.js 24, Yarn 1 and a running PostgreSQL 16. Set the `POSTGRES_*` values in `apps/api/.env` to match it.

API:

```bash
cd apps/api
yarn install
cp .env.example .env
yarn db:migrate
SEED_DEMO_DATA=true yarn demo:seed
yarn dev
```

Web, in a second terminal:

```bash
cd apps/web
yarn install
cp .env.example .env
yarn dev
```

`yarn db:migrate` creates the database when it is missing. `yarn db:migrate:status` shows what has run. To list the
demo accounts on the login page, set `NEXT_PUBLIC_DEMO_PASSWORD=demo-pos-2026` in `apps/web/.env`.

## Demo data

3 outlets in Dhaka, 10 menu items, a few outlet prices, one item switched off at one outlet, 14 days of sales, one
item running low and one sold out. It is added only when `SEED_DEMO_DATA=true`, and only to a database without
outlets.

| Account                                                                   | Role           |
| ------------------------------------------------------------------------- | -------------- |
| `hq@demo.test`                                                            | HQ admin       |
| `manager.dhk@demo.test`, `manager.gul@demo.test`, `manager.utt@demo.test` | Outlet manager |
| `cashier.dhk@demo.test`, `cashier.gul@demo.test`, `cashier.utt@demo.test` | Cashier        |

Password for all of them: `demo-pos-2026`

**These accounts have a public password: never switch this on for a real installation.**

### Demo walkthrough

One item from the head office menu to the reports, with the demo data and its 5% VAT. To switch accounts, use **Sign
out** in the account menu at the top right.

| Step | Sign in as          | Do this                                                                                                   | You should see                                                                      |
| ---- | ------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1    | HQ admin            | **Reports**: note the Dhanmondi row                                                                       | Its sales count and amounts before the new sale                                     |
| 2    | HQ admin            | **Menu items** > **New item**: SKU `DR-100`, name `Mango Lassi`, base price `150`                         | The item in the master menu                                                         |
| 3    | HQ admin            | **Assign menu** > Dhanmondi: search the item, press **Assign**, type outlet price `140`, then press Enter | **Outlet price**; the customer pays ৳140.00; stock 0                                |
| 4    | HQ admin            | **Stock** > Dhanmondi: search the item, press **Restock**, enter `10`, then **Save**                      | 10 in stock                                                                         |
| 5    | Cashier · Dhanmondi | **Till**: tap the item twice, enter cash received `500`, press **Complete sale**                          | A receipt with the next DHK number: subtotal ৳280, VAT ৳14, total ৳294, change ৳206 |
| 6    | HQ admin            | **Stock** > Dhanmondi: search the item, press **History**                                                 | 8 in stock; a sale of -2 with the receipt number                                    |
| 7    | HQ admin            | **Sales history**, then **Reports**                                                                       | The sale first in the list; Dhanmondi up by 1 sale, ৳280 net and ৳14 VAT            |

A menu item cannot be deleted, so use another SKU to repeat the walkthrough.

## Staff accounts and roles

Accounts are created from the command line, in `apps/api` (there is no screen for it). Set `JWT_SECRET` in `.env`
first.

```bash
yarn user:create --email admin@example.com --name "Head Office" --role HQ_ADMIN
yarn user:create --email manager@example.com --name "Branch Manager" --role OUTLET_MANAGER --outlet-code DHK
yarn user:set-password --email manager@example.com
yarn user:deactivate --email manager@example.com
```

-   Without `--password` a random password is made and shown once. A password typed in a command stays in the shell
    history, so the random one is safer.
-   A manager or cashier needs `--outlet-code`; an HQ admin must not have one.
-   Changing a password ends every earlier login of that person.
-   In the production image use `yarn user:prod create ...`.

| Action                                   | HQ admin | Outlet manager | Cashier    |
| ---------------------------------------- | -------- | -------------- | ---------- |
| Outlets, menu items, assignments, prices | Yes      | No             | No         |
| See an outlet and its menu               | Any      | Own outlet     | Own outlet |
| See and change stock, see stock history  | Any      | Own outlet     | No         |
| Make a sale                              | No       | Own outlet     | Own outlet |
| See sales and receipts                   | All      | Own outlet     | Own sales  |
| Reports and low stock list               | Yes      | No             | No         |

The API checks this on every request. The screens only hide what the API would refuse.

## Settings

All settings are environment variables, checked when the API starts. Examples:
[apps/api/.env.example](apps/api/.env.example) and [apps/web/.env.example](apps/web/.env.example).

### API

| Setting                       | Default                           | Use                                                        |
| ----------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `NODE_ENV`                    | `development`                     | `production` on a server                                   |
| `APPLICATION_SERVER_PORT`     | `PORT`, else `4000`               | Port of the API                                            |
| `APP_FORCE_SHUTDOWN_SECOND`   | `30`                              | Longest wait for open requests when stopping               |
| `WEB_ORIGIN`                  | local web addresses               | Web addresses allowed to call the API (comma-separated)    |
| `TRUST_PROXY`                 | `0`                               | Number of proxies in front of the API                      |
| `RATE_LIMIT_PER_MINUTE`       | `600`                             | Requests per IP address                                    |
| `LOGIN_RATE_LIMIT_PER_MINUTE` | `10`                              | Login attempts per IP address                              |
| `JWT_SECRET`                  | none, required                    | At least 32 characters. Production refuses the example one |
| `JWT_EXPIRES_IN`              | `8h`                              | How long a login lasts                                     |
| `BUSINESS_TIMEZONE`           | `Asia/Dhaka`                      | Report days and receipt times                              |
| `CURRENCY`                    | `BDT`                             | Currency code                                              |
| `VAT_BPS`                     | `0` (the example file sets `500`) | VAT in basis points: 500 is 5%. Set your legal rate        |
| `COMPANY_NAME`                | `POS Company`                     | Printed on receipts                                        |
| `COMPANY_TAX_NO`              | empty                             | Printed on receipts                                        |
| `RECEIPT_FOOTER`              | `Thank you! Visit again.`         | Printed on receipts                                        |
| `SEED_DEMO_DATA`              | `false`                           | Adds the demo data                                         |

### Database

| Setting                          | Default             | Use                                                        |
| -------------------------------- | ------------------- | ---------------------------------------------------------- |
| `POSTGRES_HOST`, `POSTGRES_PORT` | `127.0.0.1`, `5432` | Where PostgreSQL runs                                      |
| `POSTGRES_DB`                    | `pos`               | Database name                                              |
| `POSTGRES_TEST_DB`               | `pos_test`          | Used by the tests only                                     |
| `POSTGRES_USER`                  | `postgres`          | Database user                                              |
| `POSTGRES_PASSWORD`              | `postgres`          | Required in production                                     |
| `POSTGRES_SSL`                   | `false`             | Encrypt the connection (most hosted databases need `true`) |
| `POSTGRES_SSL_VERIFY`            | `true`              | `false` only when the host's certificate cannot be checked |
| `DB_STATEMENT_TIMEOUT_MS`        | `15000`             | Longest query of the API                                   |
| `DB_LOCK_TIMEOUT_MS`             | `10000`             | Longest wait for a locked row                              |
| `DB_IDLE_TRANSACTION_TIMEOUT_MS` | `30000`             | Longest pause inside a transaction                         |

`0` switches a time limit off, for connection poolers that refuse them. A request cut off by a limit gets `503` and
can be sent again. Migrations run without time limits, and the admin database is used only when the app database is
missing.

### Web

| Setting                     | Use                                                                    |
| --------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | API address, for example `http://localhost:4000/api/v1`                |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Shows the demo accounts on the login page. Keep empty on a real system |

Both are built into the browser code, so a change needs a new build.

## Production run

API and database, in `apps/api`. Copy the example, then set `JWT_SECRET` (`openssl rand -base64 48`),
`POSTGRES_PASSWORD` and `WEB_ORIGIN`:

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up --build -d
```

Web, in `apps/web`. Copy the example, then set `NEXT_PUBLIC_API_URL` to the public API address:

```bash
cp .env.example .env.production
docker compose -f docker-compose.prod.yml up --build -d
```

The API container runs the migrations, then starts. Put HTTPS in front of both and set `TRUST_PROXY=1` behind one
load balancer.

## API endpoints

Base address: `/api/v1`. Send the login token as `Authorization: Bearer <token>`.

**Rules for every endpoint**

-   Ids are public UUIDs. The database's number ids never leave the server.
-   Money is a whole number of paisa (`22000` is 220.00). VAT is in basis points.
-   Unknown fields are refused.
-   Lists take `offset` (default 0) and `limit` (default 25, at most 100).
-   Every answer has the same shape:

```json
{ "code": "SUCCESS", "message": "Success", "response": {}, "errors": [] }
```

A list puts `{ "data": [], "offset": 0, "limit": 25, "total": 0 }` in `response`.

**Who:** HQ = HQ admin, M = outlet manager, C = cashier. M and C reach their own outlet only.

### System and login

| Method and path    | Who      | Purpose                                                   |
| ------------------ | -------- | --------------------------------------------------------- |
| `GET /health`      | Anyone   | API and database status (`503` when the database is down) |
| `GET /app-config`  | Anyone   | Company, currency, VAT rate and time zone, for display    |
| `POST /auth/login` | Anyone   | `{ email, password }` gives `{ token, user }`             |
| `GET /auth/me`     | HQ, M, C | The signed-in user                                        |

### Outlets and menu

| Method and path                                  | Who      | Purpose and input                                                             |
| ------------------------------------------------ | -------- | ----------------------------------------------------------------------------- |
| `GET /outlets`                                   | HQ       | List; `search`                                                                |
| `POST /outlets`                                  | HQ       | `{ code, name, address?, phone?, isActive? }`                                 |
| `GET /outlets/:outletId`                         | HQ, M, C | One outlet                                                                    |
| `PATCH /outlets/:outletId`                       | HQ       | `{ name?, address?, phone?, isActive? }`. The code is fixed                   |
| `GET /menu-items`                                | HQ       | Master menu; `search`                                                         |
| `POST /menu-items`                               | HQ       | `{ sku, name, basePriceCents, isActive? }`                                    |
| `GET /menu-items/:menuItemId`                    | HQ       | One item                                                                      |
| `PATCH /menu-items/:menuItemId`                  | HQ       | `{ name?, basePriceCents?, isActive? }`. The SKU is fixed                     |
| `GET /outlets/:outletId/assignments`             | HQ       | Items assigned to the outlet; `search`                                        |
| `PUT /outlets/:outletId/assignments/:menuItemId` | HQ       | `{ priceOverrideCents, isAvailable }`; `null` price = master                  |
| `GET /outlets/:outletId/menu`                    | HQ, M, C | What the outlet can sell, with price and stock; `search`. Default `limit` 100 |

### Stock

| Method and path                                             | Who   | Purpose and input                          |
| ----------------------------------------------------------- | ----- | ------------------------------------------ |
| `GET /outlets/:outletId/inventory`                          | HQ, M | Stock of each assigned item; `search`      |
| `GET /outlets/:outletId/inventory/:menuItemId/movements`    | HQ, M | History of one item, newest first          |
| `POST /outlets/:outletId/inventory/:menuItemId/adjustments` | HQ, M | `{ delta, reason, note? }` and a retry key |

`reason` is `RESTOCK` (adds), `WASTE` (removes) or `ADJUSTMENT` (either way).

### Sales

| Method and path                        | Who      | Purpose and input                                       |
| -------------------------------------- | -------- | ------------------------------------------------------- |
| `POST /outlets/:outletId/sales`        | M, C     | Make a sale, with a retry key                           |
| `GET /outlets/:outletId/sales`         | HQ, M, C | History; `receipt` (`DHK-000042` or `42`), `from`, `to` |
| `GET /outlets/:outletId/sales/:saleId` | HQ, M, C | One receipt                                             |
| `GET /sales`                           | HQ       | All outlets in one list; same filters and `outletId`    |

A cashier sees only their own sales, in the list and by direct address.

### Reports

| Method and path                  | Who | Purpose and input                                                           |
| -------------------------------- | --- | --------------------------------------------------------------------------- |
| `GET /reports/revenue-by-outlet` | HQ  | Sales count, net sales, VAT and total per outlet, and totals of all outlets |
| `GET /reports/top-items`         | HQ  | Top 5 items of each outlet by quantity; `outletId`                          |
| `GET /reports/low-stock`         | HQ  | Items on sale at open outlets with 5 or fewer left                          |

The first two take `range=today` or `range=month`, **or** `from` and `to` (`YYYY-MM-DD`, both days included).
Without them they cover all time.

### Making a sale

```http
POST /api/v1/outlets/{outletId}/sales
Authorization: Bearer <token>
Idempotency-Key: 6f1c2b9e-3d4a-4c1e-9b7a-2f8d5e0a1c34
Content-Type: application/json
```

```json
{
    "orderType": "DINE_IN",
    "tableLabel": "T4",
    "payment": { "method": "CASH", "cashReceivedCents": 50000 },
    "expectedTotalCents": 46200,
    "items": [{ "menuItemId": "<public id>", "quantity": 2 }]
}
```

-   `orderType`: `DINE_IN`, `TAKEAWAY` or `DELIVERY`. A table only with dine-in.
-   `payment.method`: `CASH` (needs `cashReceivedCents`), `CARD` or `MOBILE_BANKING` (optional `reference`). The payment
    is recorded, not processed.
-   1 to 50 lines, quantity 1 to 1000. The same item twice is merged.
-   The client never sends prices or VAT. `expectedTotalCents` is the total the customer was shown: if the server's total
    differs, nothing is saved and the answer lists the current prices.

The answer is the receipt: number, lines, amounts, payment with change, and the printed header (company, outlet,
cashier) as it was at that moment.

### Retry safety

Making a sale and changing stock need an `Idempotency-Key` header holding a new UUID. Sending the same request with
the same key again does nothing twice: it answers `200` with the first result (`201` the first time). The same key
for a different request is refused with `409`, and another person's key with `403`.

### Errors

| Status | `code`                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 400    | `E_INVALID_DATA`                                                                                                                  |
| 401    | `E_UNAUTHENTICATED`, `E_INVALID_CREDENTIALS`                                                                                      |
| 403    | `E_FORBIDDEN`, `E_OUTLET_INACTIVE`                                                                                                |
| 404    | `E_OUTLET_NOT_FOUND`, `E_MENU_ITEM_NOT_FOUND`, `E_ITEM_NOT_ASSIGNED`, `E_SALE_NOT_FOUND`, `E_PAGE_NOT_FOUND`                      |
| 409    | `E_INSUFFICIENT_STOCK`, `E_PRICE_CHANGED`, `E_IDEMPOTENCY_KEY_REUSED`, `E_DUPLICATE_OUTLET_CODE`, `E_DUPLICATE_SKU`, `E_CONFLICT` |
| 413    | `E_PAYLOAD_TOO_LARGE`                                                                                                             |
| 422    | `E_ITEM_NOT_SELLABLE`, `E_TENDER_TOO_LOW`, `E_STOCK_ABOVE_LIMIT`, `E_OUTLET_INACTIVE` (new sale)                                  |
| 429    | `E_TOO_MANY_REQUESTS`                                                                                                             |
| 500    | `E_INTERNAL_SERVER_ERROR`                                                                                                         |
| 503    | `E_SERVICE_UNAVAILABLE` (busy or the database is down: send again)                                                                |

## Database schema

| Table                     | Holds                               | Key rules in the database                                |
| ------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `outlets`                 | Outlets                             | Unique code                                              |
| `outlet_receipt_counters` | Last receipt number of each outlet  | One row per outlet                                       |
| `menu_items`              | Master menu                         | Unique SKU ignoring case, price 0 or more                |
| `outlet_menu_items`       | Which outlet sells what, own price  | One row per outlet and item                              |
| `inventory`               | Stock per outlet and item           | Only for assigned items, quantity 0 to 1,000,000         |
| `stock_movements`         | Every stock change                  | Direction fits the reason; unique retry key per outlet   |
| `users`                   | Staff and their role                | Unique email; staff have an outlet, HQ admins do not     |
| `sales`                   | One row per sale and receipt header | Unique receipt number per outlet; total = subtotal + VAT |
| `sale_items`              | Lines with name and price at sale   | Only assigned items; line total = quantity x price       |
| `sale_idempotency`        | Retry keys of sales                 | One row per outlet and key                               |

-   Every foreign key is `ON DELETE RESTRICT`; records are switched off, not deleted.
-   A table shown to clients has a `public_id` UUID next to its number `id`.
-   Schema changes are SQL migrations in [apps/api/src/infra/migrations](apps/api/src/infra/migrations).

The ERD, all columns and the indexes are in the
[architecture document](docs/ARCHITECTURE.md#3-database).

## Architecture

The API is one application in layers. A request goes down, the answer comes back up.

| Layer        | Folder (`apps/api/src`) | Job                                                  |
| ------------ | ----------------------- | ---------------------------------------------------- |
| Routes       | `web/router`            | Paths and who may use them                           |
| Controllers  | `web/controller`        | Input validation (Joi), one service call, the answer |
| Services     | `service`               | Business rules and transactions                      |
| Repositories | `repo`                  | Database queries                                     |

Also: `web/dto` (what the client may see), `web/middleware` (login, roles, rate limit, security headers, logging and
one error handler), `config` (checked environment settings), `infra` (database, migrations, logger) and `model`.

A sale in short:

1. Claim the retry key.
2. Read the outlet's current prices and compare the total with what the customer was shown.
3. Take stock for each item, only if enough is left.
4. Take the next receipt number.
5. Save the sale, its lines and the stock history, then commit. Any refusal rolls everything back.

More: [how a sale stays correct](docs/ARCHITECTURE.md#4-sales-stock-and-receipt-numbers).

## Scaling strategy

10 outlets with 100,000 sales a month is about 3,300 sales a day. Even if a fifth of them arrive in one hour, that is
about 0.2 sales a second, so one PostgreSQL server should handle the writing. The growth to plan for is stored history (about 1.2 million sales a
year) and the reports that read it. This has not been load tested.

| Step | Do this                                                                                       |
| ---- | --------------------------------------------------------------------------------------------- |
| 1    | Managed PostgreSQL with backups and a standby, two API instances behind a load balancer       |
| 2    | Measure the report queries on a year of data; add daily summary tables                        |
| 3    | A read copy of the database for reports only; a connection pooler                             |
| 4    | Split large tables by month, or move reporting into its own service, when measurements say so |

Details: [scaling plan](docs/ARCHITECTURE.md#6-scaling-plan),
[microservices](docs/ARCHITECTURE.md#7-moving-to-microservices) and
[offline mode](docs/ARCHITECTURE.md#8-offline-pos-and-kitchen-display).

## Tests and checks

API tests run on a real PostgreSQL (database `pos_test`, created when missing). In `apps/api`:

```bash
docker compose up db -d
yarn install
yarn test
```

They include 50 buyers competing for the last 10 items (10 sales, receipts 1 to 10, stock 0), sales on two outlets at
once, baskets in opposite order, one retry key sent five times at once, a basket with only one item short, and a
rollback when the last step fails.

| Command (in `apps/api` or `apps/web`) | Checks                          |
| ------------------------------------- | ------------------------------- |
| `yarn lint`                           | Lint (the API also type checks) |
| `yarn format:check`                   | Formatting                      |
| `yarn build`                          | Production build                |

GitHub Actions runs on every push to `master`: lint, format, API tests, builds, a security audit of the shipped
packages and the API image build. See [.github/workflows/ci.yml](.github/workflows/ci.yml). Other branches and pull
requests are not built, and the web app is deployed only from `master`. The web app has no automated tests.

## Not built

Voiding and refunds, discounts, service charge, shifts and end-of-day report, recipes and ingredient stock, purchasing
and stock transfers, a staff management screen, payment gateways, tax authority integration, offline selling and the
kitchen display. The last two are [designed](docs/ARCHITECTURE.md#8-offline-pos-and-kitchen-display) only.
