import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './features/auth/RequireAuth.jsx'
import { LoginPage, RegisterPage } from './features/auth/AuthPages.jsx'
import HomePage from './pages/HomePage.jsx'
const DiscoverPage = lazy(() => import('./pages/DiscoverPage.jsx'))
const PlacePage = lazy(() => import('./pages/PlacePage.jsx'))
const PlansPage = lazy(() => import('./pages/PlansPages.jsx').then((m) => ({ default: m.PlansPage })))
const PlanPage = lazy(() => import('./pages/PlansPages.jsx').then((m) => ({ default: m.PlanPage })))
const TripsPage = lazy(() => import('./pages/TripsPage.jsx'))
const TripPage = lazy(() => import('./pages/TripPage.jsx'))
const NewTripPage = lazy(() => import('./pages/NewTripPage.jsx'))
const MyTripsPage = lazy(() => import('./pages/MyTripsPage.jsx'))
const StayPage = lazy(() => import('./pages/StayPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

const priv = (el) => <RequireAuth>{el}</RequireAuth>

// Pages load on demand (see the Suspense boundary in Layout); the home page ships in the first bundle.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="places/:slug" element={<PlacePage />} />
        <Route path="stays/:id" element={<StayPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="trips/new" element={priv(<NewTripPage />)} />
        <Route path="trips/:id" element={<TripPage />} />
        <Route path="plans" element={priv(<PlansPage />)} />
        <Route path="plans/:id" element={priv(<PlanPage />)} />
        <Route path="me/trips" element={priv(<MyTripsPage />)} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
