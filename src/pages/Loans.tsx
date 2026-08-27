import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listLoans } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/pocketbase'
import type { LoanRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { LoanCard } from '../components/LoanCard'
import { PlusIcon } from '../components/Icons'
import { Alert, Empty, Spinner } from '../components/ui'

type Filter = 'all' | 'active' | 'returned' | 'lost' | 'lent_out' | 'borrowed'

export function Loans() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const FILTERS: [Filter, string][] = [
    ['all', t.loansPage.filterAll],
    ['active', t.loansPage.filterActive],
    ['returned', t.loansPage.filterReturned],
    ['lost', t.loansPage.filterLost],
    ['lent_out', t.loansPage.filterLentOut],
    ['borrowed', t.loansPage.filterBorrowed],
  ]

  useEffect(() => {
    if (!user) return
    listLoans(user.id)
      .then(setLoans)
      .catch((err) => setError(errorMessage(err, t.loansPage.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [user, t])

  const visible = useMemo(() => {
    switch (filter) {
      case 'all':
        return loans
      case 'lent_out':
      case 'borrowed':
        return loans.filter((loan) => loan.direction === filter)
      default:
        return loans.filter((loan) => loan.status === filter)
    }
  }, [loans, filter])

  if (loading) return <Spinner />

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t.loansPage.title}</h1>
          <p>{t.loansPage.subtitle}</p>
        </div>
        <Link to="/loans/new" className="btn btn--sm">
          <PlusIcon />
          {t.loansPage.loanButton}
        </Link>
      </div>

      <Alert>{error}</Alert>

      {loans.length > 0 ? (
        <div className="filters">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="filter"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {loans.length === 0 ? (
        <Empty icon="🗂️" title={t.loansPage.noLoansTitle}>
          {t.loansPage.noLoansBody}
        </Empty>
      ) : visible.length === 0 ? (
        <Empty icon="🔍" title={t.loansPage.noMatchTitle} />
      ) : (
        <div className="stack">
          {visible.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </>
  )
}
