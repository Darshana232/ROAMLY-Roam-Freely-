import { Component } from 'react'

// Last line of defence: if a page throws while rendering, show a way out
// instead of unmounting the whole app to a blank screen.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  componentDidUpdate(prev) {
    // Navigating to another page clears the error.
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section role="alert" className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">This page hit a problem</h1>
        <p className="mt-2 text-slate">Something on this page failed to display. Reloading usually fixes it.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
          <a href="/" className="btn-outline">Go home</a>
        </div>
      </section>
    )
  }
}
