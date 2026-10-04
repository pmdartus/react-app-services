import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { createAppRouter } from './router'
import { bootstrapApp, type AppServices } from './services/app/bootstrapApp'
import { reportError } from './services/global/errorReporter'
import { AppServicesContext } from './context/AppServicesContext'
import { Spinner } from './components/Spinner'
import { ErrorScreen } from './components/ErrorScreen'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('app')!)

/** Services are bootstrapped *before* React renders the app. React just displays the outcome. */
async function start() {
  root.render(<Spinner label="Starting app…" />)
  try {
    const app = await bootstrapApp()
    root.render(<App app={app} router={createAppRouter(app)} />)
  } catch (error) {
    reportError(error, { scope: 'app' })
    root.render(<ErrorScreen error={error as Error} onRetry={start} />)
  }
}

function App({ app, router }: { app: AppServices; router: ReturnType<typeof createAppRouter> }) {
  return (
    <AppServicesContext value={app}>
      <RouterProvider router={router} />
    </AppServicesContext>
  )
}

void start()
