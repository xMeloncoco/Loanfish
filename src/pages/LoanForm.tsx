import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createLoan,
  getLoan,
  listItems,
  listPersons,
  updateItem,
  updateLoan,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, toDateInput, todayInput, toPbDate } from '../lib/pocketbase'
import type { ItemRecord, LoanDirection, PersonRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Alert, Empty, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function LoanForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
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
        setError(errorMessage(err, t.loanForm.couldNotLoadForm))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, user, searchParams, t])

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
      setError(t.loanForm.dueBeforeStart)
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
      setError(errorMessage(err, t.loanForm.couldNotSave))
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  if (!editing && (items.length === 0 || persons.length === 0)) {
    return (
      <>
        <BackLink />
        <div className="page-head">
          <div className="page-head__text">
            <h1>{t.loanForm.newLoanTitle}</h1>
          </div>
        </div>
        <Empty icon="🧩" title={t.loanForm.needsItemAndPersonTitle}>
          {items.length === 0 && persons.length === 0
            ? t.loanForm.needBoth
            : items.length === 0
              ? t.loanForm.needItem
              : t.loanForm.needPerson}
        </Empty>
        <div className="btn-row" style={{ marginTop: 16 }}>
          {items.length === 0 ? (
            <Link className="btn" to="/items/new">
              {t.loanForm.addAnItem}
            </Link>
          ) : null}
          {persons.length === 0 ? (
            <Link className="btn btn--ghost" to="/persons/new">
              {t.loanForm.addAPerson}
            </Link>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <>
      <BackLink />
      <div className="page-head">
        <div className="page-head__text">
          <h1>{editing ? t.loanForm.editLoanTitle : t.loanForm.newLoanTitle}</h1>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <span className="field__label">{t.loanForm.whichWay}</span>
          <div className="segmented">
            <button
              type="button"
              className="segmented__option"
              aria-pressed={direction === 'lent_out'}
              onClick={() => setDirection('lent_out')}
            >
              {t.loanForm.lentItOut}
            </button>
            <button
              type="button"
              className="segmented__option"
              aria-pressed={direction === 'borrowed'}
              onClick={() => setDirection('borrowed')}
            >
              {t.loanForm.borrowedIt}
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="loan-item">
            {t.loanForm.itemLabel}
          </label>
          <select
            id="loan-item"
            className="select"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            required
          >
            <option value="">{t.loanForm.chooseItem}</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.expand?.owner_person
                  ? ` ${t.loanForm.itemOwnerSuffix(item.expand.owner_person.name)}`
                  : ''}
              </option>
            ))}
          </select>
          <span className="field__hint">
            {t.loanForm.notInListItem} <Link className="link" to="/items/new">{t.loanForm.addAnItemLink}</Link>.
          </span>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="loan-person">
            {direction === 'lent_out' ? t.loanForm.whoHasIt : t.loanForm.whoItCameFrom}
          </label>
          <select
            id="loan-person"
            className="select"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            required
          >
            <option value="">{t.loanForm.choosePerson}</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <span className="field__hint">
            {t.loanForm.notInListPerson} <Link className="link" to="/persons/new">{t.loanForm.addAPersonLink}</Link>.
          </span>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="loan-start">
              {t.loanForm.startDate}
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
              {t.loanForm.backBy} <span className="field__hint">({t.common.optional})</span>
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
            {t.loanForm.notesLabel} <span className="field__hint">({t.common.optional})</span>
          </label>
          <textarea
            id="loan-notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.loanForm.notesPlaceholder}
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
              {t.loanForm.ownerUpdateHint(
                selectedItem?.name ?? '',
                persons.find((p) => p.id === personId)?.name,
              )}
            </span>
          </label>
        ) : null}

        <Alert>{error}</Alert>

        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? t.common.saving : editing ? t.loanForm.saveChanges : t.loanForm.recordLoan}
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => navigate(-1)}
            disabled={busy}
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </>
  )
}
