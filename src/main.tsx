import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import { initLogger } from './services/global/logger'
import { initErrorReporter, reportError } from './services/global/errorReporter'
import { initNotifier } from './services/global/notifier'

import { bootstrapApp } from './services/app/bootstrapApp'

import { Spinner } from './components/Spinner'
import { ErrorScreen } from './components/ErrorScreen'

import { createAppRouter } from './router'
import './styles.css'

// First, before anything logs, reports or notifies: create the global singletons with this app's details.
initLogger({ scopeColors: { global: '#0891b2', app: '#2563eb', session: '#7c3aed' } })
initErrorReporter({ tags: { app: 'scribe', environment: import.meta.env.MODE } })
initNotifier({ autoDismissMs: 4000 })

const root = ReactDOM.createRoot(document.getElementById('app')!)

/** Services are bootstrapped *before* React renders the app. React just displays the outcome. */
async function start() {
  root.render(<Spinner label="Starting app…" />)
  try {
    const app = await bootstrapApp()
    // The router context is the only way services reach routes and components.
    root.render(<RouterProvider router={createAppRouter(app)} />)
  } catch (error) {
    reportError(error, { scope: 'app' })
    root.render(<ErrorScreen error={error as Error} onRetry={start} />)
  }
}

void start()
