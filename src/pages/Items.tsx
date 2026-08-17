import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listItems } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, fileUrl } from '../lib/pocketbase'
import type { ItemRecord } from '../lib/types'
import { Thumb } from '../components/Thumb'
import { ChevronRightIcon, PlusIcon } from '../components/Icons'
import { Alert, Empty, Spinner } from '../components/ui'

type Owner = 'all' | 'mine' | 'theirs'

export function Items() {
  const { user } = useAuth()
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [owner, setOwner] = useState<Owner>('all')

  useEffect(() => {
    if (!user) return
    listItems(user.id)
      .then(setItems)
      .catch((err) => setError(errorMessage(err, 'Could not load your items.')))
      .finally(() => setLoading(false))
  }, [user])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      if (owner === 'mine' && item.owner_person) return false
      if (owner === 'theirs' && !item.owner_person) return false
      if (!needle) return true
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.description ?? '').toLowerCase().includes(needle) ||
        (item.expand?.owner_person?.name ?? '').toLowerCase().includes(needle)
      )
    })
  }, [items, query, owner])

  if (loading) return <Spinner />

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>Items</h1>
          <p>Everything you track, yours and other people's.</p>
        </div>
        <Link to="/items/new" className="btn btn--sm">
          <PlusIcon />
          Item
        </Link>
      </div>

      <Alert>{error}</Alert>

      {items.length > 0 ? (
        <>
          <input
            className="input search"
            type="search"
            placeholder="Search items…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="filters">
            {(
              [
                ['all', 'All'],
                ['mine', 'Mine'],
                ['theirs', "Someone else's"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="filter"
                aria-pressed={owner === value}
                onClick={() => setOwner(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {items.length === 0 ? (
        <Empty icon="📦" title="No items yet">
          Add the things you want to keep track of — then record a loan against them.
        </Empty>
      ) : visible.length === 0 ? (
        <Empty icon="🔍" title="Nothing matches">
          Try a different search or filter.
        </Empty>
      ) : (
        <div className="stack">
          {visible.map((item) => (
            <Link key={item.id} to={`/items/${item.id}`} className="tile">
              <Thumb src={fileUrl(item, item.image, '100x100')} name={item.name} />
              <div className="tile__body">
                <div className="tile__title">{item.name}</div>
                <div className="tile__sub">
                  {item.expand?.owner_person
                    ? `Belongs to ${item.expand.owner_person.name}`
                    : 'Yours'}
                </div>
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
