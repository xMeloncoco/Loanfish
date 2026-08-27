import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listLoans } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/pocketbase'
import type { LoanRecord } from '../lib/types'
import { LoanCard } from '../components/LoanCard'
import { PlusIcon } from '../components/Icons'
import { Alert, Empty, Spinner } from '../components/ui'

type Filter = 'all' | 'active' | 'returned' | 'lost' | 'lent_out' | 'borrowed'

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['active', 'Still out'],
  ['returned', 'Returned'],
  ['lost', 'Lost'],
  ['lent_out', 'Lent out'],
  ['borrowed', 'Borrowed'],
]

export function Loans() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    if (!user) return
    listLoans(user.id)
      .then(setLoans)
      .catch((err) => setError(errorMessage(err, 'Could not load your loans.')))
      .finally(() => setLoading(false))
  }, [user])

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
          <h1>Loans</h1>
          <p>Everything you have out or holding, active or resolved.</p>
        </div>
        <Link to="/loans/new" className="btn btn--sm">
          <PlusIcon />
          Loan
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
        <Empty icon="🗂️" title="No loans yet">
          Record a loan to start keeping track — you can add the item and person
          for it right from that form.
        </Empty>
      ) : visible.length === 0 ? (
        <Empty icon="🔍" title="Nothing in this filter" />
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
