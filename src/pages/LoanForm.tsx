import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createItem,
  createLoan,
  createPerson,
  getLoan,
  listItems,
  listPersons,
  updateItem,
  updateLoan,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, toDateInput, todayInput, toPbDate } from '../lib/pocketbase'
import type { ItemRecord, LoanDirection, PersonRecord } from '../lib/types'
import { Alert, Modal, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function LoanForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [items, setItems] = useState<ItemRecord[]>([])
  const [persons, setPersons] = useState<PersonRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [direction, setDirection] = useState<LoanDirection>('lent_out')
  const [itemId, setItemId] = useState(searchParams.get('item') ?? '')
  const [personId, setPersonId] = useState(searchParams.get('person') ?? '')
  const [startDate, setStartDate] = useState(todayInput())
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [adoptOwner, setAdoptOwner] = useState(true)

  const [showItemModal, setShowItemModal] = useState(false)
  const [itemModalName, setItemModalName] = useState('')
  const [itemModalOwner, setItemModalOwner] = useState('')
  const [itemModalBusy, setItemModalBusy] = useState(false)
  const [itemModalError, setItemModalError] = useState('')

  const [showPersonModal, setShowPersonModal] = useState(false)
  const [personModalName, setPersonModalName] = useState('')
  const [personModalBusy, setPersonModalBusy] = useState(false)
  const [personModalError, setPersonModalError] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [itemList, personList, loan] = await Promise.all([
          listItems(user.id),
          listPersons(user.id),
          id ? getLoan(id) : Promise.resolve(null),
        ])
        setItems(itemList)
        setPersons(personList)

        if (loan) {
          setDirection(loan.direction)
          setItemId(loan.item)
          setPersonId(loan.person)
          setStartDate(toDateInput(loan.start_date))
          setDueDate(toDateInput(loan.due_date))
          setNotes(loan.notes ?? '')
        } else {
          // Coming from an item page: if that item belongs to someone else,
          // this is almost certainly a loan *to* the user, not from them.
          const preselected = itemList.find(
            (candidate) => candidate.id === searchParams.get('item'),
          )
          if (preselected?.owner_person) {
            setDirection('borrowed')
            setPersonId((current) => current || preselected.owner_person!)
          }
        }
      } catch (err) {
        setError(errorMessage(err, 'Could not load the form.'))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, user, searchParams])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId),
    [items, itemId],
  )

  // Borrowing an item that is still marked as yours is a contradiction worth
  // offering to fix, rather than silently leaving the data inconsistent.
  const offerOwnerUpdate =
    !editing &&
    direction === 'borrowed' &&
    Boolean(selectedItem) &&
    !selectedItem?.owner_person &&
    Boolean(personId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    if (dueDate && startDate && dueDate < startDate) {
      setError('The return date cannot be before the start date.')
      return
    }

    setBusy(true)
    setError('')

    const body = {
      user: user.id,
      item: itemId,
      person: personId,
      direction,
      start_date: toPbDate(startDate),
      due_date: dueDate ? toPbDate(dueDate) : '',
      notes: notes.trim(),
      ...(editing ? {} : { status: 'active' as const }),
    }

    try {
      const saved = editing && id ? await updateLoan(id, body) : await createLoan(body)

      if (offerOwnerUpdate && adoptOwner && selectedItem) {
        await updateItem(selectedItem.id, { owner_person: personId })
      }

      navigate(`/loans/${saved.id}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not save the loan.'))
      setBusy(false)
    }
  }

  async function handleCreateItem(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setItemModalBusy(true)
    setItemModalError('')
    try {
      const created = await createItem({
        user: user.id,
        name: itemModalName.trim(),
        description: '',
        owner_person: itemModalOwner,
      })
      setItems(await listItems(user.id))
      setItemId(created.id)
      setShowItemModal(false)
      setItemModalName('')
      setItemModalOwner('')
    } catch (err) {
      setItemModalError(errorMessage(err, 'Could not add the item.'))
    } finally {
      setItemModalBusy(false)
    }
  }

  async function handleCreatePerson(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setPersonModalBusy(true)
    setPersonModalError('')
    try {
      const created = await createPerson({
        user: user.id,
        name: personModalName.trim(),
        notes: '',
      })
      setPersons(await listPersons(user.id))
      setPersonId(created.id)
      setShowPersonModal(false)
      setPersonModalName('')
    } catch (err) {
      setPersonModalError(errorMessage(err, 'Could not add the person.'))
    } finally {
      setPersonModalBusy(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <BackLink />
      <div className="page-head">
        <div className="page-head__text">
          <h1>{editing ? 'Edit loan' : 'New loan'}</h1>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <span className="field__label">Which way?</span>
          <div className="segmented">
            <button
              type="button"
              className="segmented__option"
              aria-pressed={direction === 'lent_out'}
              onClick={() => setDirection('lent_out')}
            >
              I lent it out
            </button>
            <button
              type="button"
              className="segmented__option"
              aria-pressed={direction === 'borrowed'}
              onClick={() => setDirection('borrowed')}
            >
              I borrowed it
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="loan-item">
            Item
          </label>
          <select
            id="loan-item"
            className="select"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            required
          >
            <option value="">Choose an item…</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.expand?.owner_person ? ` (${item.expand.owner_person.name}'s)` : ''}
              </option>
            ))}
          </select>
          <span className="field__hint">
            Not in the list?{' '}
            <button
              type="button"
              className="link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
              onClick={() => setShowItemModal(true)}
            >
              Add an item
            </button>
            .
          </span>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="loan-person">
            {direction === 'lent_out' ? 'Who has it' : 'Who it came from'}
          </label>
          <select
            id="loan-person"
            className="select"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            required
          >
            <option value="">Choose a person…</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <span className="field__hint">
            Not in the list?{' '}
            <button
              type="button"
              className="link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
              onClick={() => setShowPersonModal(true)}
            >
              Add a person
            </button>
            .
          </span>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="loan-start">
              Start date
            </label>
            <input
              id="loan-start"
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="loan-due">
              Back by <span className="field__hint">(optional)</span>
            </label>
            <input
              id="loan-due"
              className="input"
              type="date"
              value={dueDate}
              min={startDate || undefined}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="loan-notes">
            Notes <span className="field__hint">(optional)</span>
          </label>
          <textarea
            id="loan-notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste what you agreed — conditions, deposit, the message thread…"
            maxLength={5000}
            rows={6}
          />
        </div>

        {offerOwnerUpdate ? (
          <label className="field" style={{ flexDirection: 'row', gap: 10 }}>
            <input
              type="checkbox"
              checked={adoptOwner}
              onChange={(e) => setAdoptOwner(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 3, flexShrink: 0 }}
            />
            <span className="field__hint">
              “{selectedItem?.name}” is currently marked as yours. Set its owner to{' '}
              {persons.find((p) => p.id === personId)?.name} as well.
            </span>
          </label>
        ) : null}

        <Alert>{error}</Alert>

        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Record loan'}
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => navigate(-1)}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>

      {showItemModal ? (
        <Modal title="Add an item" onClose={() => setShowItemModal(false)}>
          <form className="form" onSubmit={handleCreateItem}>
            <div className="field">
              <label className="field__label" htmlFor="quick-item-name">
                Name
              </label>
              <input
                id="quick-item-name"
                className="input"
                value={itemModalName}
                onChange={(e) => setItemModalName(e.target.value)}
                placeholder="Drill, Dune (book), camping stove…"
                maxLength={120}
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="quick-item-owner">
                Owner
              </label>
              <select
                id="quick-item-owner"
                className="select"
                value={itemModalOwner}
                onChange={(e) => setItemModalOwner(e.target.value)}
              >
                <option value="">Me</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <Alert>{itemModalError}</Alert>
            <div className="btn-row">
              <button className="btn" type="submit" disabled={itemModalBusy}>
                {itemModalBusy ? 'Adding…' : 'Add item'}
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setShowItemModal(false)}
                disabled={itemModalBusy}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showPersonModal ? (
        <Modal title="Add a person" onClose={() => setShowPersonModal(false)}>
          <form className="form" onSubmit={handleCreatePerson}>
            <div className="field">
              <label className="field__label" htmlFor="quick-person-name">
                Name
              </label>
              <input
                id="quick-person-name"
                className="input"
                value={personModalName}
                onChange={(e) => setPersonModalName(e.target.value)}
                maxLength={100}
                autoFocus
                required
              />
            </div>
            <Alert>{personModalError}</Alert>
            <div className="btn-row">
              <button className="btn" type="submit" disabled={personModalBusy}>
                {personModalBusy ? 'Adding…' : 'Add person'}
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setShowPersonModal(false)}
                disabled={personModalBusy}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}
