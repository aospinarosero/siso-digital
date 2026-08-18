import { useSyncExternalStore } from 'react'
import { inscritos, observarRegistro, VERSION_CONTRATO } from '../registro'

const CATALOGO = ['mf-turno', 'mf-ats', 'mf-permiso']

// Muestra que remotos bajaron y con que version del contrato. Un remoto se
// inscribe cuando el usuario entra por primera vez a su ruta, no antes: eso
// es lo que significa carga bajo demanda y conviene poder verlo.
export function PanelFederacion() {
  const cargados = useSyncExternalStore(observarRegistro, inscritos, () => [])
  const porNombre = new Map(cargados.map((i) => [i.manifiesto.nombre, i.manifiesto]))

  return (
    <div className="panel">
      <header>
        <span>Federación · contrato {VERSION_CONTRATO}</span>
        <span className="chip chip--sis">
          {cargados.length}/{CATALOGO.length} remotos
        </span>
      </header>
      <div className="lista">
        {CATALOGO.map((nombre) => {
          const m = porNombre.get(nombre)
          return (
            <div className="log" key={nombre}>
              <code>{nombre}</code>
              <span className="tenue">
                {m ? `${m.acciones.length} acciones` : 'no solicitado todavía'}
              </span>
              <span className={`chip ${m ? 'chip--sync' : 'chip--cola'}`}>
                {m ? `contrato ${m.contrato}` : 'en espera'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
