import { create } from 'zustand'
import type { Action, Manifiesto } from '@siso/nucleo'
import { registrarMicrofrontend } from '@siso/nucleo'

// El ATS real trae mas de 20 items. Se parte en 4 pasos para repartir la carga
// de memoria (Ley de Miller, justificada en la entrega anterior).

export interface Peligro {
  id: string
  etiqueta: string
  paso: number
  marcado: boolean
  sugerido: boolean
}

export const PASOS = [
  { n: 1, titulo: 'Identificación de la tarea' },
  { n: 2, titulo: 'Peligros de la tarea' },
  { n: 3, titulo: 'Controles y equipo' },
  { n: 4, titulo: 'Verificación final' },
]

const PELIGROS: Peligro[] = [
  { id: 'altura', etiqueta: 'Caída de altura', paso: 2, marcado: false, sugerido: false },
  { id: 'objetos', etiqueta: 'Caída de objetos', paso: 2, marcado: false, sugerido: false },
  { id: 'atrapamiento', etiqueta: 'Atrapamiento', paso: 2, marcado: false, sugerido: false },
  { id: 'electrico', etiqueta: 'Riesgo eléctrico', paso: 2, marcado: false, sugerido: false },
  { id: 'arnes', etiqueta: 'Arnés certificado', paso: 3, marcado: false, sugerido: false },
  { id: 'linea', etiqueta: 'Línea de vida anclada', paso: 3, marcado: false, sugerido: false },
  { id: 'senal', etiqueta: 'Señalización del área', paso: 3, marcado: false, sugerido: false },
  { id: 'rescate', etiqueta: 'Personal de rescate disponible', paso: 4, marcado: false, sugerido: false },
]

interface AtsState {
  paso: number
  peligros: Peligro[]
  confianzaIA: number | null
  firmado: boolean
  handle: (a: Action) => boolean | void
}

export const useAtsStore = create<AtsState>((set, get) => ({
  paso: 1,
  peligros: PELIGROS,
  confianzaIA: null,
  firmado: false,

  handle: (a) => {
    switch (a.type) {
      case 'ats/togglePeligro':
        if (get().firmado) return false
        set({
          peligros: get().peligros.map((p) =>
            p.id === a.payload.id ? { ...p, marcado: !p.marcado } : p,
          ),
        })
        break

      case 'ats/sugerenciaIA':
        // La inferencia corre en el dispositivo. Propone, no decide.
        set({
          confianzaIA: a.payload.confianza,
          peligros: get().peligros.map((p) =>
            a.payload.ids.includes(p.id) ? { ...p, marcado: true, sugerido: true } : p,
          ),
        })
        break

      case 'ats/siguientePaso':
        if (get().paso < PASOS.length) set({ paso: get().paso + 1 })
        break

      case 'ats/pasoAnterior':
        if (get().paso > 1) set({ paso: get().paso - 1 })
        break

      case 'ats/firmar':
        if (get().firmado) return false
        if (!get().peligros.some((p) => p.marcado)) {
          console.warn('[ats] firma rechazada: ningun peligro identificado')
          return false
        }
        set({ firmado: true })
        break

      case 'turno/cerrar':
        set({ paso: 1, peligros: PELIGROS, confianzaIA: null, firmado: false })
        break
    }
  },
}))

export const manifiesto: Manifiesto = {
  nombre: 'mf-ats',
  contrato: '1.0.0',
  acciones: [
    'ats/togglePeligro',
    'ats/sugerenciaIA',
    'ats/siguientePaso',
    'ats/pasoAnterior',
    'ats/firmar',
  ],
}

// Este dominio tambien reduce turno/cerrar para limpiarse, pero no lo declara
// en el manifiesto: reaccionar a una accion ajena no es ser su dueno.
registrarMicrofrontend(manifiesto, useAtsStore)
