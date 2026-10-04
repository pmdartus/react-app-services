import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AppServices } from '#/bootstrap/bootstrapApp'
import { Toasts } from '#/components/Toasts'

export interface RouterContext {
  app: AppServices
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toasts />
    </>
  ),
})
