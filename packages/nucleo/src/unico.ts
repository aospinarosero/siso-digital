// Los stores de plataforma tienen que ser uno solo por pestana. Si el nucleo
// se duplicara al empaquetar, cada remoto escribiria en su propia bitacora y
// en su propia cola: la aplicacion se veria bien y la evidencia estaria
// partida en pedazos. Se ancla la instancia en globalThis para que la
// unicidad no dependa de como resolvio las dependencias el empaquetador.
const global = globalThis as unknown as Record<string, unknown>

export function unicoPorPestana<T>(llave: string, crear: () => T): T {
  const k = `siso.${llave}`
  if (!global[k]) global[k] = crear()
  return global[k] as T
}
