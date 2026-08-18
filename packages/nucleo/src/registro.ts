import type { Action, Manifiesto, StoreFlux } from './contrato'

// Version del contrato de acciones. Un remoto compilado contra una version
// mayor distinta al shell no puede garantizar que sus acciones se reduzcan
// bien, y por eso el registro lo rechaza en vez de dejarlo pasar.
export const VERSION_CONTRATO = '1.0.0'

interface Inscrito {
  manifiesto: Manifiesto
  store: StoreFlux
}

interface Registro {
  inscritos: Map<string, Inscrito>
  // React vuelve a leer la instantanea en cada render y la compara por
  // referencia. Si se construyera el arreglo al vuelo, cada lectura daria uno
  // distinto y el panel se re-renderizaria sin parar. Se materializa una sola
  // vez, cuando el registro cambia de verdad.
  instantanea: Inscrito[]
  despachando: boolean
  oyentes: Set<() => void>
}

const LLAVE = Symbol.for('siso.flux.registro')

// El registro se ancla en globalThis a proposito. Cada microfrontend se compila
// por separado, y si el empaquetador termina duplicando este modulo habria dos
// dispatchers y dos bitacoras conviviendo en la misma pestana. El usuario no
// notaria nada y la trazabilidad que exige la norma quedaria rota. Symbol.for
// convierte el singleton en una garantia y no en una expectativa sobre como
// resolvio las dependencias el empaquetador.
const global = globalThis as unknown as Record<symbol, Registro | undefined>

export const registro: Registro =
  global[LLAVE] ??
  (global[LLAVE] = {
    inscritos: new Map(),
    instantanea: [],
    despachando: false,
    oyentes: new Set(),
  })

function avisar() {
  registro.instantanea = [...registro.inscritos.values()]
  registro.oyentes.forEach((fn) => fn())
}

const mayor = (v: string) => v.split('.')[0]

/**
 * Punto de entrada de un microfrontend al ciclo Flux. Lo llama el propio
 * remoto al cargarse: el shell no conoce los stores, solo importa la vista.
 */
export function registrarMicrofrontend(manifiesto: Manifiesto, store: StoreFlux) {
  if (registro.inscritos.has(manifiesto.nombre)) return

  if (mayor(manifiesto.contrato) !== mayor(VERSION_CONTRATO)) {
    console.error(
      `[federacion] ${manifiesto.nombre} declara contrato ${manifiesto.contrato} ` +
        `y el shell expone ${VERSION_CONTRATO}. No se inscribe.`,
    )
    return
  }

  registro.inscritos.set(manifiesto.nombre, { manifiesto, store })
  avisar()
}

/** Solo para las pruebas: devuelve el registro a su estado inicial. */
export function vaciarRegistro() {
  registro.inscritos.clear()
  avisar()
}

export const inscritos = () => registro.instantanea

export const stores = () => inscritos().map((i) => i.store)

/**
 * Qué microfrontend declara manejar una acción. Sirve para detectar acciones
 * huérfanas: las que nadie reduce porque su remoto todavía no ha cargado.
 */
export function duenoDe(type: Action['type']) {
  return inscritos().find((i) => i.manifiesto.acciones.includes(type))?.manifiesto.nombre ?? null
}

export function observarRegistro(fn: () => void) {
  registro.oyentes.add(fn)
  return () => void registro.oyentes.delete(fn)
}
