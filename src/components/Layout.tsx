import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useI18n, type Lang } from '../lib/i18n'
import { BoxIcon, HistoryIcon, HomeIcon, LogoutIcon, PeopleIcon, SwapIcon } from './Icons'

export function Layout() {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useI18n()

  const TABS = [
    { to: '/', label: t.layout.home, Icon: HomeIcon, end: true },
    { to: '/items', label: t.layout.items, Icon: BoxIcon, end: false },
    { to: '/persons', label: t.layout.people, Icon: PeopleIcon, end: false },
    { to: '/loans', label: t.layout.loans, Icon: SwapIcon, end: false },
    { to: '/history', label: t.layout.history, Icon: HistoryIcon, end: false },
  ]

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
          <LanguageToggle lang={lang} onChange={setLang} />
          <button
            type="button"
            className="icon-btn"
            onClick={logout}
            title={user?.email ? t.layout.signOutWithEmail(user.email) : t.layout.signOut}
          >
            <LogoutIcon />
            <span className="sr-only">{t.layout.signOut}</span>
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

function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={lang === 'en' ? 'lang-toggle__option lang-toggle__option--active' : 'lang-toggle__option'}
        aria-pressed={lang === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === 'nl' ? 'lang-toggle__option lang-toggle__option--active' : 'lang-toggle__option'}
        aria-pressed={lang === 'nl'}
        onClick={() => onChange('nl')}
      >
        NL
      </button>
    </div>
  )
}
