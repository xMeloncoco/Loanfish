# Loanfish — PocketBase schema

Everything you need to create by hand in the PocketBase admin UI. Four collections:
one built-in (`users`) and three you create (`lf_persons`, `lf_items`, `lf_loans`).

Your own collections are prefixed `lf_` so they group together in the admin sidebar
and never collide with PocketBase's internal tables. `users` is the built-in auth
collection and keeps its name.

**Create them in this order** — `lf_items` and `lf_loans` point at collections that
must already exist:

1. `users` (already exists, just check it)
2. `lf_persons`
3. `lf_items`
4. `lf_loans`

A note on the model: **a person is not a user.** `lf_persons` are plain records
owned by a user — names in your own private list. They never log in, and two
different users each tracking "Sam" will have two unrelated `lf_persons` records.

---

## 1. `users` — built-in auth collection

Nothing to create. PocketBase ships this collection; just confirm it's there and
that these fields exist (they are defaults):

| Field      | Type    | Notes                                     |
| ---------- | ------- | ----------------------------------------- |
| `id`       | text    | auto                                      |
| `email`    | email   | auth field                                |
| `password` | password| auth field                                |
| `name`     | text    | optional, shown in the app header         |
| `avatar`   | file    | optional, unused by the app               |
| `verified` | bool    | auto                                      |

**Options to check** (Collection → Options):

- **Auth methods → Identity/Password**: enabled (the app signs in with email + password).
- **Allow OAuth2 / OTP**: not used, leave off.
- If you want people to be able to sign up from the app itself, the **Create rule**
  must allow it. The default `users` create rule is empty-with-a-lock in some
  versions; set the Create rule to a blank/open rule (`""` — "anyone") if the
  registration form should work. If you'd rather create accounts yourself in the
  admin UI, leave it locked and skip the app's register screen.

---

## 2. `lf_persons` — the people you lend to and borrow from

**Type:** Base collection. **Name:** `lf_persons`

| Field   | Type               | Required | Settings                                          |
| ------- | ------------------ | :------: | -------------------------------------------------- |
| `user`  | Relation → `users` |   yes    | Max select **1** (single), **Cascade delete: ON**   |
| `name`  | Plain text         |   yes    | Min 1, Max 100                                      |
| `notes` | Plain text         |    no    | Max 2000                                            |

That's the whole thing — a name and a free-text note. Anything else you want to
remember about someone (how to reach them, where they live, how you know them)
goes in `notes`, which the app shows on their page.

> **Cascade delete ON** on `user` means: delete the account, and their persons go
> with it. That's what you want here — nobody else can see them anyway.

**API rules** (Collection → API Rules). All five get the same rule, except Create:

| Rule   | Value                                                     |
| ------ | --------------------------------------------------------- |
| List   | `@request.auth.id != "" && user = @request.auth.id`        |
| View   | `@request.auth.id != "" && user = @request.auth.id`        |
| Create | `@request.auth.id != "" && @request.body.user = @request.auth.id` |
| Update | `@request.auth.id != "" && user = @request.auth.id`        |
| Delete | `@request.auth.id != "" && user = @request.auth.id`        |

> **PocketBase version note:** `@request.body.*` is the syntax for PocketBase
> **0.23 and newer**. On older versions use `@request.data.user` instead. Everything
> else in this document is identical across versions.

---

## 3. `lf_items` — the things being tracked

**Type:** Base collection. **Name:** `lf_items`

| Field          | Type                    | Required | Settings                                                                                     |
| -------------- | ----------------------- | :------: | -------------------------------------------------------------------------------------------- |
| `user`         | Relation → `users`      |   yes    | Max select **1**, **Cascade delete: ON**                                                       |
| `name`         | Plain text              |   yes    | Min 1, Max 120                                                                                 |
| `description`  | Plain text              |    no    | Max 2000                                                                                       |
| `image`        | File                    |    no    | Max files **1**, Max size 5 MB, MIME types `image/jpeg`, `image/png`, `image/webp`, `image/gif`; thumbs `100x100`, `600x0` |
| `owner_person` | Relation → `lf_persons` |    no    | Max select **1**, **Cascade delete: OFF**                                                      |

