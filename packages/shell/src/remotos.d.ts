// Los remotos se resuelven en tiempo de ejecucion, asi que TypeScript no puede
// verlos al compilar. Se declara aqui lo que cada uno publica: si un remoto
// cambia la firma de su vista, este archivo es lo que hay que actualizar y es
// donde se nota que el contrato se rompio.
declare module 'mfTurno/InicioTurno' {
  const InicioTurno: () => JSX.Element
  export default InicioTurno
}

declare module 'mfAts/AtsWizard' {
  const AtsWizard: () => JSX.Element
  export default AtsWizard
}

declare module 'mfPermiso/PermisoAlturas' {
  const PermisoAlturas: () => JSX.Element
  export default PermisoAlturas
}
