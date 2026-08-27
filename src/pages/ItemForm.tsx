import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createItem, getItem, listPersons, updateItem } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, fileUrl } from '../lib/pocketbase'
import type { ItemRecord, PersonRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Thumb } from '../components/Thumb'
import { CameraIcon } from '../components/Icons'
import { Alert, Spinner } from '../components/ui'
import { BackLink } from '../components/BackLink'

export function ItemForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const fileInput = useRef<HTMLInputElement>(null)

  const [persons, setPersons] = useState<PersonRecord[]>([])
  const [existing, setExisting] = useState<ItemRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerPerson, setOwnerPerson] = useState(searchParams.get('owner') ?? '')
  const [image, setImage] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [preview, setPreview] = useState<string | undefined>()

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [personList, item] = await Promise.all([
          listPersons(user.id),
          id ? getItem(id) : Promise.resolve(null),
        ])
        setPersons(personList)
        if (item) {
          setExisting(item)
          setName(item.name)
          setDescription(item.description ?? '')
          setOwnerPerson(item.owner_person ?? '')
          setPreview(fileUrl(item, item.image, '600x0'))
        }
      } catch (err) {
        setError(errorMessage(err, t.itemForm.couldNotLoadForm))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, user, t])

  // Object URLs for the local preview have to be released by hand.
  useEffect(() => {
    if (!image) return
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')

    const body = new FormData()
    body.set('user', user.id)
    body.set('name', name.trim())
    body.set('description', description.trim())
    body.set('owner_person', ownerPerson)
    if (image) body.set('image', image)
    // An empty string tells PocketBase to clear the stored file.
    else if (removeImage) body.set('image', '')

    try {
      const saved = editing && id ? await updateItem(id, body) : await createItem(body)
      navigate(`/items/${saved.id}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err, t.itemForm.couldNotSave))
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <BackLink />
      <div className="page-head">
        <div className="page-head__text">
          <h1>{editing ? t.itemForm.editTitle : t.itemForm.newTitle}</h1>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="image-picker">
          <Thumb src={preview} name={name || '?'} size="lg" />
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => fileInput.current?.click()}
            >
              <CameraIcon />
              {preview ? t.itemForm.changePhoto : t.itemForm.addPhoto}
            </button>
            {preview ? (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => {
                  setImage(null)
                  setPreview(undefined)
                  setRemoveImage(true)
                  if (fileInput.current) fileInput.current.value = ''
                }}
              >
                {t.itemForm.remove}
              </button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setImage(file)
              setRemoveImage(false)
            }}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="item-name">
            {t.itemForm.nameLabel}
          </label>
          <input
            id="item-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.itemForm.namePlaceholder}
            maxLength={120}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="item-owner">
            {t.itemForm.ownerLabel}
          </label>
          <select
            id="item-owner"
            className="select"
            value={ownerPerson}
            onChange={(e) => setOwnerPerson(e.target.value)}
          >
            <option value="">{t.common.me}</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <span className="field__hint">{t.itemForm.ownerHint}</span>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="item-description">
            {t.itemForm.descriptionLabel} <span className="field__hint">({t.common.optional})</span>
          </label>
          <textarea
            id="item-description"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.itemForm.descriptionPlaceholder}
            maxLength={2000}
          />
        </div>

        <Alert>{error}</Alert>

        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? t.common.saving : editing ? t.itemForm.saveChanges : t.itemForm.addItem}
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

      {existing ? null : (
        <p className="field__hint" style={{ marginTop: 16 }}>
          {t.itemForm.afterSaveHint}
        </p>
      )}
    </>
  )
}
