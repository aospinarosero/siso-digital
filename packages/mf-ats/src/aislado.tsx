import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PanelBitacora } from '@siso/nucleo'
import { AtsWizard } from './AtsWizard.tsx'
import '@siso/nucleo/tokens.css'

// Arranque autonomo del microfrontend, sin shell y sin los otros dominios.
// No es un accesorio de desarrollo: si el remoto no puede levantarse solo,
// no es independiente y su equipo no puede trabajar sin los demas.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="marco">
      <div>
        <p className="aviso-aislado">mf-ats en modo aislado · sin shell</p>
        <AtsWizard />
      </div>
      <PanelBitacora />
    </main>
  </StrictMode>,
)
