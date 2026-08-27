import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteItem, getItem, listLoansForItem } from '../lib/api'
import { errorMessage, fileUrl } from '../lib/pocketbase'
import type { ItemRecord, LoanRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { LoanCard } from '../components/LoanCard'
import { TrashIcon } from '../components/Icons'
import { Alert, Empty, Modal, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'
import { Thumb } from '../components/Thumb'

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [item, setItem] = useState<ItemRecord | null>(null)
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getItem(id), listLoansForItem(id)])
      .then(([record, history]) => {
        setItem(record)
        setLoans(history)
      })
      .catch((err) => setError(errorMessage(err, t.itemDetail.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [id, t])

  async function handleDelete() {
    if (!id) return
    setBusy(true)
    try {
      await deleteItem(id)
      navigate('/items', { replace: true })
    } catch (err) {
      setError(errorMessage(err, t.itemDetail.couldNotDelete))
      setBusy(false)
      setConfirming(false)
    }
  }

  if (loading) return <Spinner />
  if (!item) {
    return (
      <>
        <BackLink />
        <Alert>{error || t.itemDetail.notFound}</Alert>
      </>
    )
  }

  const image = fileUrl(item, item.image, '600x0')
  const owner = item.expand?.owner_person
  const activeLoan = loans.find((loan) => loan.status === 'active')

  return (
    <>
      <BackLink />

      {image ? <img className="hero-image" src={image} alt="" /> : null}

      <div className="detail-head">
        {image ? null : <Thumb name={item.name} size="lg" />}
        <div className="detail-head__body">
          <h1>{item.name}</h1>
          <div className="detail-head__sub">
            {owner ? (
              <>
                {t.itemDetail.belongsTo} <Link className="link" to={`/persons/${owner.id}`}>{owner.name}</Link>
              </>
            ) : (
              t.itemDetail.yours
            )}
          </div>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="btn-row" style={{ marginBottom: 22 }}>
        {activeLoan ? (
          <Link className="btn" to={`/loans/${activeLoan.id}`}>
            {t.itemDetail.viewCurrentLoan}
          </Link>
        ) : (
          <Link className="btn" to={`/loans/new?item=${item.id}`}>
            {t.itemDetail.recordALoan}
          </Link>
        )}
        <Link className="btn btn--ghost" to={`/items/${item.id}/edit`}>
          {t.common.edit}
        </Link>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => setConfirming(true)}
        >
          <TrashIcon />
          {t.common.delete}
        </button>
      </div>

      {item.description ? (
        <section className="section">
          <div className="section__head">
            <h2>{t.itemDetail.description}</h2>
          </div>
          <div className="notes">{item.description}</div>
        </section>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2>{t.itemDetail.loanHistory}</h2>
          <span className="section__count">{loans.length}</span>
        </div>
        {loans.length === 0 ? (
          <Empty icon="🗒️" title={t.itemDetail.neverLoanedTitle}>
            {t.itemDetail.neverLoanedBody}
          </Empty>
        ) : (
          <div className="stack">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </section>

      {confirming ? (
        <Modal title={t.itemDetail.deleteTitle(item.name)} onClose={() => setConfirming(false)}>
          <p>
            {loans.length > 0
              ? t.itemDetail.deleteBodyWithLoans(loans.length)
              : t.itemDetail.deleteBodySimple}
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? t.common.deleting : t.itemDetail.deleteItemButton}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              {t.itemDetail.keepIt}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
