import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listActiveLoans } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/pocketbase'
import { isOverdue, type LoanRecord } from '../lib/types'
import { LoanCard } from '../components/LoanCard'
import { ArrowInIcon, ArrowOutIcon, PlusIcon } from '../components/Icons'
import { Alert, Empty, Spinner } from '../components/ui'

export function Dashboard() {
  const { user } = useAuth()
  const [borrowed, setBorrowed] = useState<LoanRecord[]>([])
  const [lentOut, setLentOut] = useState<LoanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setError('')
    try {
      const [borrowedLoans, lentLoans] = await Promise.all([
        listActiveLoans(user.id, 'borrowed'),
        listActiveLoans(user.id, 'lent_out'),
      ])
      setBorrowed(sortLoans(borrowedLoans))
      setLentOut(sortLoans(lentLoans))
    } catch (err) {
      setError(errorMessage(err, 'Could not load your loans.'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <Spinner />

  const overdueCount = [...borrowed, ...lentOut].filter(isOverdue).length

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1>
          <p>
            {overdueCount > 0
              ? `${overdueCount} ${overdueCount === 1 ? 'loan is' : 'loans are'} past the agreed date.`
              : 'Everything is on schedule.'}
          </p>
        </div>
        <Link to="/loans/new" className="btn btn--sm">
          <PlusIcon />
          Loan
        </Link>
      </div>

      <Alert>{error}</Alert>

      <section className="section">
        <div className="section__head">
          <ArrowInIcon className="section__icon" />
          <h2>Borrowed from others</h2>
          <span className="section__count">{borrowed.length}</span>
        </div>
        {borrowed.length === 0 ? (
          <Empty icon="📥" title="Nothing borrowed">
            Things you have taken from other people show up here.
          </Empty>
        ) : (
          <div className="stack">
            {borrowed.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <ArrowOutIcon className="section__icon" />
          <h2>Lent out to others</h2>
          <span className="section__count">{lentOut.length}</span>
        </div>
        {lentOut.length === 0 ? (
          <Empty icon="📤" title="Nothing lent out">
            Record a loan when you hand something over, so you remember who has it.
          </Empty>
        ) : (
          <div className="stack">
            {lentOut.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

/**
 * Soonest deadline first, and loans with no agreed date last — an open-ended
 * loan is never more urgent than one with a date attached.
 */
function sortLoans(loans: LoanRecord[]): LoanRecord[] {
  return [...loans].sort((a, b) => {
    if (!a.due_date && !b.due_date) return a.start_date < b.start_date ? 1 : -1
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date < b.due_date ? -1 : 1
  })
}
