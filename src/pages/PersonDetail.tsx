import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  countItemsForPerson,
  countLoansForPerson,
  deletePersonWithLoans,
  getPerson,
  listLoansForPerson,
} from '../lib/api'
import { errorMessage, fileUrl } from '../lib/pocketbase'
import type { LoanRecord, PersonRecord } from '../lib/types'
import { LoanCard } from '../components/LoanCard'
import { Thumb } from '../components/Thumb'
import { TrashIcon } from '../components/Icons'
import { Alert, Empty, Modal, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function PersonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      .catch((err) => setError(errorMessage(err, 'Could not load this person.')))
      .finally(() => setLoading(false))
  }, [id])

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
      setError(errorMessage(err, 'Could not delete this person.'))
      setBusy(false)
      setConfirming(false)
    }
  }

  if (loading) return <Spinner />
  if (!person) {
    return (
      <>
        <BackLink />
        <Alert>{error || 'Person not found.'}</Alert>
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
        <Thumb
          src={fileUrl(person, person.avatar, '100x100')}
          name={person.name}
          size="lg"
          round
        />
        <div className="detail-head__body">
          <h1>{person.name}</h1>
          <div className="detail-head__sub">
            {active.length === 0
              ? 'Nothing outstanding'
              : `${active.length} open ${active.length === 1 ? 'loan' : 'loans'}`}
          </div>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="btn-row" style={{ marginBottom: 22 }}>
        <Link className="btn" to={`/loans/new?person=${person.id}`}>
          Record a loan
        </Link>
        <Link className="btn btn--ghost" to={`/persons/${person.id}/edit`}>
          Edit
        </Link>
        <button type="button" className="btn btn--danger" onClick={openConfirm}>
          <TrashIcon />
          Delete
        </button>
      </div>

      {person.email || person.phone ? (
        <section className="section">
          <dl className="card card--pad meta-list">
            {person.email ? (
              <div className="meta-row">
                <dt>Email</dt>
                <dd>
                  <a className="link" href={`mailto:${person.email}`}>
                    {person.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {person.phone ? (
              <div className="meta-row">
                <dt>Phone</dt>
                <dd>
                  <a className="link" href={`tel:${person.phone}`}>
                    {person.phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {person.notes ? (
        <section className="section">
          <div className="section__head">
            <h2>Notes</h2>
          </div>
          <div className="notes">{person.notes}</div>
        </section>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2>They have from you</h2>
          <span className="section__count">{theyHave.length}</span>
        </div>
        {theyHave.length === 0 ? (
          <Empty icon="📤" title="Nothing out with them" />
        ) : (
          <div className="stack">
            {theyHave.map((loan) => (
              <LoanCard key={loan.id} loan={loan} subtitle="Lent out" />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>You have from them</h2>
          <span className="section__count">{iHave.length}</span>
        </div>
        {iHave.length === 0 ? (
          <Empty icon="📥" title="Nothing borrowed from them" />
        ) : (
          <div className="stack">
            {iHave.map((loan) => (
              <LoanCard key={loan.id} loan={loan} subtitle="Borrowed" />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section className="section">
          <div className="section__head">
            <h2>Settled</h2>
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
        <Modal title={`Delete ${person.name}?`} onClose={() => setConfirming(false)}>
          <p>{describeDeletion(attached)}</p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy
                ? 'Deleting…'
                : attached.loans > 0
                  ? `Delete person and ${attached.loans} ${attached.loans === 1 ? 'loan' : 'loans'}`
                  : 'Delete person'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Keep them
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
function describeDeletion({ loans, items }: { loans: number; items: number }): string {
  const sentences: string[] = []

  if (loans > 0) {
    sentences.push(
      `A loan can't exist without the person on the other end, so their ${
        loans === 1 ? 'loan will be deleted too' : `${loans} loans will be deleted too`
      }.`,
    )
  }
  if (items > 0) {
    sentences.push(
      `${items === 1 ? 'The item' : `The ${items} items`} marked as theirs will stay, listed as yours.`,
    )
  }

  sentences.push('This cannot be undone.')
  return sentences.join(' ')
}
