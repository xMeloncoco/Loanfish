import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { ChevronLeftIcon } from './Icons'

/** Small "go back" affordance at the top of detail and form screens. */
export function BackLink({ label }: { label?: string }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const text = label ?? t.common.back
  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      onClick={() => navigate(-1)}
      style={{ marginBottom: 14 }}
    >
      <ChevronLeftIcon />
      {text}
    </button>
  )
}
