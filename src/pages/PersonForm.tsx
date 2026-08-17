import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createPerson, getPerson, updatePerson } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, fileUrl } from '../lib/pocketbase'
import { Thumb } from '../components/Thumb'
import { CameraIcon } from '../components/Icons'
import { Alert, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function PersonForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [preview, setPreview] = useState<string | undefined>()

  useEffect(() => {
    if (!id) return
    getPerson(id)
      .then((person) => {
        setName(person.name)
        setEmail(person.email ?? '')
        setPhone(person.phone ?? '')
        setNotes(person.notes ?? '')
        setPreview(fileUrl(person, person.avatar, '100x100'))
      })
      .catch((err) => setError(errorMessage(err, 'Could not load this person.')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!avatar) return
    const url = URL.createObjectURL(avatar)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatar])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')

    const body = new FormData()
    body.set('user', user.id)
    body.set('name', name.trim())
    body.set('email', email.trim())
    body.set('phone', phone.trim())
    body.set('notes', notes.trim())
    if (avatar) body.set('avatar', avatar)
    else if (removeAvatar) body.set('avatar', '')

    try {
      const saved =
        editing && id ? await updatePerson(id, body) : await createPerson(body)
      navigate(`/persons/${saved.id}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not save this person.'))
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <BackLink />
      <div className="page-head">
        <div className="page-head__text">
          <h1>{editing ? 'Edit person' : 'New person'}</h1>
          <p>Just for your own records — nothing is sent to them.</p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="image-picker">
          <Thumb src={preview} name={name || '?'} size="lg" round />
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => fileInput.current?.click()}
            >
              <CameraIcon />
              {preview ? 'Change photo' : 'Add photo'}
            </button>
            {preview ? (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => {
                  setAvatar(null)
                  setPreview(undefined)
                  setRemoveAvatar(true)
                  if (fileInput.current) fileInput.current.value = ''
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={(e) => {
              setAvatar(e.target.files?.[0] ?? null)
              setRemoveAvatar(false)
            }}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="person-name">
            Name
          </label>
          <input
            id="person-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="person-email">
              Email <span className="field__hint">(optional)</span>
            </label>
            <input
              id="person-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="person-phone">
              Phone <span className="field__hint">(optional)</span>
            </label>
            <input
              id="person-phone"
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              maxLength={40}
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="person-notes">
            Notes <span className="field__hint">(optional)</span>
          </label>
          <textarea
            id="person-notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How you know them, where they live, anything worth remembering."
            maxLength={2000}
          />
        </div>

        <Alert>{error}</Alert>

        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add person'}
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
    </>
  )
}
