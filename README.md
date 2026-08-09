# SISO Digital — prototipo funcional

Prototipo de la plataforma de gestión de seguridad y salud en el trabajo para obras
de construcción, implementado con el patrón **Flux**.

Corresponde a la Entrega 2 del módulo Arquitectura Front-End (Unidad 3) y continúa el
diseño planteado en la Entrega 1.

**Maestría en Arquitectura de Software — Politécnico Grancolombiano**
Carlos Alberto Escobar Murillo · Alejandro Ospina Rosero · Stefhany Alfonso Rincón

**Repositorio:** https://github.com/aospinarosero/siso-digital

---

## Cómo ejecutarlo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # escenarios de prueba sobre la capa Flux
npm run build    # compilación de producción
```

Requiere Node 18 o superior.

---

## Por qué Flux

El dolor principal de este dominio no es el acoplamiento entre vista y lógica, sino el
**estado compartido con exigencia de trazabilidad**. La Resolución 4272 de 2021 obliga a
que la autorización de un trabajo en alturas sea verificable: quién la firmó, cuándo, y
con qué requisitos cumplidos.

MVC, MVP y MVVM resuelven bien la separación de responsabilidades, pero ninguno garantiza
por diseño que todo cambio de estado quede registrado y sea reconstruible. Flux sí, porque
centraliza el estado y obliga a que las mutaciones pasen por un punto único.

En este dominio la trazabilidad no es una comodidad de depuración: es un requisito legal.

### Lo que cuesta

Flux agrega ceremonia. Declarar una acción, tiparla y reducirla en el store es más código
que llamar a un setter. Se asume ese costo solo donde aporta: **el estado de dominio
auditable pasa por el dispatcher; el estado local de la interfaz no**. Un acordeón que se
abre y se cierra no necesita quedar en la bitácora.

---

## Estructura

```
src/
  flux/                      núcleo del patrón
    types.ts                 contrato de acciones (union type)
    dispatcher.ts            punto único de escritura
    middleware.ts            logger y resiliencia offline
    stores/
      turno.ts               estado global mínimo del turno
      ats.ts                 análisis de trabajo seguro por pasos
      permiso.ts             máquina de estados del permiso de alturas
      sync.ts                red + cola de sincronización
      bitacora.ts            registro inmutable de acciones
  dominios/                  vistas por dominio funcional
    turno/  ats/  permiso/
  plataforma/                cinta de estado de red
  sistema-diseno/            tokens de la Entrega 1
  devtools/                  panel de bitácora (no es parte del producto)
pruebas/
  escenarios.ts              verificación de las reglas sin navegador
```

## Responsabilidades por capa

| Capa | Responsabilidad | No le corresponde |
|---|---|---|
| **Vistas** (`dominios/`) | Renderizar y emitir acciones | Escribir en un store, decidir reglas |
| **Dispatcher** | Garantizar el orden del ciclo y bloquear despachos anidados | Conocer reglas de negocio |
| **Middleware** | Rastro de depuración, encolado sin red | Modificar la acción |
| **Stores** | Reducir la acción y custodiar sus invariantes | Modificar otro store |
| **Sistema de diseño** | Tokens y componentes accesibles | Lógica de dominio |

El flujo es unidireccional y el render nunca escribe estado:

```
vista → dispatch(action) → middleware → stores → vista
```

---

## Gestión de estado

El estado se clasifica según su naturaleza, no según dónde se usa:

- **Dominio auditable** (`turno`, `ats`, `permiso`) — pasa por el dispatcher y queda en la
  bitácora.
- **Plataforma** (`sync`, `red`) — estado técnico, también centralizado porque varias
  vistas lo consultan.
- **Local de interfaz** — vive en el componente con `useState` y no entra al ciclo Flux.
- **Navegación** — vive en la URL, gestionada por React Router.

### La norma como máquina de estados

`stores/permiso.ts` implementa la secuencia que exige la Res. 4272/2021:

```
borrador → solicitado → verificado → vigente → cerrado
```

La transición a `vigente` está guardada por `puedeFirmarse()`. Si falta un requisito, la
acción **se rechaza**: no se muestra una advertencia que el usuario pueda ignorar. El
requisito legal queda codificado en el store, no delegado a la disciplina de quien opera.

### Resiliencia

Las acciones listadas en `AUDITABLES` son evidencia de control. El middleware las encola
con sello de tiempo cuando no hay red y el flujo del usuario continúa sin esperar. Al
recuperar la conexión la cola se drena sola.

En el prototipo la cola persiste en `localStorage`. En producción va sobre IndexedDB con
Background Sync del Service Worker; el contrato de la capa no cambia.

---

## Qué mirar al probarlo

1. **Abrir turno.** Aparece en la bitácora marcado como auditable.
2. **Simular caída de red** con el botón de la cinta superior.
3. **Ir a permiso de alturas** e intentar firmar sin marcar requisitos. La firma no ocurre
   y la consola registra el rechazo.
4. **Marcar los cuatro requisitos.** El banner pasa de BLOQUEADO a habilitar la firma.
5. **Restaurar la red.** La cola se drena sin intervención.
6. **Panel derecho.** Cada acción con su sello de tiempo, en orden inverso.

---

## Pruebas

`npm test` ejecuta ocho escenarios sobre la capa Flux, sin navegador ni DOM. Que esto sea
posible es consecuencia directa del patrón: la lógica de dominio no depende de React.

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

---

## Alcance

Es un prototipo de arquitectura, no un producto. No hay backend, autenticación real ni
persistencia en servidor: la capa de servicios está simulada para poder observar el
comportamiento del patrón. Las pantallas implementadas son las del flujo crítico
identificado en la Entrega 1; los módulos de inspecciones y consulta aparecen
deshabilitados a propósito.

La organización por dominios con carga diferida es la que habilita la evolución a
microfrontends prevista para la Entrega 3.

---

## Stack

React 18 · TypeScript · Zustand · React Router · Vite
