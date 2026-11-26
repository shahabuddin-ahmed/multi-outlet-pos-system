# AGENTS.md · web

Rules for agents working in `apps/web`. The API rules are in [apps/api/AGENTS.md](../api/AGENTS.md).

## The one rule here

**The web app only displays.** Prices, totals, stock checks, receipt numbers and report figures come from the API.
Never recompute a rule in the browser. Money travels as integer cents; `formatMoney` only formats it for display.

## Structure (Next.js App Router)

| Folder                  | Put here                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| `src/app/(app)/<route>` | Signed-in pages: a thin `page.tsx` that renders its feature view  |
| `src/features/<page>`   | The UI of one page, split into small components                   |
| `src/components/ui`     | Base parts in shadcn style: button, card, input, badge…           |
| `src/components/shared` | Parts used by several pages: pager, empty and loading states      |
| `src/components/layout` | The app shell: sidebar, top bar, footer                           |
| `src/lib`               | `api.ts` (every API call), formatting, `cn`                       |
| `src/hooks`             | `useApiData` (loading and error state) and typed Redux hooks      |
| `src/stores`            | Redux: only state shared by several pages (the session, the cart) |
| `src/types`             | Types that match the API answers                                  |

## Rules

- **All API calls go through `src/lib/api.ts`.** Show the API's own error message; on a 404 show a "not found" state.
- **Pages and roles** are listed once, in `src/lib/access.ts`; the menu and the page guard both read it. A page that is
  not listed is closed. This only hides things: the API is what refuses.
- **Session:** the token is kept by `src/lib/token.ts`; sign in and out through `session-slice`. A 401 signs out.
- **Money and dates** are shown with `useSettings()` (the API's currency and business time zone). A receipt uses
  what was saved with its sale instead.
- **The one sum in the browser** is `src/lib/estimate.ts`: the total the till shows and sends as
  `expectedTotalCents`. The API decides; it must round the same way.
- **Sales and stock changes** carry a retry key. While `isSettled` (`src/lib/retry.ts`) says no, only the same request
  with the same key may be sent again. The cart is locked in its reducer, and an unconfirmed sale is kept in local
  storage (`src/lib/pending-sale.ts`).
- **Styling:** Tailwind classes with `cn`; reuse `components/ui` before adding a new part; icons from `lucide-react`;
  toasts with `sonner`.
- **Accessibility:** every control has a label and works with the keyboard.
- **No secrets.** `NEXT_PUBLIC_*` values are built into the browser code and are public.
- No new packages without asking.

## Commands

| Command      | What                                 |
| ------------ | ------------------------------------ |
| `yarn dev`   | Dev server on http://localhost:3000  |
| `yarn lint`  | ESLint                               |
| `yarn build` | Production build with the type check |

The API must run on port 4000 (`NEXT_PUBLIC_API_URL`). Run `npx tsc --noEmit` and `yarn lint` after each change.

## Style

2 spaces, single quotes, no trailing commas (Prettier: `yarn format:check`). Format only the files you change, never
the whole repository.
