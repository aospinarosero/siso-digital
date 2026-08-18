# SISO Digital — microfrontends con Module Federation

Plataforma de gestión de seguridad y salud en el trabajo para obras de construcción.
El monolito de la Entrega 2 se descompuso en un **shell** y tres **microfrontends
federados**, uno por dominio de negocio, conservando el patrón **Flux** como contrato
entre ellos.

Corresponde a la Entrega 3 del módulo Arquitectura Front-End (Unidad 4).

**Maestría en Arquitectura de Software — Politécnico Grancolombiano**
Carlos Alberto Escobar Murillo · Alejandro Ospina Rosero · Stefhany Alfonso Rincón

**Repositorio:** https://github.com/aospinarosero/siso-digital

---

## Cómo ejecutarlo

```bash
npm install
npm run dev        # compila los remotos y levanta los cuatro servidores
npm test           # 10 escenarios sobre la capa Flux y la federación
npm run build      # compilación de producción de todos los paquetes
```

| Proceso | Puerto | Qué sirve |
|---|---|---|
| `shell` | 5173 | La aplicación. Es la que se abre en el navegador |
| `mf-turno` | 5001 | `remoteEntry.js` del dominio de turno |
| `mf-ats` | 5002 | `remoteEntry.js` del dominio de ATS |
| `mf-permiso` | 5003 | `remoteEntry.js` del dominio de permisos |

Los remotos se sirven compilados (`vite preview`) porque Module Federation resuelve el
`remoteEntry.js` desde el artefacto de construcción, no desde el servidor de desarrollo.

Cada microfrontend también arranca solo, sin shell y sin sus vecinos:

```bash
npm run dev -w @siso/mf-permiso    # http://localhost:5003
```

Si un remoto no levanta por su cuenta, no es independiente. Ese arranque aislado es la
prueba, no una comodidad de desarrollo.

Requiere Node 18 o superior.

---

## Por qué microfrontends

El detonante es organizacional antes que técnico. Con tres dominios y un equipo, el
monolito de la Entrega 2 era la decisión correcta. La proyección a 18 meses cambia el
cálculo: ocho dominios, cuatro equipos y despliegues por dominio en vez de un calendario
único. Ahí el paquete compartido deja de ser una ventaja y pasa a ser el cuello de botella,
porque todo cambio obliga a reconstruir y volver a certificar el flujo del permiso de
alturas, que es el que está regulado.

Lo que se gana es autonomía de despliegue y aislamiento de fallos. Lo que cuesta es
gobernanza: versionado de contratos, política de dependencias compartidas y observabilidad
repartida entre artefactos que se despliegan por separado.

---

## Estructura

```
packages/
  nucleo/                    @siso/nucleo — contrato compartido, no es un remoto
    contrato.ts              acciones tipadas, manifiesto, StoreFlux
    registro.ts              inscripción de remotos y verificación de contrato
    dispatcher.ts            punto único de escritura
    middleware.ts            logger y resiliencia offline
    eventos.ts               navegación por CustomEvent entre remoto y shell
    unico.ts                 anclaje de los singletons de plataforma
    stores/                  bitácora y cola de sincronización
    ui/                      Pantalla, CintaRed, PanelBitacora, PanelFederacion
    tokens.css               sistema de diseño
  shell/                     host: enrutamiento, layout y orquestación
    App.tsx                  carga diferida de los tres remotos
    RemotoCaido.tsx          degradación por dominio ante fallo de carga
    remotos.d.ts             contrato de lo que cada remoto publica
  mf-turno/                  remoto :5001
  mf-ats/                    remoto :5002
  mf-permiso/                remoto :5003
pruebas/
  escenarios.ts              verificación sin navegador
```

Cada remoto tiene la misma forma: `store.ts` con su reductor y su manifiesto, la vista que
expone, y un `aislado.tsx` para arrancar por su cuenta.

---

## Dominios y contratos

| Microfrontend | Contexto acotado | Qué expone | Acciones propias |
|---|---|---|---|
| `shell` | Orquestación | — | ninguna |
| `mf-turno` | Ciclo del turno de obra | `./InicioTurno` | `turno/iniciar`, `turno/cerrar` |
| `mf-ats` | Análisis de trabajo seguro | `./AtsWizard` | 5 acciones `ats/*` |
| `mf-permiso` | Cumplimiento normativo | `./PermisoAlturas` | 4 acciones `permiso/*` |
| `nucleo` | Servicios transversales | librería compartida | `red/*`, `sync/*`, `bitacora/*` |

Un dominio puede **reaccionar** a una acción ajena sin declararla suya. `mf-ats` y
`mf-permiso` se reinician con `turno/cerrar`, pero ninguno figura como su dueño: reaccionar
no es ser propietario, y esa distinción es lo que evita que dos remotos se disputen la
misma regla.

La comunicación entre dominios ocurre por tres vías y ninguna más:

