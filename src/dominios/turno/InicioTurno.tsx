import { useNavigate } from 'react-router-dom'
import { dispatch } from '../../flux/dispatcher'
import { useTurnoStore } from '../../flux/stores/turno'
import { CintaRed } from '../../plataforma/CintaRed'

// Cinco destinos por pantalla. El reporte de peligro queda fuera del menu
// porque es la unica accion que no puede esperar.
export function InicioTurno() {
  const ir = useNavigate()
  const turno = useTurnoStore()

  if (!turno.abierto) {
    return (
      <Pantalla titulo="Inicio de turno">
        <CintaRed />
        <p className="tenue">No hay turno abierto.</p>
        <button
          className="btn btn--primario"
          onClick={() =>
            dispatch({ type: 'turno/iniciar', payload: { obra: 'Torre B', frente: 'Piso 12' } })
          }
        >
          ABRIR TURNO
        </button>
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo="Inicio de turno">
      <CintaRed />
      <div className="fila">
        <span>
          {turno.obra} · {turno.frente}
        </span>
        <span className="tenue">{new Date(turno.inicio!).toLocaleTimeString('es-CO')}</span>
      </div>

      <button className="btn btn--primario" onClick={() => ir('/ats')}>
        ATS DE LA TAREA
      </button>
      <button className="btn btn--critico" onClick={() => ir('/permiso')}>
        AUTORIZAR TAREA CRÍTICA
      </button>
      <button className="btn" disabled>
        INSPECCIONAR
      </button>
      <button className="btn" disabled>
        CONSULTAR
      </button>

      <div style={{ flex: 1 }} />
      <button className="btn btn--peligro">REPORTAR PELIGRO</button>
      <button className="btn tenue" onClick={() => dispatch({ type: 'turno/cerrar' })}>
        cerrar turno
      </button>
    </Pantalla>
  )
}

export function Pantalla({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="telefono">
      <header>{titulo}</header>
      <div className="cuerpo">{children}</div>
    </section>
  )
}
