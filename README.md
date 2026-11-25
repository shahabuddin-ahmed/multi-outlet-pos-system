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
| Low stock list across outlets            | Yes      | No             | No         |
