import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from './Icons'

/** Small "go back" affordance at the top of detail and form screens. */
export function BackLink({ label = 'Back' }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      onClick={() => navigate(-1)}
      style={{ marginBottom: 14 }}
    >
      <ChevronLeftIcon />
      {label}
    </button>
  )
}
