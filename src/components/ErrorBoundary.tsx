import { Component, type ReactNode } from 'react'

interface Props {
  fallback: (error: Error, reset: () => void) => ReactNode
  children: ReactNode
}

/** Catches what a `use()`d promise rejects with. React only offers this as a class component. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.reset) : this.props.children
  }
}
