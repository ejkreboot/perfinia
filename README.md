# Perfinia

A personal finance app built around **flows**, not just categories: every spending/income category maps to a flow (Income, Fixed/Essential, Discretionary/Goals, Savings/Investing, Debt Paydown, Transfers), so the dashboard answers "do we have enough income, and how is the balance being allocated toward our goals?" rather than a plain per-category budget check.

Stack: SvelteKit + Supabase (Postgres + Auth) + Plaid, deployed on Vercel.

See `/Users/erikor/.claude/plans/let-s-create-an-amazing-happy-noodle.md` for the full design/build plan.

## Developing

```sh
cp .env.example .env   # fill in SUPABASE_SERVICE_ROLE_KEY, PLAID_CLIENT_ID/SECRET
npm install
npm run dev
```

## Building

```sh
npm run build
npm run preview   # preview the production build locally
```
