import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthMutation } from './useAuth.js'
import { InlineError, Spinner, fieldErrors } from '../../components/States.jsx'

const DEMO = { email: 'demo@roamly.app', password: 'roamly-demo-2026' }

// Only allow redirects back into this app, never to another site.
function safeNext(params) {
  const next = params.get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/discover'
}

function Shell({ title, children, footer }) {
  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-[36px] font-extrabold">{title}</h1>
      <div className="mt-6">{children}</div>
      <p className="mt-6 text-sm text-slate">{footer}</p>
    </section>
  )
}

function Field({ label, error, hint, ...props }) {
  const id = `f-${props.name}`
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="field" aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-msg` : undefined} {...props} />
      {(error || hint) && (
        <p id={`${id}-msg`} className={`mt-1 text-sm ${error ? 'text-signal' : 'text-slate'}`}>{error ?? hint}</p>
      )}
    </div>
  )
}

export function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const login = useAuthMutation('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const errors = fieldErrors(login.error)

  const submit = (body) => login.mutate(body, { onSuccess: () => navigate(safeNext(params), { replace: true }) })

  return (
    <Shell
      title="Log in"
      footer={<>New here? <Link className="link" to={`/register?${params}`}>Create an account</Link></>}
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit(form)
        }}
      >
        <Field label="Email" name="email" type="email" autoComplete="email" required value={form.email}
          error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required value={form.password}
          error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {login.error && !Object.keys(errors).length && <InlineError error={login.error} />}
        <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
          {login.isPending && <Spinner />} Log in
        </button>
      </form>

      <div className="mt-6 rounded-surface bg-ghat-100 p-4">
        <p className="text-sm">
          <span className="font-semibold">Just looking?</span> The demo account has an upcoming group trip, a pending
          request and a finished trip it can review stays for.
        </p>
        <button type="button" className="btn-outline mt-3 w-full" disabled={login.isPending} onClick={() => submit(DEMO)}>
          Use the demo account
        </button>
      </div>
    </Shell>
  )
}

const GENDER_OPTIONS = [
  ['prefer-not-to-say', 'Prefer not to say'],
  ['woman', 'Woman'],
  ['man', 'Man'],
  ['non-binary', 'Non-binary'],
]

export function RegisterPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const register = useAuthMutation('register')
  const [form, setForm] = useState({ name: '', email: '', password: '', gender: 'prefer-not-to-say' })
  const errors = fieldErrors(register.error)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <Shell title="Create your account" footer={<>Already have one? <Link className="link" to={`/login?${params}`}>Log in</Link></>}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          register.mutate(form, { onSuccess: () => navigate(safeNext(params), { replace: true }) })
        }}
      >
        <Field label="Name" name="name" autoComplete="name" required value={form.name} error={errors.name} onChange={set('name')} />
        <Field label="Email" name="email" type="email" autoComplete="email" required value={form.email} error={errors.email} onChange={set('email')} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" required value={form.password}
          error={errors.password} hint="At least 8 characters" onChange={set('password')} />
        <div>
          <label htmlFor="f-gender" className="field-label">Gender</label>
          <select id="f-gender" className="field" value={form.gender} onChange={set('gender')} aria-describedby="f-gender-msg">
            {GENDER_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <p id="f-gender-msg" className="mt-1 text-sm text-slate">
            Never shown on your profile. Only used so you can host or join women-only trips.
          </p>
        </div>
        {register.error && !Object.keys(errors).length && <InlineError error={register.error} />}
        <button type="submit" className="btn-primary w-full" disabled={register.isPending}>
          {register.isPending && <Spinner />} Create account
        </button>
      </form>
    </Shell>
  )
}
