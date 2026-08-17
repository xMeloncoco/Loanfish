import { pb } from './pocketbase'
import type { ItemRecord, LoanRecord, LoanStatus, PersonRecord } from './types'

const persons = () => pb.collection('persons')
const items = () => pb.collection('items')
const loans = () => pb.collection('loans')

/** Escape a value for use inside a PocketBase filter string. */
function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`
}

// ---------------------------------------------------------------- persons

export function listPersons(userId: string) {
  return persons().getFullList<PersonRecord>({
    filter: `user = ${quote(userId)}`,
    sort: 'name',
  })
}

export function getPerson(id: string) {
  return persons().getOne<PersonRecord>(id)
}

export function createPerson(data: FormData | Record<string, unknown>) {
  return persons().create<PersonRecord>(data)
}

export function updatePerson(id: string, data: FormData | Record<string, unknown>) {
  return persons().update<PersonRecord>(id, data)
}

export function deletePerson(id: string) {
  return persons().delete(id)
}

// ------------------------------------------------------------------ items

export function listItems(userId: string) {
  return items().getFullList<ItemRecord>({
    filter: `user = ${quote(userId)}`,
    sort: 'name',
    expand: 'owner_person',
  })
}

export function getItem(id: string) {
  return items().getOne<ItemRecord>(id, { expand: 'owner_person' })
}

export function createItem(data: FormData | Record<string, unknown>) {
  return items().create<ItemRecord>(data)
}

export function updateItem(id: string, data: FormData | Record<string, unknown>) {
  return items().update<ItemRecord>(id, data)
}

export function deleteItem(id: string) {
  return items().delete(id)
}

// ------------------------------------------------------------------ loans

const LOAN_EXPAND = 'item,person'

/** Active loans in one direction — this is what the front page runs. */
export function listActiveLoans(userId: string, direction: 'lent_out' | 'borrowed') {
  return loans().getFullList<LoanRecord>({
    filter: `user = ${quote(userId)} && status = "active" && direction = ${quote(direction)}`,
    sort: 'due_date',
    expand: LOAN_EXPAND,
  })
}

/** Everything, newest first — the history view. */
export function listLoans(userId: string, status?: LoanStatus) {
  const filter = status
    ? `user = ${quote(userId)} && status = ${quote(status)}`
    : `user = ${quote(userId)}`
  return loans().getFullList<LoanRecord>({
    filter,
    sort: '-start_date',
    expand: LOAN_EXPAND,
  })
}

export function listLoansForItem(itemId: string) {
  return loans().getFullList<LoanRecord>({
    filter: `item = ${quote(itemId)}`,
    sort: '-start_date',
    expand: LOAN_EXPAND,
  })
}

export function listLoansForPerson(personId: string) {
  return loans().getFullList<LoanRecord>({
    filter: `person = ${quote(personId)}`,
    sort: '-start_date',
    expand: LOAN_EXPAND,
  })
}

export function getLoan(id: string) {
  return loans().getOne<LoanRecord>(id, { expand: LOAN_EXPAND })
}

export function createLoan(data: Record<string, unknown>) {
  return loans().create<LoanRecord>(data)
}

export function updateLoan(id: string, data: Record<string, unknown>) {
  return loans().update<LoanRecord>(id, data)
}

export function deleteLoan(id: string) {
  return loans().delete(id)
}

/**
 * Close a loan. `returned_date` is stamped on resolution and cleared when a
 * loan is re-opened, so it never contradicts the status.
 */
export function resolveLoan(id: string, status: LoanStatus, date: string) {
  return updateLoan(id, {
    status,
    returned_date: status === 'active' ? '' : date,
  })
}

/** How much is attached to a person — used to explain what a delete will do. */
export async function countLoansForPerson(personId: string): Promise<number> {
  const result = await loans().getList(1, 1, {
    filter: `person = ${quote(personId)}`,
    fields: 'id',
  })
  return result.totalItems
}

export async function countItemsForPerson(personId: string): Promise<number> {
  const result = await items().getList(1, 1, {
    filter: `owner_person = ${quote(personId)}`,
    fields: 'id',
  })
  return result.totalItems
}

/**
 * Remove a person and everything that requires them.
 *
 * `loans.person` is a *required* relation, so PocketBase refuses to delete a
 * person while any loan still points at them. Their loans therefore have to go
 * first — the caller is expected to have said so out loud. Items are a
 * different case: `owner_person` is optional, so PocketBase clears it by itself
 * and the items survive as the user's own.
 */
export async function deletePersonWithLoans(personId: string) {
  const attached = await loans().getFullList<LoanRecord>({
    filter: `person = ${quote(personId)}`,
    fields: 'id',
  })
  for (const loan of attached) {
    await loans().delete(loan.id)
  }
  await deletePerson(personId)
}
