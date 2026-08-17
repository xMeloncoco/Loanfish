import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteItem, getItem, listLoansForItem } from '../lib/api'
import { errorMessage, fileUrl } from '../lib/pocketbase'
import type { ItemRecord, LoanRecord } from '../lib/types'
import { LoanCard } from '../components/LoanCard'
import { TrashIcon } from '../components/Icons'
import { Alert, Empty, Modal, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'
import { Thumb } from '../components/Thumb'

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      .catch((err) => setError(errorMessage(err, 'Could not load this item.')))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!id) return
    setBusy(true)
    try {
      await deleteItem(id)
      navigate('/items', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the item.'))
      setBusy(false)
      setConfirming(false)
    }
  }

  if (loading) return <Spinner />
  if (!item) {
    return (
      <>
        <BackLink />
        <Alert>{error || 'Item not found.'}</Alert>
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
                Belongs to <Link className="link" to={`/persons/${owner.id}`}>{owner.name}</Link>
              </>
            ) : (
              'Yours'
            )}
          </div>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="btn-row" style={{ marginBottom: 22 }}>
        {activeLoan ? (
          <Link className="btn" to={`/loans/${activeLoan.id}`}>
            View current loan
          </Link>
        ) : (
          <Link className="btn" to={`/loans/new?item=${item.id}`}>
            Record a loan
          </Link>
        )}
        <Link className="btn btn--ghost" to={`/items/${item.id}/edit`}>
          Edit
        </Link>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => setConfirming(true)}
        >
          <TrashIcon />
          Delete
        </button>
      </div>

      {item.description ? (
        <section className="section">
          <div className="section__head">
            <h2>Description</h2>
          </div>
          <div className="notes">{item.description}</div>
        </section>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2>Loan history</h2>
          <span className="section__count">{loans.length}</span>
        </div>
        {loans.length === 0 ? (
          <Empty icon="🗒️" title="Never loaned">
            This item has not been lent out or borrowed yet.
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
        <Modal title={`Delete ${item.name}?`} onClose={() => setConfirming(false)}>
          <p>
            {loans.length > 0
              ? `This also deletes ${loans.length} loan ${loans.length === 1 ? 'record' : 'records'} for this item. It cannot be undone.`
              : 'This cannot be undone.'}
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? 'Deleting…' : 'Delete item'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Keep it
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
