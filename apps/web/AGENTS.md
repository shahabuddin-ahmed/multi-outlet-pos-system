# AGENTS.md · web

Rules for agents working in `apps/web`. The API rules are in [apps/api/AGENTS.md](../api/AGENTS.md).

## The one rule here

**The web app only displays.** Prices, totals, stock checks, receipt numbers and report figures come from the API.
Never recompute a rule in the browser. Money travels as integer cents; `formatMoney` only formats it for display.

## Structure (Next.js App Router)

| Folder                  | Put here                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `src/app/<route>`       | A thin `page.tsx` that renders its feature view                       |
| `src/features/<page>`   | The UI of one page, split into small components                       |
| `src/components/ui`     | Base parts in shadcn style: button, card, input, badge…               |
| `src/components/shared` | Parts used by several pages: pager, empty and loading states          |
| `src/components/layout` | The app shell: sidebar, top bar, footer                               |
| `src/lib`               | `api.ts` (every API call), formatting, `cn`                           |
| `src/hooks`             | `useApiData` (loading and error state) and typed Redux hooks          |
| `src/stores`            | Redux: only state shared by several pages (the open outlet, the cart) |
| `src/types`             | Types that match the API answers                                      |

## Rules

- **All API calls go through `src/lib/api.ts`.** Show the API's own error message; on `E_NOT_FOUND` show a "not
  found" state.
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
