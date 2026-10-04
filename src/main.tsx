import { Suspense, use } from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { bootstrapApp, type AppServices } from './bootstrap/bootstrapApp'
import { AppServicesContext } from './react/AppServicesContext'
import { Spinner } from './components/Spinner'
import { ErrorScreen } from './components/ErrorScreen'
import './styles.css'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  context: { app: undefined! }, // provided by <App>, once bootstrapped
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

/**
 * Bootstrapping starts here, outside React. React only waits for the promise (Suspense)
 * and shows its failure (error boundary). Retry starts a fresh bootstrap.
 */
function startApp(): Promise<AppServices> {
  return bootstrapApp().then((app) => {
    // When the session ends (sign-out), re-run the route guards so they redirect to /login.
    app.session.subscribe(() => {
      if (app.session.getState().status === 'idle') void router.invalidate()
    })
    return app
  })
}

let appPromise = startApp()

function App() {
  const app = use(appPromise)
  return (
    <AppServicesContext value={app}>
      <RouterProvider router={router} context={{ app }} />
    </AppServicesContext>
  )
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <ErrorBoundary
    onReset={() => (appPromise = startApp())}
    fallbackRender={({ error, resetErrorBoundary }) => (
      <ErrorScreen error={error} onRetry={resetErrorBoundary} />
    )}
  >
    <Suspense fallback={<Spinner label="Starting app…" />}>
      <App />
    </Suspense>
  </ErrorBoundary>,
)
