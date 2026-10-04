import type { AppServices } from '#/services/app/bootstrapApp'
import type { SessionServices } from '#/services/session/bootstrapSession'

/**
 * The current session's services, if it's ready. For router hooks (`onEnter`, `onStay`…),
 * which run outside React. Lives with the routes: services don't need it.
 * (The `-` prefix keeps this folder out of the route tree.)
 */
export function getSessionServices(app: AppServices): SessionServices | null {
  const auth = app.auth.getState()
  if (auth.status !== 'signedIn') return null
  const session = auth.session.getState()
  return session.status === 'ready' ? session.services : null
}
