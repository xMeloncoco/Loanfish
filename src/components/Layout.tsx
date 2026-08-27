import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { BoxIcon, HistoryIcon, HomeIcon, LogoutIcon, PeopleIcon, SwapIcon } from './Icons'

const TABS = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/items', label: 'Items', Icon: BoxIcon, end: false },
  { to: '/persons', label: 'People', Icon: PeopleIcon, end: false },
  { to: '/loans', label: 'Loans', Icon: SwapIcon, end: false },
  { to: '/history', label: 'History', Icon: HistoryIcon, end: false },
]

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      {/* Kept together so the tab row stays pinned under the header on wider
          screens instead of scrolling away with the page content. */}
      <div className="app__header">
        <header className="topbar">
          <span className="topbar__brand">
            <span className="topbar__logo" aria-hidden="true">
              🐟
            </span>
            Loanfish
          </span>
          <span className="topbar__spacer" />
          <button
            type="button"
            className="icon-btn"
            onClick={logout}
            title={user?.email ? `Sign out (${user.email})` : 'Sign out'}
          >
            <LogoutIcon />
            <span className="sr-only">Sign out</span>
          </button>
        </header>

        {/* Fixed to the bottom of the screen on phones, a row under the header
            on wider screens. Same markup either way. */}
        <nav className="tabbar" aria-label="Main navigation">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="tabbar__link">
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
