# Okayu Update --- Rediseño de la interfaz Android

## 1. Objetivo

Transformar el port funcional de Android en un cliente móvil de Pokémon Showdown cuya experiencia visual se aproxime a Pokémon Sword and Shield, conservando la identidad de Okayu Update y todas las funciones de combate existentes.

**Principio rector: el escenario es la interfaz, no un elemento contenido dentro de ella.** Los controles deben flotar sobre el combate, aparecer cuando sean necesarios y desaparecer cuando dejen de serlo.

El trabajo debe centrarse en la capa de presentación. No modificar las reglas de combate, el protocolo de Showdown ni los cálculos de Calcdex. Mantener intacta la interfaz de escritorio.

## 2. Dirección visual

-   Orientación horizontal como experiencia principal de combate.
-   Escenario a pantalla completa, sin panel lateral permanente, marcos innecesarios ni franjas vacías. Conservar la perspectiva y las proporciones de los Pokémon; adaptar el fondo al viewport sin deformar los modelos.
-   Activar el modo inmersivo de Android cuando sea viable, respetando recortes de pantalla, gestos del sistema y áreas seguras.
-   Menús flotantes compactos, inspirados en las cápsulas de Sword and Shield, con iconos reconocibles y texto alineado a la izquierda.
-   Color de acento Okayu: `#8D709F`. Superficies moradas oscuras, texto claro y contraste suficiente. Reservar el acento para selección, foco y acciones destacadas.
-   Usar translucidez moderada y desenfoque opcional. Si el dispositivo no soporta el efecto con fluidez, sustituirlo por una superficie semitransparente sin blur.
-   Evitar bordes gruesos, sombras excesivas, degradados ornamentales y cajas dentro de cajas. El protagonismo corresponde al combate.
-   Mantener una jerarquía visual clara: Pokémon y escenario, información de salud, acciones de combate y, finalmente, herramientas externas.

## 3. Composición de pantalla

``` text
┌──────────────────────────────────────────────────────────────┐
│ Iconos externos · Turno · Timer             Equipo rival   │
│                                           PS rival · Nivel │
│                                                              │
│                                      Pokémon rival          │
│                                                              │
│       Pokémon propio                         [ Luchar    ] │
│                                              [ Pokémon   ] │
│                                              [ Calcdex   ] │
│                                              [ Chat      ] │
│ PS propio · Nivel                            [ Huir      ] │
│ Equipo propio                                               │
└──────────────────────────────────────────────────────────────┘
```

Esquema conceptual, no una cuadrícula rígida. Los elementos deben anclarse a las áreas seguras del viewport y no modificar las dimensiones del escenario al aparecer.

  --------------------------------------------------------------------------------------------------------------------------
  Elemento                            Ubicación y tratamiento
  ----------------------------------- --------------------------------------------------------------------------------------
  Escenario                           Capa de fondo, ocupa toda la superficie disponible

  Salud propia                        Esquina inferior izquierda

  Salud rival                         Esquina superior derecha

  Equipos                             Indicadores horizontales junto a las respectivas barras de salud

  Menú de combate                     Esquina inferior derecha, flotante

  Turno y temporizador                Zona superior, sin solapar herramientas ni salud

  Iconos externos                     Conservar la zona superior y las funciones existentes, con menor protagonismo visual

  Mensajes de combate                 Franja flotante inferior o central inferior, sin tapar información esencial
  --------------------------------------------------------------------------------------------------------------------------

Conservar nombres, niveles, género, PS, estados alterados, modificadores y demás información que ya proporcione el cliente. Los indicadores de equipo deben distinguir Pokémon desconocidos, revelados y debilitados. No revelar información oculta del rival.

## 4. Menú principal de combate

Mostrar cinco acciones, en este orden:

1.  **Luchar**: abre el selector de movimientos.
2.  **Pokémon**: abre el selector de equipo.
3.  **Calcdex**: abre la herramienta existente de información y cálculo de daño.
4.  **Chat**: abre el panel existente que combina conversación y registro de combate.
5.  **Huir**: abre una confirmación de rendición.

El menú debe ser estrecho y compacto, con botones uniformes y zonas táctiles cómodas. Como referencia inicial, usar un ancho de 22--30 % del viewport, ajustado por límites mínimos y máximos; altura táctil cercana a 44--48 dp cuando el espacio lo permita. No reducir texto o controles hasta volverlos ilegibles para cumplir una proporción arbitraria.

