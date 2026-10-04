import ReactDOM from 'react-dom/client'
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
  context: { app: undefined! }, // provided below, once bootstrapped
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = ReactDOM.createRoot(document.getElementById('app')!)

/** Services are bootstrapped *before* React renders the app. React just displays the outcome. */
async function start() {
  root.render(<Spinner label="Starting app…" />)
  try {
    const app = await bootstrapApp()
    root.render(<App app={app} />)
  } catch (error) {
    root.render(<ErrorScreen error={error as Error} onRetry={start} />)
  }
}

function App({ app }: { app: AppServices }) {
  return (
    <AppServicesContext value={app}>
      <RouterProvider router={router} context={{ app }} />
    </AppServicesContext>
  )
}

void start()
