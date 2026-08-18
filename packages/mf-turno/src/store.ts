import { create } from 'zustand'
import type { Action, Manifiesto } from '@siso/nucleo'
import { registrarMicrofrontend } from '@siso/nucleo'

interface TurnoState {
  abierto: boolean
  obra: string | null
  frente: string | null
  inicio: string | null
  handle: (a: Action) => boolean | void
}

export const useTurnoStore = create<TurnoState>((set, get) => ({
  abierto: false,
  obra: null,
  frente: null,
  inicio: null,

  handle: (a) => {
    switch (a.type) {
      case 'turno/iniciar':
        if (get().abierto) return false
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

export const manifiesto: Manifiesto = {
  nombre: 'mf-turno',
  contrato: '1.0.0',
  acciones: ['turno/iniciar', 'turno/cerrar'],
}

// El remoto se presenta al cargarse. El shell no importa este store ni sabe
// que existe: solo pide la vista y el dominio se engancha solo al ciclo.
registrarMicrofrontend(manifiesto, useTurnoStore)
