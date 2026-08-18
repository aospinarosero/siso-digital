// Superficie publica del nucleo. Es el contrato que comparten el shell y los
// tres remotos: lo que no salga por aqui no puede cruzar entre dominios.

export type {
  Action,
  ActionType,
  LogEntry,
  EventoEnCola,
  StoreFlux,
  Manifiesto,
} from './contrato'
export { AUDITABLES } from './contrato'

export { dispatch } from './dispatcher'
export { registrarMicrofrontend, inscritos, observarRegistro, VERSION_CONTRATO } from './registro'
export { navegarA, alNavegar } from './eventos'

export { useBitacoraStore } from './stores/bitacora'
export { useNetworkStore, useSyncStore, pendientes } from './stores/sync'

export { Pantalla } from './ui/Pantalla'
export { CintaRed } from './ui/CintaRed'
export { PanelBitacora } from './ui/PanelBitacora'
export { PanelFederacion } from './ui/PanelFederacion'
