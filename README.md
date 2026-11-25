# multi-outlet-pos-system

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
