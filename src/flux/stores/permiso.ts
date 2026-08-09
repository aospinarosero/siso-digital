import { create } from 'zustand'
import type { Action } from '../types'

// Maquina de estados del permiso de alturas.
// El bloqueo de la firma sale de la Res. 4272/2021, no es una validacion de UI.

export type EstadoPermiso = 'borrador' | 'solicitado' | 'verificado' | 'vigente' | 'cerrado'

export interface Requisito {
  id: string
  etiqueta: string
  norma: string
  cumplido: boolean
  diasRestantes?: number
}

const REQUISITOS: Requisito[] = [
  { id: 'analisis', etiqueta: 'Análisis de riesgo', norma: 'Res. 4272/2021', cumplido: false },
  { id: 'rescate', etiqueta: 'Plan de rescate activo', norma: 'Res. 4272/2021', cumplido: false },
  { id: 'certificado', etiqueta: 'Certificación del trabajador', norma: 'Res. 4272/2021', cumplido: false, diasRestantes: 12 },
  { id: 'epp', etiqueta: 'EPP verificado', norma: 'Res. 4272/2021', cumplido: false },
]

export const puedeFirmarse = (r: Requisito[]) => r.every((x) => x.cumplido)

interface PermisoState {
  estado: EstadoPermiso
  requisitos: Requisito[]
  coordinador: string | null
  firmadoEn: string | null
  handle: (a: Action) => boolean | void
}

export const usePermisoStore = create<PermisoState>((set, get) => ({
  estado: 'borrador',
  requisitos: REQUISITOS,
  coordinador: null,
  firmadoEn: null,

  handle: (a) => {
    switch (a.type) {
      case 'permiso/solicitar':
        if (get().estado === 'borrador') set({ estado: 'solicitado' })
        break

      case 'permiso/verificar': {
        const { estado, requisitos } = get()
        if (estado === 'vigente' || estado === 'cerrado') return false

        const nuevos = requisitos.map((r) =>
          r.id === a.payload.id ? { ...r, cumplido: !r.cumplido } : r,
        )
        set({ requisitos: nuevos, estado: puedeFirmarse(nuevos) ? 'verificado' : 'solicitado' })
        break
      }

      case 'permiso/firmar':
        // Se rechaza la transicion, no se muestra una advertencia.
        if (get().estado === 'vigente') return false
        if (!puedeFirmarse(get().requisitos)) {
          console.warn('[permiso] firma rechazada: requisitos incompletos')
          return false
        }
        set({
          estado: 'vigente',
          coordinador: a.payload.coordinador,
          firmadoEn: new Date().toISOString(),
        })
        break

      case 'permiso/cerrar':
        if (get().estado === 'vigente') set({ estado: 'cerrado' })
        break

      case 'turno/cerrar':
        set({ estado: 'borrador', requisitos: REQUISITOS, coordinador: null, firmadoEn: null })
        break
    }
  },
}))
