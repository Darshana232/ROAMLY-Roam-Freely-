import { AlertTriangle, Loader2 } from 'lucide-react'
import { errorMessage } from '../lib/api.js'

export function ErrorState({ error, onRetry, title = 'That didn’t load' }) {
  return (
    <div role="alert" className="surface flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
      <AlertTriangle className="size-5 shrink-0 text-signal" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-slate">{errorMessage(error)}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-surface border border-dashed border-asphalt/20 px-6 py-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-slate">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function InlineError({ error }) {
  if (!error) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-control bg-signal/[0.06] px-3 py-2 text-sm text-signal">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {typeof error === 'string' ? error : errorMessage(error)}
    </p>
  )
}

export function Spinner({ className = 'size-4' }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden />
}

// Field-level messages from the API's { details: [{ field, message }] }.
export function fieldErrors(error) {
  const details = error?.response?.data?.error?.details
  if (!Array.isArray(details)) return {}
  return Object.fromEntries(details.map((d) => [d.field, d.message]))
}
