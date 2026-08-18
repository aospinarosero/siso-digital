import { useEffect } from 'react'
import { dispatch, navegarA, Pantalla } from '@siso/nucleo'
import { usePermisoStore, puedeFirmarse } from './store'

const COORDINADOR = 'C. Escobar'

export function PermisoAlturas() {
  const { estado, requisitos, coordinador, firmadoEn } = usePermisoStore()
  const habilitado = puedeFirmarse(requisitos)

  useEffect(() => {
    if (estado === 'borrador') dispatch({ type: 'permiso/solicitar' })
  }, [estado])

  return (
    <Pantalla titulo="Permiso de alturas">
      {estado === 'vigente' || estado === 'cerrado' ? (
        <div className="banner banner--vigente">
          {estado === 'vigente' ? 'VIGENTE' : 'CERRADO'}
        </div>
      ) : (
        <div className="banner banner--bloqueado">BLOQUEADO</div>
      )}
      <p className="tenue">
        {habilitado
          ? 'Requisitos completos. Falta la firma del coordinador.'
          : 'La tarea no se habilita hasta cerrar los faltantes.'}
      </p>

      {requisitos.map((r) => (
        <button
          key={r.id}
          className={`fila ${r.cumplido ? 'fila--ok' : r.diasRestantes ? 'fila--alerta' : ''}`}
          onClick={() => dispatch({ type: 'permiso/verificar', payload: { id: r.id } })}
          disabled={estado === 'vigente' || estado === 'cerrado'}
        >
          <span>
            {r.etiqueta}
            <br />
            <span className="tenue">{r.norma}</span>
          </span>
          <strong>{r.cumplido ? 'OK' : r.diasRestantes ? `${r.diasRestantes} días` : '—'}</strong>
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {firmadoEn && (
        <p className="tenue">
          Firmado por {coordinador} · {new Date(firmadoEn).toLocaleString('es-CO')}
        </p>
      )}

      <button
        className="btn btn--oscuro"
        disabled={!habilitado || estado === 'vigente' || estado === 'cerrado'}
        onClick={() =>
          dispatch({ type: 'permiso/firmar', payload: { coordinador: COORDINADOR } })
        }
      >
        FIRMAR COORDINADOR
      </button>

      {estado === 'vigente' && (
        <button className="btn" onClick={() => dispatch({ type: 'permiso/cerrar' })}>
          Cerrar permiso
        </button>
      )}
      <button className="btn" onClick={() => navegarA('/')}>
        Volver
      </button>
    </Pantalla>
  )
}

// Module Federation entrega el modulo expuesto envuelto y espera encontrar la
// exportacion por defecto. El nombre queda para el arranque aislado.
export default PermisoAlturas
