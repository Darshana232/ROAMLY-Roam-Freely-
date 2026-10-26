import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from './useAuth.js'
import { ErrorState } from '../../components/States.jsx'

// Client-side guard for private pages. The real protection is on the server;
// this just sends people to log in and brings them back afterwards.
export default function RequireAuth({ children }) {
  const { data: user, isPending, error, refetch } = useMe()
  const location = useLocation()

  if (isPending) return <div className="mx-auto max-w-5xl px-4 py-10"><div className="skeleton h-40" /></div>
  if (error) return <div className="mx-auto max-w-5xl px-4 py-10"><ErrorState error={error} onRetry={refetch} /></div>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return children
}