**How ownership works — the one thing to get right:**

- `user` is *who is tracking this item* (the record's owner in the database sense).
  It is always set, on every item, and it is always the logged-in user.
- `owner_person` is *who the item actually belongs to in real life*:
  - **empty** → the item belongs to the user. This is the default.
  - **set** → the item belongs to that person; the user is holding or has borrowed it.

So "owner defaults to the user, but can be a person" is expressed by leaving
`owner_person` blank rather than by pointing it at a user record. This keeps a
single field doing the work and means an item's real owner can be changed later
without touching anything else.

**Cascade delete OFF** on `owner_person` matters: deleting a person should not
silently delete the items you borrowed from them. See the "Deleting a person"
note at the bottom.

**API rules:**

| Rule   | Value                                                     |
| ------ | --------------------------------------------------------- |
| List   | `@request.auth.id != "" && user = @request.auth.id`        |
| View   | `@request.auth.id != "" && user = @request.auth.id`        |
| Create | `@request.auth.id != "" && @request.body.user = @request.auth.id` |
| Update | `@request.auth.id != "" && user = @request.auth.id`        |
| Delete | `@request.auth.id != "" && user = @request.auth.id`        |

---

## 4. `lf_loans` — the actual lending records

**Type:** Base collection. **Name:** `lf_loans`

| Field           | Type                    | Required | Settings                                                              |
| --------------- | ----------------------- | :------: | ---------------------------------------------------------------------- |
| `user`          | Relation → `users`      |   yes    | Max select **1**, **Cascade delete: ON**                                |
| `item`          | Relation → `lf_items`   |   yes    | Max select **1**, **Cascade delete: ON**                                |
| `person`        | Relation → `lf_persons` |   yes    | Max select **1**, **Cascade delete: OFF**                               |
| `direction`     | Select                  |   yes    | Max select **1**, values: `lent_out`, `borrowed`                        |
| `status`        | Select                  |   yes    | Max select **1**, values: `active`, `returned`, `lost`                  |
| `start_date`    | Date                    |   yes    | —                                                                       |
| `due_date`      | Date                    |    no    | The *supposed* return date. Blank = open-ended.                         |
| `returned_date` | Date                    |    no    | Filled in when the loan is closed.                                      |
| `notes`         | Plain text              |    no    | Max 5000. Paste agreements here.                                        |

**Field meanings:**

- `direction` — which way the item went, from the logged-in user's point of view:
  - `lent_out` → **user → person**. The user owns it, the person has it.
  - `borrowed` → **person → user**. The person owns it, the user has it.
- `person` is always *the other party*, never the user. Combined with `direction`
  that's enough to describe any loan without a second relation field.
- `status`:
  - `active` → still out, not resolved.
  - `returned` → resolved, item is back where it belongs.
  - `lost` → resolved, but the item isn't coming back.
- **Overdue is not a status.** A loan is overdue when
  `status = active && due_date < now`. The app computes this on the fly, so you
  never have a stored status drifting out of date as the clock ticks past a due
  date. Don't add an `overdue` option to the select.
- `returned_date` is set by the app when you mark a loan returned or lost, and
  cleared if you re-open it.

**API rules:**

| Rule   | Value                                                     |
| ------ | --------------------------------------------------------- |
| List   | `@request.auth.id != "" && user = @request.auth.id`        |
| View   | `@request.auth.id != "" && user = @request.auth.id`        |
| Create | `@request.auth.id != "" && @request.body.user = @request.auth.id` |
| Update | `@request.auth.id != "" && user = @request.auth.id`        |
| Delete | `@request.auth.id != "" && user = @request.auth.id`        |

**Optional hardening.** The rules above stop you reading anyone else's loans, but
a hand-crafted request could still create a loan pointing at *someone else's*
item or person record. If you want that closed off too, use these instead for
Create and Update:

```
// Create
@request.auth.id != "" && @request.body.user = @request.auth.id && item.user = @request.auth.id && person.user = @request.auth.id

// Update
@request.auth.id != "" && user = @request.auth.id && item.user = @request.auth.id && person.user = @request.auth.id
```

The same trick works on `lf_items` for `owner_person`:

```
@request.auth.id != "" && @request.body.user = @request.auth.id && (owner_person = "" || owner_person.user = @request.auth.id)
```

The app never sends such a request — this is purely defence against someone
poking the API directly with their own token.

---

## Indexes — optional, skip them if you like

An index is a lookup shortcut the database keeps so it doesn't have to scan every
row to answer a query. **They are a speed optimization and nothing else.** The app
behaves identically with or without them, no field or rule depends on them, and
for a personal lending tracker — tens or hundreds of records — you will not be
able to feel the difference. Nothing in the app breaks if you never add a single
one.

So: **skip this section for now.** If a list ever feels slow once you have a few
thousand loans, come back and add them.

If you do want them, in the admin UI open the collection → **Edit collection** →
scroll to **Indexes** → **+ New index**, and paste one statement per index:

```sql
-- lf_persons
CREATE INDEX idx_lf_persons_user ON lf_persons (user)

-- lf_items
CREATE INDEX idx_lf_items_user ON lf_items (user)
CREATE INDEX idx_lf_items_owner_person ON lf_items (owner_person)

-- lf_loans
CREATE INDEX idx_lf_loans_user_status ON lf_loans (user, status)
CREATE INDEX idx_lf_loans_item ON lf_loans (item)
CREATE INDEX idx_lf_loans_person ON lf_loans (person)
```

The only one that would ever really earn its keep is
`idx_lf_loans_user_status`, because the front page runs
`user = X && status = "active"` on every single load. If you add just one, add
that one.

---

## How it fits together

```
users (1) ──< lf_persons        a user's private list of people
users (1) ──< lf_items          the things, each optionally owned by a person
users (1) ──< lf_loans          the lending records

lf_items (1) ──< lf_loans       an item can be loaned many times over its life
lf_persons (1) ──< lf_loans     a person can be involved in many loans
lf_persons (0..1) ──< lf_items  owner_person: empty = the user owns it
```

The front page is two queries against `lf_loans`:

- **"Borrowed from others"** → `user = <me> && status = "active" && direction = "borrowed"`
- **"Lent out to others"** → `user = <me> && status = "active" && direction = "lent_out"`

both with `expand=item,person`.

---

## Things worth knowing before you click around

**Deleting a person.** Neither `lf_loans.person` nor `lf_items.owner_person` is
cascade-delete, but they behave *differently* on delete, and the difference comes
from whether the field is required:

- `lf_items.owner_person` is **optional**, so PocketBase clears it. The item
  survives and goes back to reading as yours.
- `lf_loans.person` is **required**, so PocketBase cannot clear it and **refuses
  the delete**, with:
  `Failed to delete record. Make sure that the record is not part of a required relation reference.`

That is deliberate — a loan with no counterparty is a meaningless record, so the
database won't let you create one by deleting the person. The app handles it by
telling you how many loans are attached and offering to delete those loans first,
as one explicit action. If you delete a person from the PocketBase admin UI
instead, you'll hit the 400 above and have to remove their loans by hand first.

If you would rather deleting a person also silently wipe their loan history, set
`lf_loans.person` to **cascade delete** instead. Don't make `lf_loans.person`
optional to dodge the error — that just moves the problem to loans that point at
nobody.

**Deleting an item** cascades to its loans, which is right — the loan history of a
thing that no longer exists is not interesting.

**Dates.** PocketBase date fields store a full timestamp in UTC. The app sends
dates as `YYYY-MM-DD 00:00:00.000Z` and only ever displays the date part, so a
loan started on the 3rd reads as the 3rd everywhere regardless of the viewer's
timezone. If you enter dates by hand in the admin UI, the time component is
ignored by the app.

**Item images.** The only file field the app uses is `lf_items.image`, fetched
with `pb.files.getURL(record, filename, { thumb: '100x100' })`. The thumb sizes
listed in the `lf_items` table need to exist on the field or the thumbnail request
falls back to the full-size original — it still works, it's just a larger
download.

**Required-ness of `user`.** Every collection carries its own `user` relation
rather than being reached through a join. That's what makes the one-line API rules
above possible, and it's why the app sets `user` explicitly on every create.
