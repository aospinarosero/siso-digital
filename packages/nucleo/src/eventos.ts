// Contrato de navegacion entre el shell y los remotos.
//
// Un remoto no puede importar el enrutador ni conocer las rutas de los demas
// dominios: eso lo volveria dependiente de sus vecinos. Pide el cambio de
// pantalla con un evento del DOM y el shell, que es el unico que enruta,
// decide como resolverlo.
const CANAL = 'siso:navegar'

export function navegarA(ruta: string) {
  window.dispatchEvent(new CustomEvent(CANAL, { detail: { ruta } }))
}

export function alNavegar(fn: (ruta: string) => void) {
  const oyente = (e: Event) => fn((e as CustomEvent<{ ruta: string }>).detail.ruta)
  window.addEventListener(CANAL, oyente)
  return () => window.removeEventListener(CANAL, oyente)
}
