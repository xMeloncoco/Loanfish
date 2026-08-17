interface IconProps {
  className?: string
}

// width/height are attributes rather than CSS so an icon always has a sane
// size even where no rule targets it. Any CSS rule still overrides them.
const base = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const HomeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6" />
  </svg>
)

export const BoxIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
)

export const PeopleIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
    <circle cx="9.5" cy="7.5" r="3.5" />
    <path d="M21 20v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M16.5 4.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const HistoryIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 12a9 9 0 1 0 2.6-6.36" />
    <path d="M3 4v4h4" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
)

export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)

export const LogoutIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M15 20H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9" />
    <path d="m16 15 3-3-3-3" />
    <path d="M19 12H9" />
  </svg>
)

export const CameraIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 8h3l1.6-2.2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.2" r="3.4" />
  </svg>
)

export const TrashIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5h5v2" />
    <path d="M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
    <path d="M10 11v5M14 11v5" />
  </svg>
)

export const ArrowOutIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 12h13" />
    <path d="m13 7 5 5-5 5" />
    <path d="M20 4v16" />
  </svg>
)

export const ArrowInIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20 12H7" />
    <path d="m11 7-5 5 5 5" />
    <path d="M4 4v16" />
  </svg>
)
