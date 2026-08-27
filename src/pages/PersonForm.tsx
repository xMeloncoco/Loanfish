import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createPerson, getPerson, updatePerson } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/pocketbase'
import { useI18n } from '../lib/i18n'
import { Alert, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function PersonForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()

  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!id) return
    getPerson(id)
      .then((person) => {
        setName(person.name)
        setNotes(person.notes ?? '')
      })
      .catch((err) => setError(errorMessage(err, t.personForm.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [id, t])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')

    const body = {
      user: user.id,
      name: name.trim(),
      notes: notes.trim(),
    }

    try {
      const saved =
        editing && id ? await updatePerson(id, body) : await createPerson(body)
      navigate(`/persons/${saved.id}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err, t.personForm.couldNotSave))
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <BackLink />
      <div className="page-head">
        <div className="page-head__text">
          <h1>{editing ? t.personForm.editTitle : t.personForm.newTitle}</h1>
          <p>{t.personForm.subtitle}</p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="person-name">
            {t.personForm.nameLabel}
          </label>
          <input
            id="person-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus={!editing}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="person-notes">
            {t.personForm.notesLabel} <span className="field__hint">({t.common.optional})</span>
          </label>
          <textarea
            id="person-notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.personForm.notesPlaceholder}
            maxLength={2000}
          />
        </div>

        <Alert>{error}</Alert>

        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? t.common.saving : editing ? t.personForm.saveChanges : t.personForm.addPerson}
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
