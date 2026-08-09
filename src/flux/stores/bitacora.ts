import { create } from 'zustand'
import type { Action, LogEntry } from '../types'
import { AUDITABLES } from '../types'

// Registro de lo que efectivamente paso. Es lo que permite reconstruir el
// orden de los cambios cuando hay que investigar un incidente.
// TODO: en produccion esto se firma y se envia al servidor de auditoria.

const MAX = 60

interface BitacoraState {
  entradas: LogEntry[]
  registrar: (a: Action, rechazada: boolean) => void
  limpiar: () => void
}

const origenDe = (type: string): 'usuario' | 'sistema' =>
  type.startsWith('sync/') || type.startsWith('red/') ? 'sistema' : 'usuario'

export const useBitacoraStore = create<BitacoraState>((set, get) => ({
  entradas: [],

  registrar: (a, rechazada) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      type: a.type,
      payload: 'payload' in a ? a.payload : null,
      ts: new Date().toISOString(),
      auditable: AUDITABLES.includes(a.type) && !rechazada,
      origen: origenDe(a.type),
      resultado: rechazada ? 'rechazada' : 'aplicada',
    }
    set({ entradas: [entry, ...get().entradas].slice(0, MAX) })
  },

  limpiar: () => set({ entradas: [] }),
}))
