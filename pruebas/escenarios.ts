// Escenarios de prueba sobre la capa Flux y sobre la federacion.
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

const nucleo = await import('@siso/nucleo')
const { dispatch, useSyncStore, useNetworkStore, useBitacoraStore } = nucleo
const { registrarMicrofrontend, inscritos } = nucleo

// Sin navegador no hay Module Federation, asi que se importan los tres remotos
// como paquetes locales. Cada modulo se inscribe solo al cargarse: es el mismo
// mecanismo que en el navegador, solo cambia de donde baja el codigo.
const { useTurnoStore, manifiesto: manTurno } = await import('@siso/mf-turno/src/store')
const { useAtsStore } = await import('@siso/mf-ats/src/store')
const { usePermisoStore } = await import('@siso/mf-permiso/src/store')

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

seccion('E8 · Una accion repetida no se cuenta dos veces')

dispatch({ type: 'turno/cerrar' })
dispatch({ type: 'turno/iniciar', payload: { obra: 'Torre A', frente: 'Piso 3' } })

const colaPrevia = useSyncStore.getState().cola.length
// El modo estricto de React dispara este efecto dos veces en desarrollo.
dispatch({ type: 'permiso/solicitar' })
dispatch({ type: 'permiso/solicitar' })

verificar(
  'la segunda solicitud no entra a la cola',
  useSyncStore.getState().cola.length === colaPrevia + 1,
)
verificar(
  'la repeticion queda marcada como rechazada',
  useBitacoraStore.getState().entradas[0].resultado === 'rechazada',
)

dispatch({ type: 'turno/iniciar', payload: { obra: 'Otra', frente: 'Otro' } })
verificar(
  'tampoco se abre dos veces el mismo turno',
  useTurnoStore.getState().obra === 'Torre A',
)

seccion('E9 · Los tres remotos se inscriben con su manifiesto')

const cargados = inscritos().map((i) => i.manifiesto.nombre)
verificar(
  'los tres dominios quedaron inscritos en el registro',
  ['mf-turno', 'mf-ats', 'mf-permiso'].every((n) => cargados.includes(n)),
)
verificar('ninguno se inscribe dos veces', new Set(cargados).size === cargados.length)
verificar(
  'cada remoto declara contra que version del contrato se compilo',
  inscritos().every((i) => i.manifiesto.contrato === nucleo.VERSION_CONTRATO),
)
verificar(
  'ningun dominio reclama acciones de otro',
  !manTurno.acciones.some((a) => a.startsWith('ats/') || a.startsWith('permiso/')),
)

seccion('E10 · Un remoto con contrato incompatible no entra al ciclo')

// Simula el despliegue de un remoto compilado contra otra version mayor: si se
// inscribiera, reduciria acciones cuyo significado ya cambio.
const errorReal = console.error
console.error = () => {}
registrarMicrofrontend(
  { nombre: 'mf-futuro', contrato: '2.0.0', acciones: ['turno/iniciar'] },
  { getState: () => ({ handle: () => undefined }) },
)
console.error = errorReal

verificar(
  'el registro lo rechaza y no queda inscrito',
  !inscritos().some((i) => i.manifiesto.nombre === 'mf-futuro'),
)
verificar('los remotos compatibles siguen operando', inscritos().length === 3)

// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(56)}`)
console.log(`Resultado: ${ok} verificaciones pasan, ${fallos} fallan`)
console.log('='.repeat(56))
process.exit(fallos === 0 ? 0 : 1)
