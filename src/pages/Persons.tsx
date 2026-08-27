import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPersons } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/pocketbase'
import type { PersonRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Thumb } from '../components/Thumb'
import { ChevronRightIcon, PlusIcon } from '../components/Icons'
import { Alert, Empty, Spinner } from '../components/ui'

export function Persons() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [persons, setPersons] = useState<PersonRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!user) return
    listPersons(user.id)
      .then(setPersons)
      .catch((err) => setError(errorMessage(err, t.persons.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [user, t])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return persons
    return persons.filter(
      (person) =>
        person.name.toLowerCase().includes(needle) ||
        (person.notes ?? '').toLowerCase().includes(needle),
    )
  }, [persons, query])

  if (loading) return <Spinner />

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t.persons.title}</h1>
          <p>{t.persons.subtitle}</p>
        </div>
        <Link to="/persons/new" className="btn btn--sm">
          <PlusIcon />
          {t.persons.personButton}
        </Link>
      </div>

      <Alert>{error}</Alert>

      {persons.length > 3 ? (
        <input
          className="input search"
          type="search"
          placeholder={t.persons.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      ) : null}

      {persons.length === 0 ? (
        <Empty icon="🧑‍🤝‍🧑" title={t.persons.noPeopleTitle}>
          {t.persons.noPeopleBody}
        </Empty>
      ) : visible.length === 0 ? (
        <Empty icon="🔍" title={t.persons.noMatchTitle}>
          {t.persons.noMatchBody}
        </Empty>
      ) : (
        <div className="stack">
          {visible.map((person) => (
            <Link key={person.id} to={`/persons/${person.id}`} className="tile">
              <Thumb name={person.name} round />
              <div className="tile__body">
                <div className="tile__title">{person.name}</div>
                {person.notes ? (
                  <div className="tile__sub">{person.notes}</div>
                ) : null}
              </div>
              <span className="chev">
                <ChevronRightIcon />
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