No mostrar simultáneamente el menú principal y todos sus submenús. Cada acción abre una vista contextual que sustituye al menú o se superpone temporalmente a él.

## 5. Diseño de submenús

### 5.1. Luchar

-   Sustituir las cinco acciones principales por los movimientos disponibles.
-   Preferir una columna compacta de cuatro movimientos, al estilo Sword and Shield; permitir una cuadrícula 2 × 2 en pantallas donde resulte más legible.
-   Mostrar nombre, tipo y PP. Conservar las indicaciones existentes de efectividad, restricciones y movimientos deshabilitados.
-   Diferenciar los tipos mediante color e icono, sin depender exclusivamente del color.
-   Integrar la teracristalización como control independiente y compacto, mostrando su tipo y estado. Adaptar este espacio a otras mecánicas especiales cuando el formato las permita.
-   Añadir un botón Volver. En combates dobles, incorporar selección de objetivo y conservar la secuencia de decisiones del cliente.
-   No enviar una acción al abrir el submenú ni al activar un modificador; respetar el flujo de confirmación existente.

### 5.2. Pokémon

-   Abrir un panel flotante con los seis integrantes, preferentemente en cuadrícula 2 × 3 o 3 × 2 según el espacio.
-   Cada ficha debe mostrar sprite, nombre, barra de PS y estado relevante.
-   Distinguir Pokémon activo, debilitado y no seleccionable. Mantener los motivos de restricción disponibles.
-   Evitar desplazamiento para acceder a los seis integrantes en condiciones normales.
-   Si el cambio es obligatorio, abrir directamente este selector y no permitir regresar a acciones inválidas.

### 5.3. Calcdex

-   Reutilizar Calcdex y su integración actual, incluida la compatibilidad de idiomas de Okayu Update.
-   Presentarlo como panel superpuesto de mayor tamaño, con cierre visible y desplazamiento interno.
-   Priorizar información del enfrentamiento actual: Pokémon, estadísticas, modificadores y cálculos disponibles.
-   No recortar controles ni simplificar cálculos de forma que se pierdan funciones. Adaptar la presentación a una o dos columnas según el ancho.
-   Al cerrar, restaurar el estado anterior del menú de combate sin perder selecciones válidas.

### 5.4. Chat

-   Reutilizar la caja de Showdown que contiene tanto el registro del combate como el chat; no crear dos sistemas separados.
-   Mostrarla en un panel flotante amplio, con scroll interno, campo de escritura y cierre accesible.
-   Conservar mensajes, formato, orden cronológico y comportamiento de desplazamiento. No forzar el salto al último mensaje cuando el usuario esté leyendo mensajes anteriores.
-   Gestionar el teclado virtual sin deformar el escenario ni ocultar el campo de escritura.
-   Los mensajes breves sobre el escenario deben seguir funcionando aunque el panel esté cerrado.

### 5.5. Huir

-   Mostrar una confirmación compacta con Cancelar y Rendirse.
-   No ejecutar la rendición con un único toque accidental.
-   Utilizar la acción de rendición ya implementada por Showdown.

## 6. Iconos superiores y navegación externa

Conservar los iconos superiores del port actual y sus funciones. Pertenecen a la navegación general de la aplicación, no al menú contextual de decisiones del combate.

-   Reducir su peso visual mediante tamaño gráfico, opacidad moderada y fondos discretos, sin reducir excesivamente la zona táctil.
-   Evitar solapamientos con el temporizador, el turno y las barras de salud.
-   No eliminar accesos existentes aunque Calcdex o Chat también estén disponibles desde el menú de combate; reutilizar el mismo estado y la misma instancia funcional cuando corresponda.
-   El gesto o botón Atrás de Android debe cerrar primero el teclado, después el panel o submenú abierto y finalmente seguir la navegación normal de la aplicación. Nunca rendirse por pulsar Atrás.

