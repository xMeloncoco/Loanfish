import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteLoan, getLoan, resolveLoan } from '../lib/api'
import {
  errorMessage,
  fileUrl,
  formatDate,
  todayInput,
  toPbDate,
} from '../lib/pocketbase'
import {
  DIRECTION_LABELS,
  STATUS_LABELS,
  isOverdue,
  type LoanRecord,
  type LoanStatus,
} from '../lib/types'
import { DueBadge } from '../components/LoanCard'
import { Thumb } from '../components/Thumb'
import { TrashIcon } from '../components/Icons'
import { Alert, Modal, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function LoanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loan, setLoan] = useState<LoanRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getLoan(id)
      .then(setLoan)
      .catch((err) => setError(errorMessage(err, 'Could not load this loan.')))
      .finally(() => setLoading(false))
  }, [id])

  async function setStatus(status: LoanStatus) {
    if (!id) return
    setBusy(true)
    setError('')
    try {
      const updated = await resolveLoan(id, status, toPbDate(todayInput()))
      // The update response drops the expansions, so re-read to keep the
      // item and person on screen.
      setLoan(await getLoan(updated.id))
    } catch (err) {
      setError(errorMessage(err, 'Could not update the loan.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    setBusy(true)
    try {
      await deleteLoan(id)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the loan.'))
      setBusy(false)
      setConfirming(false)
    }
  }

  if (loading) return <Spinner />
  if (!loan) {
    return (
      <>
        <BackLink />
        <Alert>{error || 'Loan not found.'}</Alert>
      </>
    )
  }

  const item = loan.expand?.item
  const person = loan.expand?.person
  const lentOut = loan.direction === 'lent_out'
  const image = item ? fileUrl(item, item.image, '600x0') : undefined

  return (
    <>
      <BackLink />

      {image ? <img className="hero-image" src={image} alt="" /> : null}

      <div className="detail-head">
        {image ? null : <Thumb name={item?.name ?? '?'} size="lg" />}
        <div className="detail-head__body">
          <h1>{item?.name ?? 'Deleted item'}</h1>
          <div className="detail-head__sub">
            {lentOut ? 'Lent to' : 'Borrowed from'}{' '}
            {person ? (
              <Link className="link" to={`/persons/${person.id}`}>
                {person.name}
              </Link>
            ) : (
              'someone who has been deleted'
            )}
          </div>
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: 18 }}>
        <DueBadge loan={loan} />
        <span className={`badge ${lentOut ? 'badge--accent' : ''}`}>
          {DIRECTION_LABELS[loan.direction]}
        </span>
      </div>

      <Alert>{error}</Alert>

      {isOverdue(loan) ? (
        <div style={{ marginBottom: 18 }}>
          <Alert kind="info">
            This was due back on {formatDate(loan.due_date)}.
          </Alert>
        </div>
      ) : null}

      <section className="section">
        <div className="btn-row">
          {loan.status === 'active' ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => setStatus('returned')}
                disabled={busy}
              >
                {lentOut ? 'Got it back' : 'Gave it back'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setStatus('lost')}
                disabled={busy}
              >
                Mark as lost
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => setStatus('active')}
              disabled={busy}
            >
              Re-open loan
            </button>
          )}
          <Link className="btn btn--ghost" to={`/loans/${loan.id}/edit`}>
            Edit
          </Link>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setConfirming(true)}
            disabled={busy}
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      </section>

      <section className="section">
        <dl className="card card--pad meta-list">
          <div className="meta-row">
            <dt>Status</dt>
            <dd>{STATUS_LABELS[loan.status]}</dd>
          </div>
          <div className="meta-row">
            <dt>Started</dt>
            <dd>{formatDate(loan.start_date)}</dd>
          </div>
          <div className="meta-row">
            <dt>Agreed return</dt>
            <dd>{loan.due_date ? formatDate(loan.due_date) : 'Open-ended'}</dd>
          </div>
          {loan.returned_date && loan.status !== 'active' ? (
            <div className="meta-row">
              <dt>{loan.status === 'lost' ? 'Written off' : 'Returned'}</dt>
              <dd>{formatDate(loan.returned_date)}</dd>
            </div>
          ) : null}
          {item ? (
            <div className="meta-row">
              <dt>Item</dt>
              <dd>
                <Link className="link" to={`/items/${item.id}`}>
                  {item.name}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {loan.notes ? (
        <section className="section">
          <div className="section__head">
            <h2>Agreement &amp; notes</h2>
          </div>
          <div className="notes">{loan.notes}</div>
        </section>
      ) : null}

      {confirming ? (
        <Modal title="Delete this loan?" onClose={() => setConfirming(false)}>
          <p>
            The item and the person stay — only this loan record goes. This cannot be
            undone.
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? 'Deleting…' : 'Delete loan'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
