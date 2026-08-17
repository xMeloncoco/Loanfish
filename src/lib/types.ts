import type { RecordModel } from 'pocketbase'

export type LoanDirection = 'lent_out' | 'borrowed'
export type LoanStatus = 'active' | 'returned' | 'lost'

export interface UserRecord extends RecordModel {
  email: string
  name?: string
  avatar?: string
}

export interface PersonRecord extends RecordModel {
  user: string
  name: string
  notes?: string
}

export interface ItemRecord extends RecordModel {
  user: string
  name: string
  description?: string
  image?: string
  owner_person?: string
  expand?: {
    owner_person?: PersonRecord
  }
}

export interface LoanRecord extends RecordModel {
  user: string
  item: string
  person: string
  direction: LoanDirection
  status: LoanStatus
  start_date: string
  due_date?: string
  returned_date?: string
  notes?: string
  expand?: {
    item?: ItemRecord
    person?: PersonRecord
  }
}

/** A loan is overdue when it is still out and its due date has passed. */
export function isOverdue(loan: LoanRecord): boolean {
  if (loan.status !== 'active' || !loan.due_date) return false
  return new Date(loan.due_date).getTime() < Date.now()
}

/** Whole days until the due date. Negative once it is in the past. */
export function daysUntilDue(loan: LoanRecord): number | null {
  if (!loan.due_date) return null
  const due = new Date(loan.due_date)
  const today = new Date()
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

export const STATUS_LABELS: Record<LoanStatus, string> = {
  active: 'Out',
  returned: 'Returned',
  lost: 'Lost',
}

export const DIRECTION_LABELS: Record<LoanDirection, string> = {
  lent_out: 'Lent out',
  borrowed: 'Borrowed',
}
