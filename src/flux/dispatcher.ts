import type { Action } from './types'
import { logger, resiliencia } from './middleware'
import { useTurnoStore } from './stores/turno'
import { useAtsStore } from './stores/ats'
import { usePermisoStore } from './stores/permiso'
import { useSyncStore, useNetworkStore } from './stores/sync'
import { useBitacoraStore } from './stores/bitacora'

export type Middleware = (a: Action) => void

// Un store devuelve false cuando rechaza la accion. Cualquier otro valor
// significa que la aplico o que no le concernia.
const stores = [useTurnoStore, useAtsStore, usePermisoStore, useNetworkStore, useSyncStore]

let despachando = false

// Punto unico de escritura. Las vistas no tocan los stores directamente.
export function dispatch(action: Action) {
  // Despachar dentro de un despacho rompe el orden del ciclo y deja la
  // bitacora inservible para auditoria. Se corta aqui.
  if (despachando) {
    console.error(`[flux] despacho anidado: ${action.type}`)
    return
  }

  despachando = true
  try {
    logger(action)

    if (action.type === 'bitacora/limpiar') {
      useBitacoraStore.getState().limpiar()
      return
    }

    let rechazada = false
    for (const store of stores) {
      if (store.getState().handle(action) === false) rechazada = true
    }

    // El registro va despues de que los stores decidieron, con el resultado.
    useBitacoraStore.getState().registrar(action, rechazada)

    // Solo lo que realmente ocurrio viaja al servidor.
    if (!rechazada) resiliencia(action)
  } finally {
    despachando = false
  }
}
