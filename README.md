# Loanfish 🐟

Keep track of what you lent to whom, and what you're still holding that belongs to
someone else. A small mobile-first web app on top of [PocketBase](https://pocketbase.io).

The front page answers the only two questions that matter: **what do I have that
isn't mine**, and **who has my stuff**.

## The model in one paragraph

A **person** is just a name and a free-text note in your own private list — they
never log in, never get an account, and never see anything. Two users tracking the
same neighbour each have their own separate record for them. An **item** is a thing
you track; by default it's yours, but it can be marked as belonging to one of your
persons, and it can carry a photo. A **loan** ties an item to a person in a
direction (`lent_out` or `borrowed`), with a start date, an optional agreed return
date, a status, and a notes field for pasting whatever you agreed.

The app's own collections are prefixed `lf_` (`lf_persons`, `lf_items`,
`lf_loans`); `users` is PocketBase's built-in auth collection and keeps its name.

## Setup

### 1. Create the database

Everything you need to build in PocketBase is in **[DATABASE.md](./DATABASE.md)** —
collections, every field with its settings, and the API rules, in the order they
have to be created. Indexes are covered too, but they're an optional speed
tweak you can skip entirely.

The schema in that document was built against PocketBase 0.30 and verified
end-to-end: the collections create cleanly, the app's queries return what they
should, and the API rules were checked from a second account to confirm one user
cannot read or write another's records.

### 2. Point the app at it

```bash
cp .env.example .env
```

and set `VITE_POCKETBASE_URL` to your instance (`http://127.0.0.1:8090` for a local
PocketBase).

### 3. Run it

```bash
npm install
npm run dev
```

To sign up from the app itself, the `users` collection needs a create rule that
permits it — see the note in DATABASE.md. Otherwise create your account in the
PocketBase admin UI and just sign in.

## Commands

| Command           | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Dev server with hot reload          |
| `npm run build`   | Typecheck and build to `dist/`      |
| `npm run preview` | Serve the production build locally  |

## Deploying

`dist/` is a static bundle — any static host works. Two things to get right:

- **SPA fallback.** Routes like `/items/abc123` are client-side, so unknown paths
  must serve `index.html` or a refresh on a detail page 404s. On Netlify that's a
  `_redirects` with `/* /index.html 200`; nginx wants
  `try_files $uri $uri/ /index.html;`. PocketBase can serve the app itself by
  dropping `dist/` into its `pb_public/` directory, which handles this for you.
- **CORS**, if the app is on a different origin than PocketBase.

`VITE_POCKETBASE_URL` is baked in at build time, so set it before building rather
than after.

## Layout

```
src/
  lib/
    pocketbase.ts   client, file URLs, date conversion, error formatting
    types.ts        record shapes, overdue/due-date logic
    api.ts          every query the app makes, in one place
    auth.tsx        session handling
  components/       layout, loan card, thumbnails, icons, small UI pieces
  pages/            one file per screen
```

A few decisions worth knowing about:

- **Overdue is computed, never stored.** A loan is overdue when it's still active
  and its due date has passed. Storing it as a status would mean a record that
  quietly becomes wrong as the clock passes midnight.
- **Dates are pinned to midnight UTC** on the way in and formatted in UTC on the
  way out, so a loan started on the 3rd reads as the 3rd in every timezone.
- **The dashboard re-sorts client-side.** PocketBase sorts empty due dates first;
  an open-ended loan is never more urgent than one with a deadline, so they go last.
- **Deleting a person deletes their loans**, because `loans.person` is a required
  relation and a loan with no counterparty is meaningless. Their items survive and
  revert to being yours. The confirmation dialog spells this out with real counts.
