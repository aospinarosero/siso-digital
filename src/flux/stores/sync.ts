import { create } from 'zustand'
import type { Action, EventoEnCola } from '../types'

// En produccion esto va sobre IndexedDB + Background Sync del Service Worker.
// Para el prototipo alcanza localStorage: el contrato de la capa no cambia.
const KEY = 'siso.cola'
const DELAY_SYNC = 900

function leerCola(): EventoEnCola[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

const guardar = (cola: EventoEnCola[]) => localStorage.setItem(KEY, JSON.stringify(cola))

interface NetworkState {
  online: boolean
  handle: (a: Action) => boolean | void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  online: true,
  handle: (a) => {
    if (a.type === 'red/cambiar') set({ online: a.payload.online })
  },
}))

interface SyncState {
  cola: EventoEnCola[]
  sincronizando: boolean
  encolar: (a: Action, online: boolean) => void
  handle: (a: Action) => boolean | void
}

export const useSyncStore = create<SyncState>((set, get) => ({
  cola: leerCola(),
  sincronizando: false,

  // Lo llama el middleware de resiliencia, no las vistas.
  encolar: (action, online) => {
    const ev: EventoEnCola = {
      id: crypto.randomUUID(),
      type: action.type,
      payload: 'payload' in action ? action.payload : null,
      ts: new Date().toISOString(),
      estado: online ? 'sincronizado' : 'en-cola',
    }
    const cola = [...get().cola, ev]
    guardar(cola)
    set({ cola })
  },

  handle: (a) => {
    const drenar = () => {
      set({ sincronizando: true })
      setTimeout(() => {
        const cola = get().cola.map((e) =>
          e.estado === 'en-cola' ? { ...e, estado: 'sincronizado' as const } : e,
        )
        guardar(cola)
        set({ cola, sincronizando: false })
      }, DELAY_SYNC)
    }

    switch (a.type) {
      case 'sync/reintentar':
        if (useNetworkStore.getState().online) drenar()
        break

      case 'red/cambiar':
        // Al volver la red la cola se drena sola, sin que el usuario haga nada.
        if (a.payload.online && get().cola.some((e) => e.estado === 'en-cola')) drenar()
        break

      case 'turno/cerrar':
        guardar([])
        set({ cola: [] })
        break
    }
  },
}))

export const pendientes = (cola: EventoEnCola[]) =>
  cola.filter((e) => e.estado === 'en-cola').length
