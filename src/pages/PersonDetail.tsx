import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  countItemsForPerson,
  countLoansForPerson,
  deletePersonWithLoans,
  getPerson,
  listLoansForPerson,
} from '../lib/api'
import { errorMessage } from '../lib/pocketbase'
import type { LoanRecord, PersonRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { LoanCard } from '../components/LoanCard'
import { Thumb } from '../components/Thumb'
import { TrashIcon } from '../components/Icons'
import { Alert, Empty, Modal, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function PersonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [person, setPerson] = useState<PersonRecord | null>(null)
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [attached, setAttached] = useState({ loans: 0, items: 0 })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getPerson(id), listLoansForPerson(id)])
      .then(([record, history]) => {
        setPerson(record)
        setLoans(history)
      })
      .catch((err) => setError(errorMessage(err, t.personDetail.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [id, t])

  async function openConfirm() {
    if (!id) return
    setConfirming(true)
    try {
      const [loanCount, itemCount] = await Promise.all([
        countLoansForPerson(id),
        countItemsForPerson(id),
      ])
      setAttached({ loans: loanCount, items: itemCount })
    } catch {
      // The counts are only there to warn; deleting still works without them.
    }
  }

  async function handleDelete() {
    if (!id) return
    setBusy(true)
    try {
      await deletePersonWithLoans(id)
      navigate('/persons', { replace: true })
    } catch (err) {
      setError(errorMessage(err, t.personDetail.couldNotDelete))
      setBusy(false)
      setConfirming(false)
    }
  }

  if (loading) return <Spinner />
  if (!person) {
    return (
      <>
        <BackLink />
        <Alert>{error || t.personDetail.notFound}</Alert>
      </>
    )
  }

  const active = loans.filter((loan) => loan.status === 'active')
  const past = loans.filter((loan) => loan.status !== 'active')
  const theyHave = active.filter((loan) => loan.direction === 'lent_out')
  const iHave = active.filter((loan) => loan.direction === 'borrowed')

  return (
    <>
      <BackLink />

      <div className="detail-head">
        <Thumb name={person.name} size="lg" round />
        <div className="detail-head__body">
          <h1>{person.name}</h1>
          <div className="detail-head__sub">
            {active.length === 0 ? t.personDetail.nothingOutstanding : t.personDetail.openLoans(active.length)}
          </div>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="btn-row" style={{ marginBottom: 22 }}>
        <Link className="btn" to={`/loans/new?person=${person.id}`}>
          {t.personDetail.recordALoan}
        </Link>
        <Link className="btn btn--ghost" to={`/persons/${person.id}/edit`}>
          {t.common.edit}
        </Link>
        <button type="button" className="btn btn--danger" onClick={openConfirm}>
          <TrashIcon />
          {t.common.delete}
        </button>
      </div>

      {person.notes ? (
        <section className="section">
          <div className="section__head">
            <h2>{t.personDetail.notes}</h2>
          </div>
          <div className="notes">{person.notes}</div>
        </section>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2>{t.personDetail.theyHaveFromYou}</h2>
          <span className="section__count">{theyHave.length}</span>
        </div>
        {theyHave.length === 0 ? (
          <Empty icon="📤" title={t.personDetail.nothingOutWithThem} />
        ) : (
          <div className="stack">
            {theyHave.map((loan) => (
              <LoanCard key={loan.id} loan={loan} subtitle={t.personDetail.lentOutSubtitle} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>{t.personDetail.youHaveFromThem}</h2>
          <span className="section__count">{iHave.length}</span>
        </div>
        {iHave.length === 0 ? (
          <Empty icon="📥" title={t.personDetail.nothingBorrowedFromThem} />
        ) : (
          <div className="stack">
            {iHave.map((loan) => (
              <LoanCard key={loan.id} loan={loan} subtitle={t.personDetail.borrowedSubtitle} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section className="section">
          <div className="section__head">
            <h2>{t.personDetail.settled}</h2>
            <span className="section__count">{past.length}</span>
          </div>
          <div className="stack">
            {past.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </section>
      ) : null}

      {confirming ? (
        <Modal title={t.personDetail.deleteTitle(person.name)} onClose={() => setConfirming(false)}>
          <p>{describeDeletion(attached, t)}</p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy
                ? t.common.deleting
                : attached.loans > 0
                  ? t.personDetail.deletePersonAndLoans(attached.loans)
                  : t.personDetail.deletePerson}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              {t.personDetail.keepThem}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}

/**
 * Spell out what actually happens, because the two relations behave
 * differently: loans require a person and so must go, items don't and so stay.
 */
function describeDeletion(
  { loans, items }: { loans: number; items: number },
  t: ReturnType<typeof useI18n>['t'],
): string {
  const sentences: string[] = []

  if (loans > 0) sentences.push(t.personDetail.deleteLoanSentence(loans))
  if (items > 0) sentences.push(t.personDetail.deleteItemsSentence(items))

  sentences.push(t.personDetail.cannotBeUndone)
  return sentences.join(' ')
}
