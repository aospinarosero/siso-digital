import { dispatch } from '../dispatcher'
import { useBitacoraStore } from '../stores/bitacora'
import { useSyncStore } from '../stores/sync'

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour12: false }) +
  '.' +
  String(new Date(iso).getMilliseconds()).padStart(3, '0')

// Este panel no es parte del producto: existe para hacer visible el ciclo.
// Con la federacion gana un segundo uso: las entradas llegan desde tres
// remotos distintos y aparecen aqui en un solo hilo, que es la prueba de que
// el nucleo quedo compartido y no duplicado.
export function PanelBitacora() {
  const entradas = useBitacoraStore((s) => s.entradas)
  const cola = useSyncStore((s) => s.cola)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <header>
          <span>Bitácora de acciones ({entradas.length})</span>
          <button className="chip chip--sis" onClick={() => dispatch({ type: 'bitacora/limpiar' })}>
            limpiar
          </button>
        </header>
        <div className="lista">
          {entradas.length === 0 && (
            <p style={{ padding: 16, color: 'var(--acero-500)' }}>
              Sin acciones todavía. Interactúa con la aplicación.
            </p>
          )}
          {entradas.map((e) => (
            <div className="log" key={e.id}>
              <span className="tenue">{hora(e.ts)}</span>
              <code>{e.type}</code>
              <span
                className={`chip ${
                  e.resultado === 'rechazada'
                    ? 'chip--rech'
                    : e.auditable
                      ? 'chip--aud'
                      : 'chip--sis'
                }`}
              >
                {e.resultado === 'rechazada' ? 'rechazada' : e.auditable ? 'auditable' : e.origen}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <header>
          <span>Cola de sincronización ({cola.length})</span>
          <button
            className="chip chip--sis"
            onClick={() => dispatch({ type: 'sync/reintentar' })}
          >
            reintentar
          </button>
        </header>
        <div className="lista">
          {cola.length === 0 && (
            <p style={{ padding: 16, color: 'var(--acero-500)' }}>Nada pendiente.</p>
          )}
          {cola.map((e) => (
            <div className="log" key={e.id}>
              <span className="tenue">{hora(e.ts)}</span>
              <code>{e.type}</code>
              <span className={`chip ${e.estado === 'en-cola' ? 'chip--cola' : 'chip--sync'}`}>
                {e.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
