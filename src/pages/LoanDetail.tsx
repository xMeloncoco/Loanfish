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
import { isOverdue, type LoanRecord, type LoanStatus } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { DueBadge } from '../components/LoanCard'
import { Thumb } from '../components/Thumb'
import { TrashIcon } from '../components/Icons'
import { Alert, Modal, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function LoanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
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
      .catch((err) => setError(errorMessage(err, t.loanDetail.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [id, t])

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
      setError(errorMessage(err, t.loanDetail.couldNotUpdate))
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
      setError(errorMessage(err, t.loanDetail.couldNotDelete))
      setBusy(false)
      setConfirming(false)
    }
  }

  if (loading) return <Spinner />
  if (!loan) {
    return (
      <>
        <BackLink />
        <Alert>{error || t.loanDetail.notFound}</Alert>
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
          <h1>{item?.name ?? t.loanDetail.deletedItem}</h1>
          <div className="detail-head__sub">
            {lentOut ? t.loanDetail.lentTo : t.loanDetail.borrowedFrom}{' '}
            {person ? (
              <Link className="link" to={`/persons/${person.id}`}>
                {person.name}
              </Link>
            ) : (
              t.loanDetail.deletedPerson
            )}
          </div>
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: 18 }}>
        <DueBadge loan={loan} />
        <span className={`badge ${lentOut ? 'badge--accent' : ''}`}>
          {t.direction[loan.direction]}
        </span>
      </div>

      <Alert>{error}</Alert>

      {isOverdue(loan) ? (
        <div style={{ marginBottom: 18 }}>
          <Alert kind="info">{t.loanDetail.dueBack(formatDate(loan.due_date))}</Alert>
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
                {lentOut ? t.loanDetail.gotItBack : t.loanDetail.gaveItBack}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setStatus('lost')}
                disabled={busy}
              >
                {t.loanDetail.markAsLost}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => setStatus('active')}
              disabled={busy}
            >
              {t.loanDetail.reopenLoan}
            </button>
          )}
          <Link className="btn btn--ghost" to={`/loans/${loan.id}/edit`}>
            {t.common.edit}
          </Link>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setConfirming(true)}
            disabled={busy}
          >
            <TrashIcon />
            {t.common.delete}
          </button>
        </div>
      </section>

      <section className="section">
        <dl className="card card--pad meta-list">
          <div className="meta-row">
            <dt>{t.loanDetail.statusLabel}</dt>
            <dd>{t.status[loan.status]}</dd>
          </div>
          <div className="meta-row">
            <dt>{t.loanDetail.started}</dt>
            <dd>{formatDate(loan.start_date)}</dd>
          </div>
          <div className="meta-row">
            <dt>{t.loanDetail.agreedReturn}</dt>
            <dd>{loan.due_date ? formatDate(loan.due_date) : t.loanDetail.openEnded}</dd>
          </div>
          {loan.returned_date && loan.status !== 'active' ? (
            <div className="meta-row">
              <dt>{loan.status === 'lost' ? t.loanDetail.writtenOff : t.loanDetail.returned}</dt>
              <dd>{formatDate(loan.returned_date)}</dd>
            </div>
          ) : null}
          {item ? (
            <div className="meta-row">
              <dt>{t.loanDetail.item}</dt>
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
            <h2>{t.loanDetail.agreementAndNotes}</h2>
          </div>
          <div className="notes">{loan.notes}</div>
        </section>
      ) : null}

      {confirming ? (
        <Modal title={t.loanDetail.deleteTitle} onClose={() => setConfirming(false)}>
          <p>{t.loanDetail.deleteBody}</p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? t.common.deleting : t.loanDetail.deleteLoanButton}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              {t.common.cancel}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
