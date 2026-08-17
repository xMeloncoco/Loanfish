# Loanfish — PocketBase schema

Everything you need to create by hand in the PocketBase admin UI. Four collections:
one built-in (`users`) and three you create (`persons`, `items`, `loans`).

**Create them in this order** — `items` and `loans` point at collections that must
already exist:

1. `users` (already exists, just check it)
2. `persons`
3. `items`
4. `loans`

A note on the model: **a person is not a user.** `persons` are plain records owned
by a user — contacts in your own private address book. They never log in, and two
different users each tracking "Sam" will have two unrelated `persons` records.

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
| `avatar`   | file    | optional, single image                    |
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

## 2. `persons` — your private address book

**Type:** Base collection. **Name:** `persons`

| Field    | Type                 | Required | Settings                                                                                     |
| -------- | -------------------- | :------: | -------------------------------------------------------------------------------------------- |
| `user`   | Relation → `users`   |   yes    | Max select **1** (single), **Cascade delete: ON**                                              |
| `name`   | Plain text           |   yes    | Min 1, Max 100                                                                                 |
| `email`  | Email                |    no    | —                                                                                              |
| `phone`  | Plain text           |    no    | Max 40                                                                                         |
| `notes`  | Plain text           |    no    | Max 2000                                                                                       |
| `avatar` | File                 |    no    | Max files **1**, Max size 5 MB, MIME types `image/jpeg`, `image/png`, `image/webp`, `image/gif`; thumb `100x100` |

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

**Indexes** (Collection → Indexes → New index):

```sql
CREATE INDEX idx_persons_user ON persons (user)
```

---

## 3. `items` — the things being tracked

**Type:** Base collection. **Name:** `items`

| Field          | Type                 | Required | Settings                                                                                     |
| -------------- | -------------------- | :------: | -------------------------------------------------------------------------------------------- |
| `user`         | Relation → `users`   |   yes    | Max select **1**, **Cascade delete: ON**                                                       |
| `name`         | Plain text           |   yes    | Min 1, Max 120                                                                                 |
| `description`  | Plain text           |    no    | Max 2000                                                                                       |
| `image`        | File                 |    no    | Max files **1**, Max size 5 MB, MIME types `image/jpeg`, `image/png`, `image/webp`, `image/gif`; thumbs `100x100`, `600x0` |
| `owner_person` | Relation → `persons` |    no    | Max select **1**, **Cascade delete: OFF**                                                      |

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

**Indexes:**

```sql
CREATE INDEX idx_items_user ON items (user)
CREATE INDEX idx_items_owner_person ON items (owner_person)
```

---

## 4. `loans` — the actual lending records

**Type:** Base collection. **Name:** `loans`

| Field           | Type                 | Required | Settings                                                              |
| --------------- | -------------------- | :------: | ---------------------------------------------------------------------- |
| `user`          | Relation → `users`   |   yes    | Max select **1**, **Cascade delete: ON**                                |
| `item`          | Relation → `items`   |   yes    | Max select **1**, **Cascade delete: ON**                                |
| `person`        | Relation → `persons` |   yes    | Max select **1**, **Cascade delete: OFF**                               |
| `direction`     | Select               |   yes    | Max select **1**, values: `lent_out`, `borrowed`                        |
| `status`        | Select               |   yes    | Max select **1**, values: `active`, `returned`, `lost`                  |
| `start_date`    | Date                 |   yes    | —                                                                       |
| `due_date`      | Date                 |    no    | The *supposed* return date. Blank = open-ended.                         |
| `returned_date` | Date                 |    no    | Filled in when the loan is closed.                                      |
| `notes`         | Plain text           |    no    | Max 5000. Paste agreements here.                                        |

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

The same trick works on `items` for `owner_person`:

```
@request.auth.id != "" && @request.body.user = @request.auth.id && (owner_person = "" || owner_person.user = @request.auth.id)
```

The app never sends such a request — this is purely defence against someone
poking the API directly with their own token.

**Indexes:**

```sql
CREATE INDEX idx_loans_user_status ON loans (user, status)
CREATE INDEX idx_loans_item ON loans (item)
CREATE INDEX idx_loans_person ON loans (person)
CREATE INDEX idx_loans_due_date ON loans (due_date)
```

The first one is the important one — the front page queries
`user = X && status = "active"` on every load.

---

## How it fits together

```
users (1) ──< persons        a user's private contacts
users (1) ──< items          the things, each optionally owned by a person
users (1) ──< loans          the lending records

items (1) ──< loans          an item can be loaned many times over its life
persons (1) ──< loans        a person can be involved in many loans
persons (0..1) ──< items     owner_person: empty = the user owns it
```

The front page is two queries against `loans`:

- **"Borrowed from others"** → `user = <me> && status = "active" && direction = "borrowed"`
- **"Lent out to others"** → `user = <me> && status = "active" && direction = "lent_out"`

both with `expand=item,person`.

---

## Things worth knowing before you click around

**Deleting a person.** Neither `loans.person` nor `items.owner_person` is
cascade-delete, but they behave *differently* on delete, and the difference comes
from whether the field is required:

- `items.owner_person` is **optional**, so PocketBase clears it. The item survives
  and goes back to reading as yours.
- `loans.person` is **required**, so PocketBase cannot clear it and **refuses the
  delete**, with:
  `Failed to delete record. Make sure that the record is not part of a required relation reference.`

That is deliberate — a loan with no counterparty is a meaningless record, so the
database won't let you create one by deleting the person. The app handles it by
telling you how many loans are attached and offering to delete those loans first,
as one explicit action. If you delete a person from the PocketBase admin UI
instead, you'll hit the 400 above and have to remove their loans by hand first.

If you would rather deleting a person also silently wipe their loan history, set
`loans.person` to **cascade delete** instead. Don't make `loans.person` optional
to dodge the error — that just moves the problem to loans that point at nobody.

**Deleting an item** cascades to its loans, which is right — the loan history of a
thing that no longer exists is not interesting.

**Dates.** PocketBase date fields store a full timestamp in UTC. The app sends
dates as `YYYY-MM-DD 00:00:00.000Z` and only ever displays the date part, so a
loan started on the 3rd reads as the 3rd everywhere regardless of the viewer's
timezone. If you enter dates by hand in the admin UI, the time component is
ignored by the app.

**File URLs.** Images are fetched with the SDK's `pb.files.getURL(record, filename,
{ thumb: '100x100' })`. The thumb sizes listed in the tables above need to exist on
the field or the thumbnail request falls back to the full-size original — it still
works, it's just a larger download.

**Required-ness of `user`.** Every collection carries its own `user` relation
rather than being reached through a join. That's what makes the one-line API rules
above possible, and it's why the app sets `user` explicitly on every create.
