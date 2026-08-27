import { Link } from 'react-router-dom'
import { fileUrl, formatDate } from '../lib/pocketbase'
import { daysUntilDue, isOverdue, type LoanRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Thumb } from './Thumb'

/** The "when is this due" pill. Only active loans get a countdown. */
export function DueBadge({ loan }: { loan: LoanRecord }) {
  const { t } = useI18n()

  if (loan.status !== 'active') {
    const label = t.status[loan.status]
    return (
      <span className={loan.status === 'returned' ? 'badge badge--ok' : 'badge badge--danger'}>
        {label}
      </span>
    )
  }

  const days = daysUntilDue(loan)
  if (days === null) return <span className="badge">{t.dueBadge.noDate}</span>

  if (days < 0) {
    return <span className="badge badge--danger">{t.dueBadge.daysLate(Math.abs(days))}</span>
  }
  if (days === 0) return <span className="badge badge--warn">{t.dueBadge.dueToday}</span>
  if (days === 1) return <span className="badge badge--warn">{t.dueBadge.dueTomorrow}</span>
  if (days <= 7) return <span className="badge badge--warn">{t.dueBadge.daysLeft(days)}</span>
  return <span className="badge">{t.dueBadge.due(formatDate(loan.due_date))}</span>
}

interface LoanCardProps {
  loan: LoanRecord
  /** What to show under the item name. Defaults to the other party's name. */
  subtitle?: string
}

export function LoanCard({ loan, subtitle }: LoanCardProps) {
  const { t } = useI18n()
  const item = loan.expand?.item
  const person = loan.expand?.person
  const image = item ? fileUrl(item, item.image, '100x100') : undefined

  const counterparty = person?.name ?? t.loanCard.unknownPerson
  const line =
    subtitle ?? (loan.direction === 'lent_out' ? t.loanCard.with(counterparty) : t.loanCard.from(counterparty))

  return (
    <Link
      to={`/loans/${loan.id}`}
      className={isOverdue(loan) ? 'loan loan--overdue' : 'loan'}
    >
      <Thumb src={image} name={item?.name ?? '?'} />
      <div className="loan__body">
        <div className="loan__title">{item?.name ?? t.loanCard.deletedItem}</div>
        <div className="loan__meta">
          {line} · {t.loanCard.since(formatDate(loan.start_date))}
        </div>
      </div>
      <div className="loan__side">
        <DueBadge loan={loan} />
      </div>
    </Link>
  )
}
