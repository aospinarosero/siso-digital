export type Action =
  | { type: 'turno/iniciar'; payload: { obra: string; frente: string } }
  | { type: 'turno/cerrar' }
  | { type: 'ats/togglePeligro'; payload: { id: string } }
  | { type: 'ats/sugerenciaIA'; payload: { ids: string[]; confianza: number } }
  | { type: 'ats/siguientePaso' }
  | { type: 'ats/pasoAnterior' }
  | { type: 'ats/firmar' }
  | { type: 'permiso/verificar'; payload: { id: string } }
  | { type: 'permiso/solicitar' }
  | { type: 'permiso/firmar'; payload: { coordinador: string } }
  | { type: 'permiso/cerrar' }
  | { type: 'red/cambiar'; payload: { online: boolean } }
  | { type: 'sync/reintentar' }
  | { type: 'bitacora/limpiar' }

export type ActionType = Action['type']

// Acciones que son evidencia de control: tienen que sobrevivir a la caída de red.
export const AUDITABLES: ActionType[] = [
  'turno/iniciar',
  'ats/firmar',
  'permiso/solicitar',
  'permiso/firmar',
  'permiso/cerrar',
]

export interface LogEntry {
  id: string
  type: ActionType
  payload: unknown
  ts: string
  auditable: boolean
  origen: 'usuario' | 'sistema'
  // La bitacora anota hechos, no intenciones: si un store rechazo la accion
  // queda marcada como tal y no se encola para el servidor.
  resultado: 'aplicada' | 'rechazada'
}

export interface EventoEnCola {
  id: string
  type: ActionType
  payload: unknown
  ts: string
  estado: 'en-cola' | 'sincronizado' | 'error'
}
