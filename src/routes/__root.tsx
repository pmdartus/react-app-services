import type { ComponentType } from 'react'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AppServices } from '#/services/app/bootstrapApp'
import { Toasts } from '#/components/Toasts'

export interface RouterContext {
  app: AppServices
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Shown in place of the screen while it can't render yet (e.g. the session is loading). */
    placeholder?: ComponentType
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toasts />
    </>
  ),
})
