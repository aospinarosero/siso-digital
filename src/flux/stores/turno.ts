import { create } from 'zustand'
import type { Action } from '../types'

interface TurnoState {
  abierto: boolean
  obra: string | null
  frente: string | null
  inicio: string | null
  handle: (a: Action) => boolean | void
}

export const useTurnoStore = create<TurnoState>((set) => ({
  abierto: false,
  obra: null,
  frente: null,
  inicio: null,

  handle: (a) => {
    switch (a.type) {
      case 'turno/iniciar':
        set({
          abierto: true,
          obra: a.payload.obra,
          frente: a.payload.frente,
          inicio: new Date().toISOString(),
        })
        break
      case 'turno/cerrar':
        set({ abierto: false, obra: null, frente: null, inicio: null })
        break
    }
  },
}))
