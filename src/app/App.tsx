import { Routes, Route } from 'react-router-dom'
import { InicioTurno } from '../dominios/turno/InicioTurno'
import { AtsWizard } from '../dominios/ats/AtsWizard'
import { PermisoAlturas } from '../dominios/permiso/PermisoAlturas'
import { PanelBitacora } from '../devtools/PanelBitacora'

export function App() {
  return (
    <main className="marco">
      <Routes>
        <Route path="/" element={<InicioTurno />} />
        <Route path="/ats" element={<AtsWizard />} />
        <Route path="/permiso" element={<PermisoAlturas />} />
      </Routes>
      <PanelBitacora />
    </main>
  )
}
