import type { Action } from './types'
import { AUDITABLES } from './types'
import { useSyncStore, useNetworkStore } from './stores/sync'

type Middleware = (a: Action) => void

export const logger: Middleware = (a) => {
  if (import.meta.env?.DEV) console.debug('[flux]', a.type, a)
}

export const resiliencia: Middleware = (a) => {
  if (!AUDITABLES.includes(a.type)) return
  useSyncStore.getState().encolar(a, useNetworkStore.getState().online)
}
