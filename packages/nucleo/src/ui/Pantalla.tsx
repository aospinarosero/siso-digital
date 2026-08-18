import type { ReactNode } from 'react'

// Vivia dentro del dominio de turno y los otros dos dominios lo importaban de
// ahi. El monolito escondia ese acoplamiento; al separar los remotos habria
// obligado a mf-ats a depender de mf-turno para pintar un encabezado. Es
// carcasa visual, asi que su sitio es el sistema de diseno.
export function Pantalla({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="telefono">
      <header>{titulo}</header>
      <div className="cuerpo">{children}</div>
    </section>
  )
}
