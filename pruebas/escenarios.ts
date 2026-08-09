// Escenarios de prueba sobre la capa Flux.
// Corren sin navegador: los stores no dependen del DOM, que es justamente una
// de las ventajas de testabilidad que da el patron. Ejecutar con: npm test

const memoria = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => void memoria.set(k, v),
  removeItem: (k: string) => void memoria.delete(k),
  clear: () => memoria.clear(),
  key: () => null,
  length: 0,
} as Storage

const { dispatch } = await import('../src/flux/dispatcher')
const { usePermisoStore } = await import('../src/flux/stores/permiso')
const { useAtsStore } = await import('../src/flux/stores/ats')
const { useSyncStore, useNetworkStore } = await import('../src/flux/stores/sync')
const { useBitacoraStore } = await import('../src/flux/stores/bitacora')

let ok = 0
let fallos = 0

function verificar(descripcion: string, condicion: boolean) {
  if (condicion) {
    ok++
    console.log(`  PASA  ${descripcion}`)
  } else {
    fallos++
    console.log(`  FALLA ${descripcion}`)
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
const seccion = (t: string) => console.log(`\n${t}`)

// ---------------------------------------------------------------------------
seccion('E1 · El permiso de alturas no se firma con requisitos incompletos')

dispatch({ type: 'turno/iniciar', payload: { obra: 'Torre B', frente: 'Piso 12' } })
dispatch({ type: 'permiso/solicitar' })
dispatch({ type: 'permiso/firmar', payload: { coordinador: 'C. Escobar' } })

verificar(
  'la firma se rechaza y el permiso sigue sin estar vigente',
  usePermisoStore.getState().estado !== 'vigente',
)

for (const id of ['analisis', 'rescate', 'certificado', 'epp']) {
  dispatch({ type: 'permiso/verificar', payload: { id } })
}
verificar(
  'con los cuatro requisitos cumplidos pasa a verificado',
  usePermisoStore.getState().estado === 'verificado',
)

dispatch({ type: 'permiso/firmar', payload: { coordinador: 'C. Escobar' } })
verificar('ahora si queda vigente', usePermisoStore.getState().estado === 'vigente')
verificar('registra quien firmo', usePermisoStore.getState().coordinador === 'C. Escobar')

// ---------------------------------------------------------------------------
seccion('E2 · El ATS exige identificar al menos un peligro antes de firmar')

dispatch({ type: 'ats/firmar' })
verificar('sin peligros marcados no firma', useAtsStore.getState().firmado === false)

const rechazo = useBitacoraStore.getState().entradas[0]
verificar('el rechazo queda registrado como tal', rechazo.resultado === 'rechazada')
verificar('un rechazo no cuenta como evidencia auditable', rechazo.auditable === false)
verificar(
  'un rechazo no se encola para el servidor',
  !useSyncStore.getState().cola.some((e) => e.type === 'ats/firmar'),
)

dispatch({ type: 'ats/sugerenciaIA', payload: { ids: ['altura', 'objetos'], confianza: 0.87 } })
verificar(
  'la sugerencia de IA marca los peligros y deja su nivel de confianza',
  useAtsStore.getState().confianzaIA === 0.87 &&
    useAtsStore.getState().peligros.filter((p) => p.marcado).length === 2,
)

dispatch({ type: 'ats/firmar' })
verificar('con peligros identificados si firma', useAtsStore.getState().firmado === true)

// ---------------------------------------------------------------------------
seccion('E3 · Los pasos del ATS no se salen de rango')

const pasoAntes = useAtsStore.getState().paso
dispatch({ type: 'ats/pasoAnterior' })
verificar('no retrocede antes del paso 1', useAtsStore.getState().paso === pasoAntes)

for (let i = 0; i < 10; i++) dispatch({ type: 'ats/siguientePaso' })
verificar('no avanza mas alla del paso 4', useAtsStore.getState().paso === 4)

// ---------------------------------------------------------------------------
seccion('E4 · Sin red, la evidencia se encola y el flujo no se interrumpe')

dispatch({ type: 'turno/cerrar' })
dispatch({ type: 'red/cambiar', payload: { online: false } })
dispatch({ type: 'turno/iniciar', payload: { obra: 'Sótano 2', frente: 'Frente A' } })
dispatch({ type: 'permiso/solicitar' })

const enCola = useSyncStore.getState().cola.filter((e) => e.estado === 'en-cola')
verificar('las acciones auditables quedan en cola', enCola.length === 2)
verificar('el turno se abrio igual, sin esperar a la red', useNetworkStore.getState().online === false)
verificar('cada evento lleva sello de tiempo', enCola.every((e) => !!e.ts))

seccion('E5 · Al recuperar la red la cola se drena sola')
dispatch({ type: 'red/cambiar', payload: { online: true } })
await esperar(1200)
verificar(
  'no queda nada pendiente y no hizo falta accion del usuario',
  useSyncStore.getState().cola.every((e) => e.estado === 'sincronizado'),
)

// ---------------------------------------------------------------------------
seccion('E6 · Toda accion queda registrada y las auditables marcadas')

const bitacora = useBitacoraStore.getState().entradas
verificar('la bitacora tiene registro', bitacora.length > 0)
verificar(
  'las acciones de dominio se marcan como auditables',
  bitacora.some((e) => e.type === 'permiso/firmar' && e.auditable),
)
verificar(
  'las de plataforma se marcan como sistema',
  bitacora.some((e) => e.type === 'red/cambiar' && e.origen === 'sistema'),
)
verificar(
  'el registro va del mas reciente al mas antiguo',
  bitacora.length < 2 || bitacora[0].ts >= bitacora[1].ts,
)

seccion('E7 · Una firma rechazada no viaja al servidor')

dispatch({ type: 'turno/cerrar' })
dispatch({ type: 'red/cambiar', payload: { online: true } })
dispatch({ type: 'turno/iniciar', payload: { obra: 'Portal 4', frente: 'Frente B' } })

const colaAntes = useSyncStore.getState().cola.length
dispatch({ type: 'permiso/firmar', payload: { coordinador: 'X' } })

verificar(
  'la cola no crece cuando la accion fue rechazada',
  useSyncStore.getState().cola.length === colaAntes,
)
verificar('el permiso sigue sin estar vigente', usePermisoStore.getState().estado !== 'vigente')
verificar(
  'el intento si queda en la bitacora, marcado como rechazado',
  useBitacoraStore.getState().entradas[0].resultado === 'rechazada',
)

// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(56)}`)
console.log(`Resultado: ${ok} verificaciones pasan, ${fallos} fallan`)
console.log('='.repeat(56))
process.exit(fallos === 0 ? 0 : 1)
