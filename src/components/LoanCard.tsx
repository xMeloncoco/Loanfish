import { Link } from 'react-router-dom'
import { fileUrl, formatDate } from '../lib/pocketbase'
import { daysUntilDue, isOverdue, STATUS_LABELS, type LoanRecord } from '../lib/types'
import { Thumb } from './Thumb'

/** The "when is this due" pill. Only active loans get a countdown. */
export function DueBadge({ loan }: { loan: LoanRecord }) {
  if (loan.status !== 'active') {
    const label = STATUS_LABELS[loan.status]
    return (
      <span className={loan.status === 'returned' ? 'badge badge--ok' : 'badge badge--danger'}>
        {label}
      </span>
    )
  }

  const days = daysUntilDue(loan)
  if (days === null) return <span className="badge">No date</span>

  if (days < 0) {
    const late = Math.abs(days)
    return (
      <span className="badge badge--danger">
        {late === 1 ? '1 day late' : `${late} days late`}
      </span>
    )
  }
  if (days === 0) return <span className="badge badge--warn">Due today</span>
  if (days === 1) return <span className="badge badge--warn">Due tomorrow</span>
  if (days <= 7) return <span className="badge badge--warn">{days} days left</span>
  return <span className="badge">Due {formatDate(loan.due_date)}</span>
}

interface LoanCardProps {
  loan: LoanRecord
  /** What to show under the item name. Defaults to the other party's name. */
  subtitle?: string
}

export function LoanCard({ loan, subtitle }: LoanCardProps) {
  const item = loan.expand?.item
  const person = loan.expand?.person
  const image = item ? fileUrl(item, item.image, '100x100') : undefined

  const counterparty = person?.name ?? 'Unknown person'
  const line =
    subtitle ??
    (loan.direction === 'lent_out' ? `With ${counterparty}` : `From ${counterparty}`)

  return (
    <Link
      to={`/loans/${loan.id}`}
      className={isOverdue(loan) ? 'loan loan--overdue' : 'loan'}
    >
      <Thumb src={image} name={item?.name ?? '?'} />
      <div className="loan__body">
        <div className="loan__title">{item?.name ?? 'Deleted item'}</div>
        <div className="loan__meta">
          {line} · since {formatDate(loan.start_date)}
        </div>
      </div>
      <div className="loan__side">
        <DueBadge loan={loan} />
      </div>
    </Link>
  )
}
