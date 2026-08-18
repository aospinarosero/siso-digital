import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { alNavegar, PanelBitacora, PanelFederacion } from '@siso/nucleo'
import { RemotoCaido } from './RemotoCaido'

// Los tres dominios entran por federacion. El shell no los compila: importa
// una URL que se resuelve en tiempo de ejecucion, y por eso cada equipo puede
// desplegar el suyo sin reconstruir esto.
const InicioTurno = lazy(() => import('mfTurno/InicioTurno'))
const AtsWizard = lazy(() => import('mfAts/AtsWizard'))
const PermisoAlturas = lazy(() => import('mfPermiso/PermisoAlturas'))

const Cargando = ({ nombre }: { nombre: string }) => (
  <section className="telefono">
    <header>{nombre}</header>
    <div className="cuerpo">
      <p className="tenue">Descargando el módulo…</p>
    </div>
  </section>
)

function Remoto({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    // La clave no es decorativa. Sin ella React reconcilia por posicion y
    // reutiliza la misma barrera al cambiar de ruta, con lo cual la caida de un
    // dominio deja marcado al siguiente que se pinte en su lugar. El aislamiento
    // de fallos solo es real si cada remoto tiene la suya.
    <RemotoCaido key={nombre} nombre={nombre}>
      <Suspense fallback={<Cargando nombre={nombre} />}>{children}</Suspense>
    </RemotoCaido>
  )
}

export function App() {
  const ir = useNavigate()

  // El enrutador es del shell. Los remotos piden el salto por evento y no
  // conocen ni las rutas ni la existencia de sus vecinos.
  useEffect(() => alNavegar((ruta) => ir(ruta)), [ir])

  return (
    <main className="marco">
      <Routes>
        <Route
          path="/"
          element={
            <Remoto nombre="mf-turno">
              <InicioTurno />
            </Remoto>
          }
        />
        <Route
          path="/ats"
          element={
            <Remoto nombre="mf-ats">
              <AtsWizard />
            </Remoto>
          }
        />
        <Route
          path="/permiso"
          element={
            <Remoto nombre="mf-permiso">
              <PermisoAlturas />
            </Remoto>
          }
        />
      </Routes>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PanelFederacion />
        <PanelBitacora />
      </div>
    </main>
  )
}
