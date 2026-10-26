import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="num font-condensed text-7xl font-extrabold text-ghat-900">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">This road doesn’t go anywhere</h1>
      <p className="mt-2 text-slate">The page you’re looking for doesn’t exist.</p>
      <Link to="/discover" className="btn-primary mt-6">Find a trip</Link>
    </section>
  )
}
