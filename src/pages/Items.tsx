import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listItems } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, fileUrl } from '../lib/pocketbase'
import type { ItemRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Thumb } from '../components/Thumb'
import { ChevronRightIcon, PlusIcon } from '../components/Icons'
import { Alert, Empty, Spinner } from '../components/ui'

type Owner = 'all' | 'mine' | 'theirs'

export function Items() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [owner, setOwner] = useState<Owner>('all')

  useEffect(() => {
    if (!user) return
    listItems(user.id)
      .then(setItems)
      .catch((err) => setError(errorMessage(err, t.items.couldNotLoad)))
      .finally(() => setLoading(false))
  }, [user, t])

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
          <h1>{t.items.title}</h1>
          <p>{t.items.subtitle}</p>
        </div>
        <Link to="/items/new" className="btn btn--sm">
          <PlusIcon />
          {t.items.itemButton}
        </Link>
      </div>

      <Alert>{error}</Alert>

      {items.length > 0 ? (
        <>
          <input
            className="input search"
            type="search"
            placeholder={t.items.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="filters">
            {(
              [
                ['all', t.items.filterAll],
                ['mine', t.items.filterMine],
                ['theirs', t.items.filterTheirs],
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
        <Empty icon="📦" title={t.items.noItemsTitle}>
          {t.items.noItemsBody}
        </Empty>
      ) : visible.length === 0 ? (
        <Empty icon="🔍" title={t.items.noMatchTitle}>
          {t.items.noMatchBody}
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
                    ? t.items.belongsTo(item.expand.owner_person.name)
                    : t.items.yours}
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
