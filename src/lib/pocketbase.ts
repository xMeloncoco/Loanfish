import PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'

let url = import.meta.env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8090'

// Browsers block http:// requests from an https:// page as mixed content.
// If VITE_POCKETBASE_URL was left on http:// (easy to miss when only the
// PocketBase host, not the scheme, changes between environments), upgrade
// it to https:// so the app keeps working instead of failing every request.
if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
  url = url.replace(/^http:\/\//, 'https://')
}

export const pb = new PocketBase(url)

// The dashboard fires several requests at once and React's StrictMode runs
// effects twice in dev. Auto-cancellation would kill the duplicates and surface
// them as errors, so we opt out and handle staleness ourselves.
pb.autoCancellation(false)

/** URL for a file stored on a record, optionally a generated thumbnail. */
export function fileUrl(
  record: RecordModel,
  filename: string | undefined,
  thumb?: string,
): string | undefined {
  if (!filename) return undefined
  return pb.files.getURL(record, filename, thumb ? { thumb } : undefined)
}

/**
 * PocketBase date fields want `YYYY-MM-DD HH:mm:ss.sssZ`. We only care about
 * the day, so everything is pinned to midnight UTC — that way a date never
 * shifts a day backwards or forwards depending on who is looking at it.
 */
export function toPbDate(value: string): string {
  if (!value) return ''
  return `${value} 00:00:00.000Z`
}

/** Inverse of `toPbDate`: a stored timestamp back to a `<input type="date">` value. */
export function toDateInput(value: string | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

/** Human-readable date, e.g. "3 Feb 2026". Empty string for no date. */
export function formatDate(value: string | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Today as a `<input type="date">` value, in the viewer's own timezone. */
export function todayInput(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/** Pull something readable out of whatever PocketBase threw at us. */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!error || typeof error !== 'object') return fallback

  const response = (error as { response?: Record<string, unknown> }).response
  if (response) {
    const data = response.data as Record<string, { message?: string }> | undefined
    if (data) {
      const fieldErrors = Object.entries(data)
        .map(([field, detail]) => (detail?.message ? `${field}: ${detail.message}` : null))
        .filter(Boolean)
      if (fieldErrors.length) return fieldErrors.join('\n')
    }
    if (typeof response.message === 'string' && response.message) {
      return response.message
    }
  }

  const message = (error as { message?: string }).message
  return message || fallback
}
