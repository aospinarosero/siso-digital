import { dispatch, navegarA, Pantalla, CintaRed } from '@siso/nucleo'
import { useTurnoStore } from './store'

// Cinco destinos por pantalla. El reporte de peligro queda fuera del menu
// porque es la unica accion que no puede esperar.
export function InicioTurno() {
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

      {/* Este dominio no conoce las rutas de los otros: pide el salto y el
          shell decide. Sin eso, mf-turno dependeria de mf-ats. */}
      <button className="btn btn--primario" onClick={() => navegarA('/ats')}>
        ATS DE LA TAREA
      </button>
      <button className="btn btn--critico" onClick={() => navegarA('/permiso')}>
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

// Module Federation entrega el modulo expuesto envuelto y espera encontrar la
// exportacion por defecto. El nombre queda para el arranque aislado.
export default InicioTurno
