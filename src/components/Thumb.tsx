interface ThumbProps {
  src?: string
  name: string
  size?: 'md' | 'lg'
  round?: boolean
}

/** Image if there is one, otherwise the first letter of the name. */
export function Thumb({ src, name, size = 'md', round = false }: ThumbProps) {
  const classes = [
    'thumb',
    size === 'lg' ? 'thumb--lg' : '',
    round ? 'thumb--round' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (src) {
    return <img className={classes} src={src} alt="" loading="lazy" />
  }

  return (
    <div className={`${classes} thumb--fallback`} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}
