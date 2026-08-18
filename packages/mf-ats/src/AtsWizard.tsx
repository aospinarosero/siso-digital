import { dispatch, navegarA, Pantalla } from '@siso/nucleo'
import { useAtsStore, PASOS } from './store'

export function AtsWizard() {
  const { paso, peligros, confianzaIA, firmado } = useAtsStore()
  const delPaso = peligros.filter((p) => p.paso === paso)
  const marcados = peligros.filter((p) => p.marcado).length

  return (
    <Pantalla titulo={`ATS · paso ${paso} de ${PASOS.length}`}>
      <div className="pasos">
        {PASOS.map((p) => (
          <span key={p.n} className={p.n <= paso ? 'hecho' : ''} />
        ))}
      </div>
      <p className="tenue">{PASOS[paso - 1].titulo}</p>

      {paso === 1 && (
        <>
          <div className="fila">
            <span>Instalación de línea de vida</span>
          </div>
          <div className="fila">
            <span>Altura estimada</span>
            <strong>4,2 m</strong>
          </div>
          <button
            className="btn"
            onClick={() =>
              dispatch({
                type: 'ats/sugerenciaIA',
                payload: { ids: ['altura', 'objetos'], confianza: 0.87 },
              })
            }
          >
            ANALIZAR CON IA
          </button>
        </>
      )}

      {delPaso.map((p) => (
        <button
          key={p.id}
          className={`fila ${p.marcado ? 'fila--ok' : ''}`}
          onClick={() => dispatch({ type: 'ats/togglePeligro', payload: { id: p.id } })}
          disabled={firmado}
        >
          <span>{p.etiqueta}</span>
          <span>{p.marcado ? '✓' : ''}</span>
        </button>
      ))}

      {confianzaIA !== null && paso === 2 && (
        <div className="fila fila--alerta">
          <span>Sugerido por IA · confianza {confianzaIA.toFixed(2)}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />
      <p className="tenue">
        {marcados} peligro(s) identificado(s)
        {marcados === 0 && ' · no se puede firmar sin identificar al menos uno'}
      </p>

      {paso < PASOS.length ? (
        <button className="btn btn--primario" onClick={() => dispatch({ type: 'ats/siguientePaso' })}>
          CONFIRMAR Y SEGUIR
        </button>
      ) : (
        <button
          className="btn btn--primario"
          disabled={firmado || marcados === 0}
          onClick={() => dispatch({ type: 'ats/firmar' })}
        >
          {firmado ? 'ATS FIRMADO' : 'FIRMAR ATS'}
        </button>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {paso > 1 && (
          <button className="btn" onClick={() => dispatch({ type: 'ats/pasoAnterior' })}>
            Atrás
          </button>
        )}
        <button className="btn" onClick={() => navegarA('/')}>
          Volver
        </button>
      </div>
    </Pantalla>
  )
}

// Module Federation entrega el modulo expuesto envuelto y espera encontrar la
// exportacion por defecto. El nombre queda para el arranque aislado.
export default AtsWizard
