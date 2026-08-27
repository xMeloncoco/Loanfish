import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/pocketbase'
import { useI18n } from '../lib/i18n'
import { Alert } from '../components/ui'

export function Login() {
  const { login, register } = useAuth()
  const { t } = useI18n()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const registering = mode === 'register'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (registering) {
        await register(email.trim(), password, name.trim())
      } else {
        await login(email.trim(), password)
      }
    } catch (err) {
      setError(
        errorMessage(
          err,
          registering ? t.login.couldNotCreateAccount : t.login.wrongCredentials,
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <div className="auth__logo" aria-hidden="true">
            🐟
          </div>
          <h1>Loanfish</h1>
          <p>{t.login.tagline}</p>
        </div>

        <div className="card card--pad">
          <form className="form" onSubmit={handleSubmit}>
            {registering ? (
              <div className="field">
                <label className="field__label" htmlFor="name">
                  {t.login.yourName}
                </label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            ) : null}

            <div className="field">
              <label className="field__label" htmlFor="email">
                {t.login.email}
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                {t.login.password}
              </label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={registering ? 'new-password' : 'current-password'}
                minLength={8}
                required
              />
              {registering ? (
                <span className="field__hint">{t.login.passwordHint}</span>
              ) : null}
            </div>

            <Alert>{error}</Alert>

            <button className="btn btn--block" type="submit" disabled={busy}>
              {busy ? t.login.pleaseWait : registering ? t.login.createAccount : t.login.signIn}
            </button>
          </form>
        </div>

        <p className="auth__switch">
          {registering ? t.login.alreadyHaveAccount : t.login.noAccountYet}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(registering ? 'login' : 'register')
              setError('')
            }}
          >
            {registering ? t.login.signIn : t.login.createOne}
          </button>
        </p>
      </div>
    </div>
  )
}
