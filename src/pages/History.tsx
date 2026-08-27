import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listLoans } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, formatDate } from '../lib/pocketbase'
import type { LoanRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Alert, Empty, Spinner } from '../components/ui'
import { ArrowInIcon, ArrowOutIcon, ChevronRightIcon } from '../components/Icons'

type EventKind = 'created' | 'returned' | 'lost'

interface LoanEvent {
  id: string
  date: string
  loan: LoanRecord
  kind: EventKind
}

// Loans carry no separate audit log — this page reconstructs a timeline from
// the fields every loan already has: when it started, and if it has been
// resolved, when that happened. Re-opening a loan clears `returned_date`, so
// a resolution event simply stops appearing once a loan is active again.
function buildEvents(loans: LoanRecord[]): LoanEvent[] {
  const events: LoanEvent[] = []
  for (const loan of loans) {
    events.push({ id: `${loan.id}-created`, date: loan.start_date, loan, kind: 'created' })
    if (loan.status !== 'active' && loan.returned_date) {
      events.push({
        id: `${loan.id}-resolved`,
        date: loan.returned_date,
        loan,
        kind: loan.status === 'lost' ? 'lost' : 'returned',
      })
    }
  }
  return events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function History() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const KIND_LABEL: Record<EventKind, string> = {
    created: t.history.eventCreated,
    returned: t.history.eventReturned,
    lost: t.history.eventLost,
  }

  useEffect(() => {
    if (!user) return
    listLoans(user.id)
      .then(setLoans)
      .catch((err) => setError(errorMessage(err, t.history.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [user, t])

  const events = useMemo(() => buildEvents(loans), [loans])

  if (loading) return <Spinner />

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t.history.title}</h1>
          <p>{t.history.subtitle}</p>
        </div>
      </div>

      <Alert>{error}</Alert>

      {events.length === 0 ? (
        <Empty icon="🗂️" title={t.history.nothingYetTitle}>
          {t.history.nothingYetBody}
        </Empty>
      ) : (
        <div className="stack">
          {events.map((event) => {
            const item = event.loan.expand?.item
            const person = event.loan.expand?.person
            const lentOut = event.loan.direction === 'lent_out'
            return (
              <Link key={event.id} to={`/loans/${event.loan.id}`} className="tile">
                {lentOut ? (
                  <ArrowOutIcon className="section__icon" />
                ) : (
                  <ArrowInIcon className="section__icon" />
                )}
                <div className="tile__body">
                  <div className="tile__title">{KIND_LABEL[event.kind]}</div>
                  <div className="tile__sub">
                    {item?.name ?? t.history.deletedItem}
                    {person ? ` · ${person.name}` : ''} · {formatDate(event.date)}
                  </div>
                </div>
                <span className="chev">
                  <ChevronRightIcon />
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
