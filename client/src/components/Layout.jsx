import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useLogout, useMe } from '../features/auth/useAuth.js'
import ErrorBoundary from './ErrorBoundary.jsx'
import { useAlerts } from '../features/trips/useTrips.js'

const NAV = [
  { to: '/discover', label: 'Find a trip' },
  { to: '/trips', label: 'Group trips' },
  { to: '/plans', label: 'My plans', auth: true },
  { to: '/me/trips', label: 'My trips', auth: true },
]

const navClass = ({ isActive }) =>
  `rounded-control px-3 py-2 text-[15px] font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-white/75 hover:text-white'
  }`

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-white" aria-label="Roamly home">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <path d="M6 30V14a10 10 0 0 1 20 0v16z" fill="#fff" />
        <path d="M7 14a9 9 0 0 1 18 0z" fill="#F5C518" />
        <path d="M11 21h10M11 25h7" stroke="#0F2E24" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="font-wide text-xl font-extrabold tracking-tight">Roamly</span>
    </Link>
  )
}

export default function Layout() {
  const { data: user } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { data: alerts } = useAlerts(Boolean(user))
  const alertCount = alerts ? alerts.toReview + alerts.decisions.length : 0

  const navItem = (n) => (
    <NavLink key={n.to} to={n.to} className={navClass}>
      {n.label}
      {n.to === '/me/trips' && alertCount > 0 && (
        <span className="num ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-milestone px-1.5 text-xs font-bold text-asphalt">
          {alertCount}
          <span className="sr-only"> {alertCount === 1 ? 'update' : 'updates'}</span>
        </span>
      )}
    </NavLink>
  )

  // Close the mobile menu after navigating, and start each page at the top.
  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const items = NAV.filter((n) => !n.auth || user)

  async function onLogout() {
    await logout.mutateAsync()
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 bg-ghat-900">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {items.map(navItem)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="text-sm text-white/70">{user.name}</span>
                <button type="button" onClick={onLogout} className="btn px-3 text-white/90 hover:bg-white/10">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn px-3 text-white/90 hover:bg-white/10">Log in</Link>
                <Link to="/register" className="btn-go">Sign up</Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn relative -mr-2 px-2 text-white md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
            {!open && alertCount > 0 && <span className="absolute right-1 top-2 size-2.5 rounded-full bg-milestone" aria-hidden />}
            <span className="sr-only">{open ? 'Close menu' : `Open menu${alertCount ? `, ${alertCount} updates` : ''}`}</span>
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden" aria-label="Main">
            <div className="flex flex-col">
              {items.map(navItem)}
            </div>
            <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
              {user ? (
                <button type="button" onClick={onLogout} className="btn-outline flex-1">Log out {user.name}</button>
              ) : (
                <>
                  <Link to="/login" className="btn-outline flex-1">Log in</Link>
                  <Link to="/register" className="btn-go flex-1">Sign up</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<div className="mx-auto max-w-[1200px] px-4 py-10"><div className="skeleton h-64" /></div>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="mt-16 border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-8 text-sm text-slate sm:flex-row sm:justify-between">
          <p>Distances, times and costs are estimates. Check bus timings and prices before you travel.</p>
          <p>
            Place descriptions and photos from{' '}
            <a className="link" href="https://www.wikipedia.org/" target="_blank" rel="noreferrer">Wikipedia</a> and{' '}
            <a className="link" href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Wikimedia Commons</a>.
          </p>
        </div>
      </footer>
    </div>
  )
}
