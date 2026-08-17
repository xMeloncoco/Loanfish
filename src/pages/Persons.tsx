import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPersons } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/pocketbase'
import type { PersonRecord } from '../lib/types'
import { Thumb } from '../components/Thumb'
import { ChevronRightIcon, PlusIcon } from '../components/Icons'
import { Alert, Empty, Spinner } from '../components/ui'

export function Persons() {
  const { user } = useAuth()
  const [persons, setPersons] = useState<PersonRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!user) return
    listPersons(user.id)
      .then(setPersons)
      .catch((err) => setError(errorMessage(err, 'Could not load your people.')))
      .finally(() => setLoading(false))
  }, [user])

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
          <h1>People</h1>
          <p>Your own list. They don't need an account.</p>
        </div>
        <Link to="/persons/new" className="btn btn--sm">
          <PlusIcon />
          Person
        </Link>
      </div>

      <Alert>{error}</Alert>

      {persons.length > 3 ? (
        <input
          className="input search"
          type="search"
          placeholder="Search people…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      ) : null}

      {persons.length === 0 ? (
        <Empty icon="🧑‍🤝‍🧑" title="No people yet">
          Add the people you lend things to and borrow things from.
        </Empty>
      ) : visible.length === 0 ? (
        <Empty icon="🔍" title="Nothing matches">
          Try a different search.
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
