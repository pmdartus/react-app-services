# React app with services outside the React tree

A small medical scribe app (encounters, notes, settings) built to show one idea: **business logic lives in plain TypeScript services, React only displays it.**

- Services are classes behind an interface: state + commands + lifecycle (`init` / `dispose`).
- Nothing under `src/services/` imports React or TanStack (`npm run check:layers` enforces it).
- Services and their state are **owned outside React and the router**: plain bootstrap functions create and dispose them, not providers, routes or `useEffect`.
- Hooks are thin adapters: get the service, `useSyncExternalStore`, return state + commands.

```sh
npm install
npm run dev            # http://localhost:3000
npm run build          # check:layers → tsc -b → vite build
```

## Service types

Services are grouped by **scope**, which says how long they live. The folder is the scope.

| Scope | Folder | Services | Created | Disposed |
|---|---|---|---|---|
| Global | `services/global/` | `logger`, `notifier`, `errorReporter` | `initXxx()` in `main.tsx`, first thing | never |
| App | `services/app/` | `storage`, `auth`, `sessionHost` | `bootstrapApp()`, before React renders | never in normal use |
| Session | `services/session/` | `apiClient`, `userSettings` | `bootstrapSession()`, on sign-in | on sign-out |

`services/shared/` holds helpers (`Store`, `Disposable`, …), not services.

**Global** services are module singletons: one per page, no dependencies, no async setup, used almost everywhere. React code imports them directly. Services receive `notifier` and `reportError` through their dependencies instead, so a test can pass a fake. `logger` is the exception and is imported everywhere. Never use a global at module load time: it doesn't exist until `main.tsx` calls its `initXxx()`.

**App** and **session** services are always injected. Each one declares what it needs in an `XxxDependencies` interface.

## How services and state are structured

Every service follows the same shape ([`userSettings.ts`](src/services/session/userSettings.ts) is a typical one):

```ts
export interface UserSettingsService extends Disposable {
  init(): Promise<void>                        // async setup
  subscribe(listener: () => void): () => void  // reactive state...
  getState(): UserSettings                     // ...for useSyncExternalStore
  update(patch: Partial<UserSettings>): Promise<void>  // commands
}

export interface UserSettingsDependencies { apiClient: ApiClient; storage: StorageService; notifier: Notifier; … }

class UserSettingsStore extends Store<UserSettings> implements UserSettingsService { … }

export function createUserSettingsService(deps: UserSettingsDependencies): UserSettingsService { … }
```

Conventions:

- **Constructor** only stores dependencies. No I/O, timers or subscriptions.
- **`init()`** does the async setup. **`dispose()`** undoes it, and is safe to call even if `init()` never ran or failed.
- **State** goes through the [`Store`](src/services/shared/store.ts) helper: `getState()` returns the same reference until `setState()` is called again.

**Not every service needs to be reactive.** Only `userSettings` and `notifier` hold state the UI must follow, so only they extend `Store`. The others (`storage`, `auth`, `sessionHost`, `apiClient`) are plain objects with methods and promises. The router reads them on navigation, and loaders await them. Make a service reactive only when a screen has to re-render when its state changes.

**`Store` is a placeholder, not a recommendation.** It's the smallest thing that works with `useSyncExternalStore`, used here for lack of a better standard. Any reactivity primitive that lives outside React fits the same pattern: signals (Preact Signals, the TC39 proposal), observables (RxJS), MobX, or a vanilla Zustand / Jotai store. Only the hooks need to change.
- **No cycles.** A service uses its own scope and outer ones (`session` → `app` → `global` → `shared`). Only an *owner* may reach one scope inward to create it, and the only owner is `sessionHost`.

**Bootstrap functions are the composition roots** ([`bootstrapApp.ts`](src/services/app/bootstrapApp.ts), [`bootstrapSession.ts`](src/services/session/bootstrapSession.ts)). They:

1. **wire** every service by hand, and write `dispose()` in reverse creation order,
2. **initialize** them in dependency order,
3. if any `init()` throws, dispose everything and rethrow.

They resolve only when everything is ready, so nothing ever sees an uninitialized service.

**React reaches services through hooks** ([`hooks/useServices.ts`](src/hooks/useServices.ts)):

```ts
const { sessionHost } = useAppServices()          // anywhere
const { userSettings } = useSessionServices()     // under the authenticated layout

export function useUserSettings() {
  const { userSettings } = useSessionServices()
  const settings = useSyncExternalStore(userSettings.subscribe, userSettings.getState)
  return { settings, update: userSettings.update }
}
```

**Owned outside, exposed inside.** The bootstraps own the services, and `sessionHost` owns the session. React and the router only receive references to them: `main.tsx` passes the app services into the router context, so route guards, loaders and components can all reach them. The router never creates or disposes a service, and replacing it wouldn't change who owns what.

## Session-bound services

Session services hold per-user data, so they must exist **exactly while a user is signed in**, and never leak to the next user.