## 7. Estados de interfaz

  ------------------------------------------------------------------------------------------------------------------------
  Estado                              Presentación esperada
  ----------------------------------- ------------------------------------------------------------------------------------
  Esperando decisión                  Menú principal o submenú activo

  Selección de movimiento             Movimientos, modificadores y regreso

  Selección de objetivo               Objetivos válidos y controles correspondientes

  Cambio obligatorio                  Selector de equipo sin acciones inválidas

  Acción enviada                      Indicador discreto de espera y cancelación si el cliente la permite

  Animación                           Ocultar controles de decisión; conservar HUD y mensajes necesarios

  Calcdex o Chat abierto              Panel superpuesto; combate y temporizador continúan

  Combate terminado                   Acciones de repetición, compartir, revancha y salida en un menú flotante coherente

  Repetición o espectador             Controles de reproducción o espectador, sin acciones de jugador
  ------------------------------------------------------------------------------------------------------------------------

Si llega una nueva solicitud de decisión mientras un panel informativo está abierto, señalarla claramente y permitir regresar al combate. El temporizador debe seguir visible o fácilmente consultable.

## 8. Implementación técnica propuesta

Antes de modificar código, inspeccionar la estructura real del proyecto, identificar los componentes de combate, estilos, contenedores, eventos y puente Android. No asumir nombres de archivos ni frameworks sin verificarlos.

1.  Crear una capa de layout móvil activada explícitamente para Android, con una alternativa responsiva si resulta necesaria. No alterar estilos globales de escritorio.
2.  Separar visualmente escenario, HUD, controles, paneles y navegación externa mediante capas de posicionamiento y orden de apilamiento definidos.
3.  Utilizar dimensiones relativas al viewport, áreas seguras y límites de tamaño. Evitar coordenadas absolutas dependientes de una resolución concreta.
4.  Introducir un estado de presentación para controlar el menú activo, sin duplicar el estado de combate de Showdown.
5.  Reutilizar los componentes, manejadores y datos existentes de movimientos, cambios, Calcdex, chat y repeticiones. Evitar instancias duplicadas, listeners acumulados o pérdida de estado al cerrar paneles.
6.  Verificar eventos táctiles, foco, teclado virtual, gestos de Android y navegación Atrás. Las capas decorativas no deben interceptar toques.
7.  Optimizar animaciones de apertura y cierre mediante opacidad y transformaciones; evitar recalcular el escenario en cada transición. Respetar preferencias de movimiento reducido.
8.  Mantener una alternativa visual ligera para dispositivos de gama baja y comprobar el rendimiento con el escenario animado.

## 9. Orden de trabajo

-   [ ] **Fase 1 --- Base visual:** pantalla completa, eliminación del panel lateral, HUD y áreas seguras.
-   [ ] **Fase 2 --- Menú principal:** cinco acciones, estilo Okayu, iconos superiores y navegación contextual.
-   [ ] **Fase 3 --- Decisiones:** movimientos, mecánicas especiales, objetivos, equipo y cambios obligatorios.
-   [ ] **Fase 4 --- Herramientas:** paneles de Calcdex y Chat, teclado y conservación de estado.
-   [ ] **Fase 5 --- Estados secundarios:** espera, animaciones, rendición, final de combate y repeticiones.
-   [ ] **Fase 6 --- Pulido:** contraste, tamaños, transiciones, rendimiento y pruebas de regresión en escritorio.

Priorizar una primera versión visual navegable del menú y HUD antes de invertir tiempo en efectos decorativos. Revisar capturas de cada fase en un teléfono real.

## 10. Criterios de aceptación

-   El escenario permanece a pantalla completa al navegar entre menús.
-   No existe un panel lateral permanente durante el combate.
-   Los cinco botones principales son legibles, uniformes y accesibles mediante toque.
-   No hay solapamientos entre HUD, temporizador, iconos externos y controles.
-   Los seis Pokémon son accesibles sin scroll en el selector habitual.
-   Calcdex y Chat conservan sus funciones y pueden cerrarse sin perder el estado de combate.
-   Las decisiones válidas e inválidas coinciden con el cliente original; no se producen envíos dobles ni acciones accidentales.
-   Los menús de decisión desaparecen durante las animaciones y reaparecen correctamente cuando corresponde.
-   Las pantallas de final de combate y repetición siguen el mismo lenguaje visual.
-   Probar pantallas horizontales 16:9 y formatos alargados como 20:9, recortes, teclado virtual, combates individuales y dobles, cambios forzados, desconexiones y regreso a la partida.
-   El modo de escritorio conserva su apariencia y funcionamiento previos.
-   El resultado debe parecer una interfaz de videojuego de Pokémon diseñada para móvil, no una página de escritorio comprimida.
