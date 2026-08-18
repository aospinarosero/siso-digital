import { dispatch } from '../dispatcher'
import { useNetworkStore, useSyncStore, pendientes } from '../stores/sync'

// El estado de red es permanente, no una alerta que se descarta: el usuario
// tiene que poder saber en todo momento si lo que registro ya salio del equipo.
export function CintaRed() {
  const online = useNetworkStore((s) => s.online)
  const cola = useSyncStore((s) => s.cola)
  const enCola = pendientes(cola)

  return (
    <div className={`cinta-red ${online ? 'cinta-red--online' : 'cinta-red--offline'}`}>
      <span>
        {online ? 'EN LÍNEA' : 'SIN CONEXIÓN'}
        {enCola > 0 && ` · ${enCola} en cola`}
      </span>
      <button
        className="chip chip--sis"
        style={{ border: 'none', cursor: 'pointer' }}
        onClick={() => dispatch({ type: 'red/cambiar', payload: { online: !online } })}
      >
        simular {online ? 'caída' : 'reconexión'}
      </button>
    </div>
  )
}
