import type { Action } from './contrato'
import { logger, resiliencia } from './middleware'
import { registro, stores, duenoDe } from './registro'
import { useBitacoraStore } from './stores/bitacora'
import { useSyncStore, useNetworkStore } from './stores/sync'

export type Middleware = (a: Action) => void

// Los stores de plataforma viven en el nucleo y no se cargan por federacion:
// el estado de red y la cola tienen que existir desde el primer render,
// aunque todavia no haya bajado ningun remoto.
const plataforma = [useNetworkStore, useSyncStore]

const esDeDominio = (type: string) =>
  !type.startsWith('red/') && !type.startsWith('sync/') && !type.startsWith('bitacora/')

// Punto unico de escritura. Las vistas no tocan los stores directamente y
// ahora el dispatcher tampoco sabe cuales existen: cada remoto se inscribe al
// cargarse. Esa es la unica diferencia con la version monolitica.
export function dispatch(action: Action) {
  // Despachar dentro de un despacho rompe el orden del ciclo y deja la
  // bitacora inservible para auditoria. Se corta aqui.
  if (registro.despachando) {
    console.error(`[flux] despacho anidado: ${action.type}`)
    return
  }

  registro.despachando = true
  try {
    logger(action)

    if (action.type === 'bitacora/limpiar') {
      useBitacoraStore.getState().limpiar()
      return
    }

    // Una accion de dominio cuyo remoto no ha cargado no la reduce nadie. En
    // el monolito no podia pasar; aqui hay que poder verlo, no adivinarlo.
    if (esDeDominio(action.type) && !duenoDe(action.type)) {
      console.warn(`[federacion] accion huerfana: ${action.type}. Ningun remoto la reclama.`)
    }

    // Un store devuelve false cuando rechaza la accion. Cualquier otro valor
    // significa que la aplico o que no le concernia.
    let rechazada = false
    for (const store of [...plataforma, ...stores()]) {
      if (store.getState().handle(action) === false) rechazada = true
    }

    // El registro va despues de que los stores decidieron, con el resultado.
    useBitacoraStore.getState().registrar(action, rechazada)

    // Solo lo que realmente ocurrio viaja al servidor.
    if (!rechazada) resiliencia(action)
  } finally {
    registro.despachando = false
  }
}
