import { useEffect, type ReactNode } from 'react'

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />
}

export function Alert({ children, kind = 'error' }: { children: ReactNode; kind?: 'error' | 'info' }) {
  if (!children) return null
  return (
    <div className={kind === 'info' ? 'alert alert--info' : 'alert'} role="alert">
      {children}
    </div>
  )
}

interface EmptyProps {
  icon?: string
  title: string
  children?: ReactNode
}

export function Empty({ icon = '🐟', title, children }: EmptyProps) {
  return (
    <div className="empty">
      <div className="empty__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="empty__title">{title}</div>
      {children ? <p>{children}</p> : null}
    </div>
  )
}

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Stop the page behind the sheet from scrolling with it.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}