1. **El contrato de acciones.** Es la interfaz real entre dominios. Un remoto despacha y
   los demás reducen si les concierne.
2. **CustomEvents del DOM** para navegación (`siso:navegar`). Ningún remoto conoce las
   rutas de los otros ni importa el enrutador.
3. **Estado transversal mínimo**: red, cola y bitácora, que viven en el núcleo.

Está prohibido leer el estado interno de otro dominio.

---

## El registro dinámico

La única diferencia estructural con el monolito está en el dispatcher. Antes tenía escrita
a mano la lista de stores. Ahora no sabe cuáles existen:

```ts
export function registrarMicrofrontend(manifiesto: Manifiesto, store: StoreFlux) {
  if (registro.inscritos.has(manifiesto.nombre)) return

  if (mayor(manifiesto.contrato) !== mayor(VERSION_CONTRATO)) {
    console.error(`[federacion] ${manifiesto.nombre} declara contrato ...`)
    return
  }

  registro.inscritos.set(manifiesto.nombre, { manifiesto, store })
  avisar()
}
```

Cada remoto se inscribe al cargarse. Uno compilado contra una versión mayor distinta del
contrato queda fuera del ciclo en vez de reducir acciones cuyo significado ya cambió.

El registro se ancla en `globalThis` con `Symbol.for`, y los stores de plataforma también.
No es defensa contra un error de programación: si el empaquetador duplicara el núcleo
habría dos bitácoras conviviendo, la aplicación se vería idéntica y la evidencia quedaría
partida en dos. **Compartir el núcleo es un requisito de corrección, no una optimización
de peso.**

---

## Gobernanza

- **Versionado del contrato.** `VERSION_CONTRATO` en el núcleo; cada manifiesto declara
  contra cuál se compiló y el registro compara la versión mayor.
- **Degradación por dominio.** Si un remoto no baja, el shell pinta su pantalla degradada
  con salida al inicio y los demás siguen operando. La barrera lleva `key={nombre}`: sin
  ella React la reconcilia por posición y el fallo de un dominio marca al siguiente.
- **Dependencias compartidas.** Solo `react`, `react-dom`, `zustand` y `@siso/nucleo`.
  Cuanto más se comparte, más superficie de ruptura.
- **Acciones huérfanas.** El dispatcher avisa cuando nadie reclama una acción de dominio,
  que es la forma en que se manifiesta un remoto que no cargó.
- **Despliegue.** Cada remoto publica su `remoteEntry.js` en almacenamiento estático bajo
  ruta versionada; el shell no se reconstruye cuando un dominio cambia.

---

## Pruebas

`npm test` ejecuta diez escenarios sin navegador ni DOM. Que esto sea posible es
consecuencia directa del patrón: la lógica de dominio no depende de React.

| Escenario | Qué verifica |
|---|---|
| E1 | El permiso no se firma con requisitos incompletos |
| E2 | El ATS exige identificar al menos un peligro |
| E3 | Los pasos del asistente no se salen de rango |
| E4 | Sin red, la evidencia se encola y el flujo no se interrumpe |
| E5 | Al recuperar la red la cola se drena sola |
| E6 | Toda acción queda registrada y las auditables marcadas |
| E7 | Una firma rechazada no viaja al servidor |
| E8 | Una acción repetida no se cuenta dos veces |
| E9 | Los tres remotos se inscriben con su manifiesto |
| E10 | Un remoto con contrato incompatible no entra al ciclo |

Diez escenarios, 32 verificaciones.

---

## Qué mirar al probarlo

1. **Abrir el shell.** El panel de federación muestra `1/3 remotos`: solo bajó `mf-turno`.
2. **Ir al ATS.** El contador pasa a `2/3`. El remoto se descarga al entrar, no antes.
3. **Mirar la bitácora.** Las acciones de los tres remotos aparecen en un solo hilo. Esa
   es la prueba de que el núcleo quedó compartido y no duplicado.
4. **Intentar firmar el permiso sin requisitos.** La acción se rechaza, queda tachada en la
   bitácora y no entra a la cola de sincronización.
5. **Apagar un remoto** y navegar a su ruta. Solo esa pantalla se degrada.
6. **Simular caída de red.** La evidencia se encola y se drena sola al reconectar.

---

## Alcance

Es un prototipo de arquitectura, no un producto. No hay backend, autenticación ni
persistencia en servidor: la capa de servicios está simulada para poder observar el
comportamiento del patrón, y la cola vive en `localStorage` en lugar de IndexedDB con
Background Sync.

Los remotos se sirven desde puertos locales; en producción irían en almacenamiento estático
con ruta versionada. Los dominios de inspecciones, capacitación y reportes que justifican la
descomposición están proyectados, no construidos.

---

## Stack

React 18 · TypeScript · Zustand · React Router · Vite · @originjs/vite-plugin-federation