```mermaid
flowchart LR
  sessionHost -- "signIn(): auth.signIn() then open" --> session
  sessionHost -- "signOut(): detach, navigate away, then dispose" --> session
  session -- "bootstrapSession()" --> services["apiClient, userSettings"]
```

**[`sessionHost`](src/services/app/sessionHost.ts)** (app scope) owns the session. It is the only place sign-in and sign-out happen:

- `signIn(email)` calls `auth.signIn()`, then creates a `Session` for that user (disposing any previous one).
- `signOut()` calls `auth.signOut()`, makes `current()` return `null`, lets the caller navigate away, *then* disposes the session.
- `current()` returns the active `Session` or `null`. It's the only way to reach session services.
- On startup, `init()` reopens the session of a user restored from storage.

`auth` only knows who the user is. It knows nothing about sessions, and `AppServices` exposes it read-only, so nobody can sign out without going through `sessionHost`.

**[`Session`](src/services/session/session.ts)** wraps one sign-in:

- `ready()` returns a promise of the session services (the same promise until a retry).
- `retry()` starts a new bootstrap after a failure.
- `dispose()` disposes the services. A bootstrap that finishes *after* sign-out is discarded, so no half-built services survive.

**The router gates on it** ([`routes/_authenticated.tsx`](src/routes/_authenticated.tsx)):

```ts
beforeLoad: async ({ context, location }) => {
  const session = context.app.sessionHost.current()
  if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
  return { user: session.user, session: await session.ready() }
},
```

Every child route then gets a non-null `context.session`, in its loader and its components. While the session loads, the layout shows a placeholder (`pendingComponent`). If it fails, it shows an error screen whose Retry calls `session.retry()` and `router.invalidate()`.

**Load only what every screen needs.** `bootstrapSession` only initializes `userSettings`. Screen-specific data (the encounters list, a note) is loaded by the route loaders through `apiClient`, so opening Settings doesn't wait for encounters. On sign-out, `useLogout()` also clears the router cache, so the next user never sees the previous user's data.

## How the app starts

Startup is a chain of async steps. Each step has its own loading and error UI, and each one only blocks what depends on it.

| Step | Where | Waits for | Loading UI | On failure |
|---|---|---|---|---|
| 1. Globals | `main.tsx`: `initLogger()`, `initNotifier()`, … | nothing (sync) | — | — |
| 2. App services | `main.tsx`: `await bootstrapApp()` | `storage`, `auth`, `sessionHost` | full-page spinner | full-page error, Retry reruns `bootstrapApp()` |
| 3. Router | `main.tsx`: renders `RouterProvider`, exposing the app services in its context | — | — | — |
| 4. Session | `_authenticated` route: `await session.ready()` | `bootstrapSession()` | placeholder of the screen being opened | error inside the layout, top bar still works |
| 5. Screen data | route `loader`, e.g. `/encounters` | `apiClient.listEncounters()` | that route's `pendingComponent` | that route's `errorComponent` |
| 6. Part of a screen | `<Await>` on a promise the loader didn't await | e.g. an encounter's note | `<NotePlaceholder />` | an `ErrorBoundary` around it, with Retry |

Some details:

- **React renders nothing meaningful until step 2 resolves.** `main.tsx` renders a spinner, then either the router or an error screen. Nothing needs a `useEffect` or an "is the service ready?" check: by the time a component runs, its services exist.
- **The app doesn't wait for the session.** `sessionHost.init()` starts the session bootstrap without awaiting it, so steps 2 and 4 overlap, and the router waits on `session.ready()` itself.
- **Placeholders are shaped like the real screen** ([`components/Placeholders.tsx`](src/components/Placeholders.tsx)), so the layout doesn't jump. The router shows the `pendingComponent` of the topmost route that isn't on screen yet. On a cold load that's the session gate, which borrows the placeholder of the first child route that declares one (or shows a spinner, for screens like Settings that only need the session).
- **Start fetches early, and await them as late as possible.** The encounter route starts fetching the note before it looks up the encounter, and returns the promise without awaiting it. The header renders right away, and only the note area waits.

## Try it

Open the DevTools console: every service logs its lifecycle (`+ created`, `✓ init`, `✗ disposed`) with its scope. Init phases also show up as User Timing measures in the Performance panel.

- **Sign in, then log out from Settings.** Session services are disposed in reverse creation order.
- **Log out while the workspace is loading.** The half-built session is discarded.
- **Failure flags** (each one fails only the first attempt, so Retry succeeds):
  - `?fail=storage` or `?fail=auth`: the app fails to start, and you get a full-page error.
  - `?fail=userSettings`: the session fails. The error shows inside the layout, and the top bar still works.
  - `?fail=encounters`, `?fail=note`: one route or one part of a screen fails.

Run `localStorage.clear()` to start signed out.

## Rule of thumb

Keep visual, component-scoped state in React (form drafts, open/hover state). Extract a service when the behavior must outlive a component, be shared across the UI, be called from non-React code, or be tested without rendering.
