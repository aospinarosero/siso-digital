import { Component, type ReactNode } from 'react'
import { navegarA } from '@siso/nucleo'

interface Props {
  nombre: string
  children: ReactNode
}

// Gobernanza del host: un remoto que no baja degrada su propia pantalla y no
// tumba la aplicacion. En el monolito no hacia falta porque todo venia en el
// mismo paquete; al repartir el despliegue, la caida parcial pasa a ser un
// estado normal del sistema y hay que darle una respuesta explicita.
export class RemotoCaido extends Component<Props, { fallo: Error | null }> {
  state = { fallo: null as Error | null }

  static getDerivedStateFromError(fallo: Error) {
    return { fallo }
  }

  componentDidCatch(fallo: Error) {
    console.error(`[federacion] ${this.props.nombre} no cargo:`, fallo.message)
  }

  render() {
    if (!this.state.fallo) return this.props.children

    return (
      <section className="telefono">
        <header>{this.props.nombre}</header>
        <div className="cuerpo">
          <div className="banner banner--bloqueado">MÓDULO NO DISPONIBLE</div>
          <p className="tenue">
            Este dominio no respondió. Los demás siguen operando y la evidencia ya registrada
            permanece en la cola.
          </p>
          <button className="btn" onClick={() => this.setState({ fallo: null })}>
            REINTENTAR
          </button>
          <button className="btn tenue" onClick={() => navegarA('/')}>
            volver al inicio
          </button>
        </div>
      </section>
    )
  }
}
