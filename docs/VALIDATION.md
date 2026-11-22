# Validación de las versiones alfa

## Windows x64 — alpha.4, 2026-11-22

Base: ZIP oficial Pro 1.2.0 Windows x64, SHA-256 `7b572264df34ec77bc6c2edd3f18ca439f737a7ef0a0ea9306492ed60ca2abd8`. Se trabajó sobre copias de prueba, con perfiles de Electron separados del perfil personal.

- Suite Python: **60 pruebas; 43 aprobadas, 17 omitidas y ningún fallo** en Windows con Python 3.13.9. Las omisiones corresponden a integración Linux/AppImage/Glass y a enlaces simbólicos que necesitan permisos especiales. Incluye bloqueo real entre procesos, recuperación tras terminar un proceso hijo, detección de ejecutables y acceso propio de Inicio.
- Se verificaron las **32 combinaciones** de los cinco módulos Windows mediante planificación sin escritura. Esto comprueba composición y anclas; no equivale a compilar ni probar visualmente cada combinación.
- Se instalaron los cinco módulos y se compiló Showdex 1.4.2 con dependencias descargadas desde una caché vacía. En Windows se usa el enlazado hoisted de pnpm y copias de paquetes para evitar las rutas profundas de su almacén virtual. La reaplicación reutilizó la caché y recompiló correctamente.
- Showdown+ se importó desde el XPI oficial de GitHub y luego desde la extensión **real instalada en Firefox Windows** mediante `--xpi auto`. Se comprobó el origen Mozilla, versión 1.4 y SHA-256 `d128d2e8703bbe8d6a38141ee8591a37acd26c99003d788f1ccfc019b876030c`. El XPI del perfil conservó su huella.
- Electron cargó Calcdex y el tema Okayu. Se activó Showdown+ mediante el panel nativo, porque el modo smoke original de Pro desactiva todos los complementos al arrancar. La prueba verificó seis miembros por equipo, geometría y destinos de hover, estilos claros/oscuros en modo normal y teatro, estados de Unown, clics, recursos de los cuatro iconos y persistencia tras recargar. Glass estuvo ausente.
- Se revirtieron **176 archivos**. Los **900 archivos originales** del ZIP se compararon byte por byte y coincidieron después de revertir.

Reproducción del ensayo Electron sobre una instalación de prueba con los cinco módulos:

```bat
py -3 tools\validate_windows_runtime.py --installation C:\ShowdownPrueba --evidence C:\EvidenciaOkayu --profile C:\PerfilPruebaOkayu --skip-capture
```

Límites: no se midieron FPS ni consumo GPU en Windows. El capturador `capturePage()` de Electron produjo `UnknownVizError` en una ejecución, por lo que la prueba final utilizó aserciones DOM y omitió las capturas. Los diálogos Windows se comprobaron por construcción y análisis de sus solicitudes Unicode; su revisión visual manual completa sigue pendiente. No se probó Windows ARM64, el instalador Setup, ASAR, versiones futuras de Pro ni una ejecución nueva en Linux. Se añadió una matriz CI Linux/Windows para repetir la suite después de publicar los cambios.

## Validación anterior de Linux

Fecha: 2026-11-21. Plataforma probada: Linux x86_64. Base: Pokémon Showdown Pro 1.2.0 extraído de la distribución original. Pruebas realizadas con asistencia de IA; no hay una auditoría independiente.

## Motor del gestor

**15 pruebas automatizadas aprobadas** mediante `python3 -m unittest discover -s tests -v`:

- Instalación, aplicación repetida sin acumular cambios y reversión exacta.
- Cambio de selección de módulos y retirada de sus archivos.
- Fallo simulado de escritura con deshacer de la transacción.
- Terminación abrupta del proceso y recuperación posterior.
- Rechazo de reversión ante ediciones externas o respaldo alterado.
- Rechazo de una actualización desconocida, conservando sus archivos.
- Reaplicación sobre una reinstalación limpia conocida.
- Rechazo de contenido original desconocido y de colisiones con archivos ajenos.
- Planificación sin escritura en la aplicación.
- Rechazo de rutas de archivo maliciosas, enlaces simbólicos y extracción fuera de destino.
- Bloqueo de operaciones concurrentes.
- Diagnóstico sin rutas locales ni datos del perfil.

La integración continua reproduce estas pruebas del motor. No ejecuta las pruebas visuales ni los servicios externos.

## Integración real con la aplicación

Se instaló el conjunto completo sobre una **copia de prueba limpia**, usando el XPI oficial de Showdown+ 1.4 y una compilación local de Showdex 1.4.2. No se modificó la instalación personal en uso.

Para la compilación de desarrollo se reutilizó un checkout de Showdex con dependencias ya instaladas. El primer arranque desde una caché completamente vacía y todas las combinaciones posibles de módulos no se han probado de extremo a extremo.

Se aplicaron 164 cambios de archivo. Las comprobaciones en Electron usaron perfiles aislados y combates sintéticos:

| Área | Resultado observado |
| --- | --- |
| Avisos | Ocultar/restaurar textos y panel de habilidad; log y PS conservados; controles reconstruidos; modo cine y repeticiones; persistencia al recargar. |
| Okayu | Selector con Light, Dark, Pro y Okayu, más System; Hub sincronizado; persistencia; dimensiones idénticas a Pro en combate, controles y Calcdex. |
| Idiomas | Los 13 idiomas disponibles en Showdown; 4 escenarios de daño por idioma, con resultados idénticos; datos canónicos conservados; interfaz española y persistencia. |
| Showdown+ | Sprites HD, cuatro paneles en dobles, cambios de vida y estadísticas, apertura/cierre del calculador, ajustes, activación/desactivación y recarga. |
| Rendimiento | Se empaquetó la implementación optimizada previamente probada. Esta validación de instalación no repitió una medición nueva de FPS. |

La primera ejecución de la secuencia de auditorías compartiendo una sola sesión encontró interferencia entre la repetición abierta y la prueba del selector de tema. Las auditorías se repitieron con sesiones independientes y pasaron; esto es una limitación de la secuencia de pruebas, no una prueba de todas las transiciones posibles en uso real.

Durante las pruebas se observaron avisos de red de servicios externos, advertencias de extensión Manifest V2 y un error transitorio de almacenamiento al descargar/reinstalar la extensión. Las comprobaciones de ajustes y persistencia de Showdown+ pasaron. No se afirma que los complementos externos estén libres de errores de consola.

## Reversión sobre la base real

Después de las pruebas se retiró la instrumentación de auditoría y se ejecutó la reversión del gestor.

**Los 826 archivos de programa resultantes coincidieron por SHA-256 con los 826 originales.** La comparación excluyó la carpeta de resultados de pruebas creada por la auditoría, que no forma parte de la aplicación distribuida. Los recursos creados por los módulos se retiraron; pueden quedar directorios vacíos.

También se comprobó la planificación de cada uno de los cinco módulos por separado, sin escribir la instalación.

## Límites pendientes

- No se jugó una partida real para certificar esta combinación de paquetes.
- No se probaron Windows, macOS ni versiones futuras de Pro o Showdex.
- Los diálogos Zenity comparten el motor probado; no se realizó una auditoría visual completa de todos sus recorridos.
- No se probó una actualización pública real de Pro entre dos versiones compatibles, porque esta alfa solo declara soporte para 1.2.0.
- La extracción de AppImage conserva el paquete original; el gestor no lo reconstruye.

Los informes deben aportar resultados observados y versiones precisas. El objetivo de las comprobaciones de compatibilidad es detenerse ante una base desconocida, no prometer que cualquier actualización seguirá funcionando.

## Actualización alpha.2: detección y preparación guiada

Se añadieron 17 pruebas de descubrimiento, selección e identidad gráfica, para un total de **32 pruebas automatizadas aprobadas**. Cubren rutas con espacios, lectura de accesos sin ejecutarlos, proceso principal frente a renderers/terminales, ubicaciones de descargas, descarte de montajes temporales/experimental, preparación de un AppImage sin permiso de ejecución, reutilización, detección de una imagen cambiada, fallo de extracción, accesos de menú y recorrido sin selector de carpeta cuando hay una única instalación.

Además se preparó el AppImage original 1.2.0 real en una carpeta de prueba. Se verificó su SHA-256 sin cambios, la validación de los originales y que la siguiente detección devolviera una sola instalación persistente en lugar de su montaje temporal o de varios procesos. La salida extensa de extracción se guardó en un registro.

Los módulos de combate no cambiaron en alpha.2; las pruebas de Electron descritas arriba corresponden a alpha.1 y no se repitieron las mediciones del combate. La selección guiada y los diálogos se probaron mediante dobles de prueba; no se realizó una auditoría visual completa de Zenity.

### Logo de Okayu

Se incorporó el PNG del mantenedor sin alterar sus bytes. La prueba en Electron verificó la lectura del icono nativo (1402 × 1122), la clase de ventana de Okayu, el mismo recurso servido al cliente y su logo por CSS, y el logo del Battle Hub. Se inspeccionaron las capturas del cliente y del Hub. Los accesos se probaron en una carpeta de menú aislada, verificando la ruta del icono y la clase de ventana; no se sustituyó el acceso original.

Después de la prueba se revirtió el conjunto: los 826 archivos de programa volvieron a coincidir con los originales, incluido el PNG del icono. Se retiró el acceso administrado de prueba. Los módulos de combate no cambiaron. No se midió el comportamiento de todos los entornos de escritorio ni se cambió el icono del archivo AppImage comprimido.

## Actualización alpha.3: XPI, streamer e icono

Pasaron **50 pruebas Python**, que incluyen la ejecución de **11 pruebas Node** (7 de streamer y 4 de Glass) de captura, píxeles, privacidad, geometría y control de trabajo pendiente. CI fija Node 24. Las pruebas nuevas cubren perfiles nativos/XDG, Flatpak y Snap mediante directorios de prueba; perfiles absolutos y relativos, URI `jar:file:`, extensiones desactivadas, deduplicación, metadatos corruptos, selección gráfica/manual/descarga, rechazo por hash o compatibilidad y cambios durante la copia. Se comprueba que importar/revertir conserva el XPI original y los archivos de la aplicación.

Se verificaron los dos XPI **reales** de Mozilla y GitHub v1.4 y se detectó el paquete Mozilla instalado en el Firefox nativo del equipo. Los dos planes produjeron los mismos recursos adaptados: el manifiesto solo difiere en formato, con el mismo JSON. No se modificaron perfiles Firefox. No se ejecutó un Firefox Flatpak/Snap real: su descubrimiento está probado con estructuras de perfiles representativas.

La prueba nativa de streamer incluida en Pro pasó con los clientes antiguo y nuevo: visibilidad independiente de controles, Showdex, Hub, tooltips y Teras; correspondencia de píxeles; aparición/movimiento de contenido privado durante captura; navegación, zoom, cambio de tamaño y convergencia del visor. Se ejecutó con renderizado de prueba por software/visor 2D. El intento con superficies offscreen GPU no produjo el primer cuadro en este entorno; la integración de ventana nativa con GPU sí emitió en las combinaciones de la tabla. Esto no certifica todos los controladores ni todas las carreras de compositor posibles.

### Medición nativa de streamer

Cliente nuevo, batalla sintética, ventana de 1536 × 960, Calcdex disponible y cuatro segundos por escenario. «Antes» conserva el cine optimizado de alpha.2 y el streamer original; «después» añade esta revisión. Son muestras de una sola máquina, con diferencias de FPS de origen entre pasadas; no deben interpretarse como una garantía ni como una mejora porcentual universal.

| Escenario | Antes: cuadros dibujados/s | Después: cuadros dibujados/s |
| --- | ---: | ---: |
| Normal, máscaras privadas activas | 13,7 | 20,3 |
| Teatro, máscaras privadas activas | 13,5 | 14,1 |
| Teatro + Showdex + Hub visibles | 0,0 (Hub no disponible) | 17,0 |
| Normal + Showdex + Hub visibles | 16,3 | 23,2 |

La corrección funcional reproducible es que **el Hub ya no tiene ancho cero en teatro**. La captura del Hub pasa de toda la ventana al rectángulo de 360 px (48 px plegado), y la prueba confirma ese rectángulo y sus dimensiones HiDPI. Con el visor bloqueado, el test comprueba que el bucle no inicia más trabajo de captura/enmascarado hasta recibir confirmación.

Una comparación alternada de 16 lecturas por implementación sobre el **mismo DOM** dio medianas de 3,55 ms (original) y 2,65 ms (optimizada), con máscaras iguales. La mejora mucho mayor observada inicialmente (105 ms frente a 7 ms en la fase posterior de captura) incluía calentamiento y trabajo de otros componentes; **no representa el coste estable**. La primera expansión de Calcdex siguió produciendo una pausa/carga inicial en ambas pasadas. No se afirma haber eliminado ese coste ni alcanzado 60 FPS.

Los datos sin rutas personales están en [el informe JSON](benchmarks/streamer-linux-alpha3.json). `tests/native-streamer.cjs` es el hook de integración/medición usado con el harness `--smoke-test` de Pro en una copia desechable y un perfil aislado. La auditoría de privacidad usa `scripts/audit-streamer-mode.cjs` de la distribución original. No se ejecutan en CI porque requieren Electron, compositor y recursos del cliente real.

### Icono

El recurso anterior medía 1402 × 1122. Se recortaron sus márgenes transparentes exteriores y se colocó el dibujo centrado en un lienzo RGBA de **512 × 512**, manteniendo su relación de aspecto. No se redibujó el logo ni se cambió el archivo fuente del usuario. El acceso administrado usa `okayu-icon-512.png` para evitar la caché del nombre anterior; el icono nativo usa la misma imagen. Se verificaron la cabecera PNG, transparencia, tamaño cuadrado y selección del recurso en el acceso. La renovación visual de la barra de tareas requiere reiniciar la aplicación tras instalar; no se cerró la sesión personal durante estas pruebas.

### Integración final y Glass

El conjunto completo se aplicó a una copia de prueba y se ejecutó la auditoría nativa de Showdown+ usando el XPI de GitHub: sprites HD, cuatro paneles en dobles, daño/estadísticas, cine, restauración de Calcdex, ajustes y persistencia pasaron. Electron leyó los dos iconos como 512 × 512. Tras retirar la instrumentación, la reversión restauró de nuevo **los 826 archivos originales por SHA-256**. Se probó además una transacción del módulo Glass corregido y su reversión.

Glass se probó en una ventana nativa de Electron sobre COSMIC/Wayland, con perfil aislado: tarjeta en Add-ons, transparencia de superficie al 55 %, blur interno de 6 px en Pro/Okayu, opacidad del texto igual a 1, desactivación en Light/Dark, ajuste real de los deslizadores a 60 %/10 px, persistencia al recargar y lectura del alfa/grosor de COSMIC. El backend informó correctamente que el blur nativo de Wayland **no estaba disponible**. La captura de prueba verifica el contenido de la app, no certifica un efecto del compositor sobre el escritorio.

El backend KWin/X11 se probó con dobles de API: capacidad anunciada, comandos acotados al handle de esta ventana, retirada del efecto y uso de la API del WebContentsView. No se probó visualmente una sesión KDE, Ubuntu/GNOME ni otros controladores. Las ventanas transparentes de la auditoría se hicieron visibles sin foco y con throttling desactivado para que sus animaciones de prueba pudieran avanzar. Glass está apagado por defecto y no promete soporte nativo COSMIC completo.

También se actualizó la instalación habitual del usuario tras su confirmación de cierre, conservando su selección e incorporando Glass apagado. Se verificó el estado del gestor, la procedencia Mozilla del XPI reutilizado y el recurso cuadrado del acceso; después se abrió de nuevo la aplicación. Los perfiles Firefox y el archivo fuente del logo no se modificaron.


### Revisión local de Glass — 21 de noviembre de 2026 (sin publicar)

El módulo `glass` 0.2.0-local.1 sustituye la adaptación parcial de alpha3. La auditoría `tests/native-glass-surfaces.cjs` pasó en el cliente real nuevo, con perfil aislado, Pro y Okayu, combate de dobles, teatro, Calcdex, Hub y streamer con complementos visibles. Comprueba alfa de fondo del Hub/cliente del 55 %, ausencia de fondos/gradientes opacos acumulados, conservación de estilos del combate y sprites, captura con contenido del Hub mientras su vista nativa está oculta, menú de opciones y ventana nativa de ajustes de Enhanced Tooltips. Las capturas se hicieron con ventanas de auditoría sin foco. Los errores de publicidad/red ajenos al escenario no se consideran fallos del efecto; la prueba bloquea subframes publicitarios en su perfil aislado.

El blur se verificó sobre píxeles, no solo leyendo `backdrop-filter`: el contraste de un patrón detrás de un menú pasó de 127.49 a 0.27 con 16 px. La prueba nativa sin red `tests/native-glass-fixture.cjs` compara también los píxeles del campo de combate antes/después, monta una tarjeta tras activar Glass y verifica que cambios de animación del combate no disparan nuevas mediciones. El contador de mediciones del cliente real quedó estable durante los intervalos de reposo de ambos temas. Estos datos no constituyen una prueba de FPS ni de blur externo del compositor.

La medición lee estilos antes de escribir los marcadores, omite páginas ocultas y agrupa avisos desde el proceso principal para evitar la limitación de temporizadores de renderers ocultos. Las mutaciones pendientes se conservan antes de desconectar el observador. El adaptador no necesita una recarga para incorporar paneles recién montados.

Para repetir las pruebas nativas, usa **una copia desechable del AppDir**, un perfil de prueba y el runtime Electron de Showdown Pro 1.2.0; nunca instrumentes la instalación habitual. El fixture sin red es un punto de entrada Electron: en la copia, haz que `app/entry.cjs` cargue su ruta absoluta, configura `GLASS_FIXTURE_EVIDENCE` a una carpeta de prueba y, opcionalmente, `GLASS_NATIVE_APP` al `resources/app` de esa copia para reutilizar la configuración Linux. Para la integración, conecta el hook `native-glass-surfaces.cjs` al punto de la auditoría `--smoke-test --new-client` posterior a la carga de Showdex y pasa los objetos nativos indicados en su firma; `GLASS_LOCAL_EVIDENCE` define la carpeta de capturas. El hook `native-glass.cjs` conserva las comprobaciones de Light/Dark, controles, persistencia y lectura COSMIC. Restaura la instrumentación antes de verificar la reversión del gestor.

La suite local volvió a pasar sus **50 pruebas Python**, incluidas las **12 pruebas Node** (7 de streamer y 5 de Glass). La auditoría de ajustes confirmó Pro/Okayu activos, Light/Dark sin Glass, uso de los deslizadores, persistencia tras recarga y herencia COSMIC. La reversión de la copia instrumentada, tras retirar la instrumentación, restauró **los 826 archivos originales por SHA-256**.

La limitación de COSMIC/Wayland sigue vigente: la revisión corrige transparencia y blur **de contenido detrás de menús dentro de la app**, pero Electron no solicita blur nativo del escritorio. La tarjeta lo identifica como «Blur de menús». No se ha enviado esta revisión a GitHub.

La revisión se aplicó a la instalación habitual mediante el gestor (transacción `035367e0a6294dd3b02a95e51b06abe7`), cambiando nueve archivos y conservando los siete módulos seleccionados. El estado final fue `installed`, sin conflictos; los archivos de preferencias y ajustes Glass conservaron sus SHA-256. Se abrió de nuevo la aplicación. El gestor de Descargas recibió los mismos cambios y documentación, con respaldo local de sus archivos anteriores. No se publicó ningún commit, release ni archivo remoto.


### Corrección local de rendimiento y arranque — 21 de noviembre de 2026 (sin publicar)

La revisión anterior verificaba apariencia y reposo, pero eso no detectaba el coste durante la interacción. Glass 0.3.0-local.1 retira el adaptador de medición por elemento y usa una hoja fija de unos 4 KB. Desactivado antes de arrancar conserva el BrowserWindow opaco original; se indica que cambiar el canal alfa requiere reabrir la app. Core 0.1.2-local.1 elimina las copias redundantes de la hoja base entre preload y arranque. Tema Okayu 0.1.4-local.1 selecciona Okayu una sola vez y recuerda el último tema para que el Hub lo reciba en su HTML inicial.

`tests/native-glass-performance.cjs` ejecuta 240 frames con 20 sprites animados, 75 filas de controles, cambios de clases/estilos, hover y nuevas líneas del log. CDP Performance mide el renderer del cliente en perfiles aislados, sin red. Se hicieron dos pasadas para baseline, Glass anterior activo y Glass nuevo activo. Valores en segundos acumulados por pasada:

| Caso | TaskDuration | RecalcStyleDuration | ScriptDuration | Recorridos de Glass |
| --- | --- | --- | --- | --- |
| Sin Glass | 0.331 / 0.327 | 0.040 / 0.043 | 0.039 / 0.041 | 0 |
| Glass anterior activo | 1.030 / 1.000 | 0.482 / 0.457 | 0.214 / 0.214 | 40 |
| Glass nuevo activo | 0.355 / 0.352 | 0.090 / 0.089 | 0.038 / 0.038 | 0 |

Una pasada adicional con Glass instalado y apagado dio TaskDuration de 0.349 s antes y 0.318 s después. La prueba no mide tiempo GPU ni demuestra una mejora de FPS: todos los casos mantuvieron mediana de frame de 33.3 ms y p95 de 50 ms en esta sesión de auditoría. Los resultados respaldan una reducción del trabajo de JavaScript y estilos; no certifican el rendimiento de todas las partidas, drivers ni compositores. La transparencia activa conserva un coste de composición nativa.

El fixture de píxeles pasó con la hoja fija: campo idéntico antes/después, tarjetas nuevas transparentes sin observador y blur real de menú (contraste 127.5 → 0.84 con 16 px). La integración con cliente real pasó en Pro/Okayu, dobles, Calcdex, teatro, streamer con Hub y complementos, opciones y ventana de Enhanced Tooltips. Verificó insignias de tipos, barras HP e iconos sin cambios, cero recorridos, tema inicial Okayu y marcador de compatibilidad de tema sin una copia de CSS. El contraste del menú real pasó de 127.49 a 0.27. El caso del fondo inline del body se cubrió para que preservar una imagen no excluya por accidente todos los descendientes.

Para perfilar, usa el mismo runtime y AppDir de prueba indicados arriba, con `native-glass-performance.cjs` como entrada y `BENCH_PROFILE` en una carpeta aislada. `BENCH_MODULE` selecciona el archivo principal de Glass (vacío para baseline); `BENCH_ACTIVE=1` lo enciende antes de crear la ventana y `BENCH_LABEL` identifica el resultado JSON. `BENCH_APP` permite reutilizar la configuración Linux de la copia. No conectes el debugger de esta prueba a la sesión personal. `native-glass-disabled.cjs` audita el camino opaco en el cliente real. Las pruebas unitarias cubren la ausencia de recorridos/observadores, selección predeterminada una sola vez, caché de tema validada y entrega única de CSS con fallback.

La revisión final pasó las **50 pruebas Python**, incluidas **17 pruebas Node** (7 de streamer y 10 de Glass/arranque). La auditoría de ajustes volvió a confirmar Pro/Okayu, Light/Dark, persistencia y COSMIC. El camino nativo opaco y la ausencia de mutaciones de la tarjeta Glass ante cambios de otros ajustes se verificaron en el cliente real. La reversión de la revisión restauró los **826 archivos originales por SHA-256**; también se validó la composición final de los siete módulos.

La corrección de rendimiento se aplicó a la instalación habitual tras confirmar su cierre: transacción `175d9eeb1b5540cfb87d7b4dfc3faf50`, once archivos cambiados, siete módulos conservados y estado `installed` sin conflictos. Se compararon 114 archivos de la composición final con la instalación y se conservaron los SHA-256 de preferencias y ajustes Glass. Se abrió la app actualizada. Los parches adicionales de Showdown+ en el preload se validaron como parte de la composición, no contra el payload aislado de Okayu. No se publicó nada en GitHub.


### Corrección local de geometría y prioridad CSS — 21 de noviembre de 2026 (sin publicar)

La reducción de copias de Core 0.1.2-local.1 dejó las declaraciones normales únicamente en origen usuario, cuya prioridad es inferior a los estilos de autor del cliente nativo. Eso alteró distribución, fuentes y espaciados incluso con Glass apagado. La referencia de Pro instala las reglas en ambos orígenes; las declaraciones normales necesitaban conservar el origen autor. Core 0.1.3-local.1 y Tema Okayu 0.1.5-local.1 entregan un paquete completo al preload y separan declaraciones normales/`!important` por origen, sin duplicar toda la hoja. Se conservan las abreviaturas CSS serializadas por Chromium: expandir `font` en propiedades individuales también perdió reinicios implícitos y produjo diferencias de 0.8 px que detectó la prueba nativa y se corrigieron.

`tests/native-layout-origins.cjs` reproduce el caso de Replays con estilos nativos competidores. En el fixture, las filas rotas tenían `display:block`, padding `1px 3px` y alto de 21.2 px. La referencia daba `display:flex`, dirección `column`, padding `12px 14px` y alto de 75.6 px. La entrega separada recuperó exactamente las medidas de referencia. La prueba comprueba también que la hoja de autor no tenga declaraciones importantes y la de usuario solo contenga declaraciones importantes. Los contadores CSSOM de propiedades expandidas no se usan como conteo de declaraciones: las abreviaturas pueden serializarse de distinta forma sin alterar el resultado.

`tests/native-layout-regression.cjs` compara posiciones, dimensiones, display, posición, márgenes, padding, gaps, fuentes y alineación en el cliente real. La referencia opcional `LAYOUT_ORIGINAL_APP` usa las hojas originales de Pro 1.2.0 y Replays; conserva el teatro optimizado y el branding seleccionados deliberadamente por los módulos. La comparación cubre Pro/Okayu y Glass activado/apagado: cabecera, pestañas, botones, iconos, Replays, opciones nativas y teatro con chat/Calcdex abiertos, cada uno plegado por separado y ambos plegados. El test pulsa los botones reales y espera el atributo de estado: escribir la preferencia por IPC no cambia por sí solo el estado local del renderer de teatro.

Para ejecutar el fixture sin red, usa una copia desechable del AppDir con `native-layout-origins.cjs` como entrada Electron; `LAYOUT_NATIVE_APP` apunta a su `resources/app` y `LAYOUT_EVIDENCE` a una carpeta de resultados. El hook de integración usa el punto de la auditoría posterior a la carga de Showdex y la misma firma nativa que los otros hooks. El perfil está aislado y los combates y filas del listado son de prueba; no se envían comandos ni se modifican partidas del usuario.

La auditoría final completó **656 comparaciones de geometría en 28 escenarios**, usando las hojas originales de Pro/Replays y conservando los módulos intencionales de teatro/branding. Todas coincidieron. Se verificaron las cuatro combinaciones de paneles plegados mediante clics reales. La suite pasó **50 pruebas Python**, incluidas **18 pruebas Node** (7 de streamer y 11 de Glass/arranque/CSS). El fixture de orígenes también verificó la partición de prioridades y la equivalencia geométrica con la carga original.

La regresión de Glass/streamer volvió a pasar con el nuevo cargador: fondos al 55 %, combate e iconos conservados, captura del Hub, opciones, ventana complementaria y blur de menú real. Tras retirar la instrumentación, la reversión restauró de nuevo los **826 archivos originales por SHA-256**, y la composición final de los siete módulos quedó validada.

La corrección de geometría se aplicó a la instalación habitual tras confirmar su cierre: transacción `79a00bebc0e0439c8c86af219685e726`, ocho archivos cambiados, siete módulos conservados y estado `installed` sin conflictos. Se cotejaron 115 archivos con la composición final; las preferencias y ajustes Glass conservaron sus SHA-256. Se abrió de nuevo la app. El gestor de Descargas contiene la misma revisión. No se publicó nada en GitHub.


### Alfa compuesto, barras de Showdown+ y tooltip — 21 de noviembre de 2026 (sin publicar)

Se encontró una segunda composición del fondo del log: con alfa configurado 0.55, sus píxeles daban 203/255 (≈0.80), mientras controles y Calcdex daban 140/255 (≈0.55). Los fondos CSS del log y sus ancestros eran transparentes; el cliente conservaba `backdrop-filter:blur(4px)`. Al retirar ese filtro, el log bajó a 140/255. Glass 0.3.1-local.1 desactiva filtros heredados en superficies planas y aplica el blur configurado solo en menús/tooltips; 0 px genera `none`, evitando incluso la composición de `blur(0px)`. Las ventanas flotantes reciben fondo con el RGB y alfa del tema. Los selectores de exclusión usan `:where` para que no aumenten la especificidad y anulen por accidente el tinte del tooltip. Se preservan los gráficos del combate y los indicadores de checkbox/radio.

Las barras de equipos estaban en `.phd-team::before` y no se ocultaban al activar Glass. Sus imágenes se resolvían a `https://play.pokemonshowdown.com/assets/pill_dark.png`, fuera de la extensión, tanto con Glass encendido como apagado. Showdown+ 0.2.1-local.1 elimina la entrega de `ui/panels.css` como CSS de content-script en la copia privada de Electron y crea un único enlace a `chrome.runtime.getURL('ui/panels.css')`. Así imágenes y fuentes relativas quedan ancladas a `ui/` dentro de la extensión. Se declara la hoja como recurso accesible; el XPI original y los perfiles Firefox no se modifican.

`tests/native-glass-alpha.cjs` captura píxeles BGRA del cliente y del Hub, espera las actualizaciones de estilo y frames del compositor, y compara alfa en log, controles y Calcdex/Hub para 0.20, 0.55, 0.86 y 1.00, en Pro/Okayu y normal/teatro. Verifica las dos barras de Showdown+ con Glass encendido/apagado, carga real de imágenes de 588×128 en variantes clara/oscura, iconos presentes y un solo enlace de estilos. El tooltip se genera mediante las funciones reales de BattleTooltips (incluyendo Enhanced Tooltips), y se comprueban RGB/alfa del tema, opacidad del texto igual a 1 y blur 0/12 px.

La prueba nativa pasó **16 combinaciones** de tema/modo/alfa y **4 casos de tooltip** (Pro/Okayu, blur 0/12 px). Con alfa 0.55, el log corregido produce 140/255, igual que controles, Calcdex y Hub. Las imágenes de las dos barras cargan desde `chrome-extension://…/ui/assets/` en variantes clara/oscura y no cambian sus estilos ni dimensiones al alternar Glass. Los recursos originales del XPI se conservan; solo cambia la forma de entregar su hoja en Electron. La suite local pasó **50 pruebas Python**, incluidas **20 pruebas Node** (7 de streamer y 13 de Glass/arranque/recursos).

La regresión de geometría volvió a pasar sus **656 comparaciones** tras reparar los recursos de Showdown+. La prueba de menús/streamer también pasó: contraste del patrón detrás del menú 57.49 → 0.27 con tinte/blur; se conservaron combate e iconos, captura del Hub y ventana complementaria. La reversión de la copia de prueba restauró los **826 archivos originales por SHA-256**, y se validó la composición final de siete módulos.

Esta revisión se aplicó localmente con la aplicación cerrada: transacción `fb3fbb94952c4ac381282db02388d00a`, siete archivos cambiados y siete módulos conservados. El estado final fue `installed` sin conflictos; se cotejaron 116 archivos con la composición y se conservaron los SHA-256 de preferencias y ajustes Glass. Se abrió la aplicación actualizada y el gestor de Descargas contiene la misma revisión. No se publicó nada en GitHub.


### Seis Pokémon y controles de sprites — revisión local sin publicar

La prueba nativa de referencia reprodujo una lista conocida de seis Pokémon con `totalPokemon=4`: Showdown+ dibujaba cuatro casillas del lado afectado y seis del rival. El delta del importador usa el mayor de ambos tamaños y las filas CSS automáticas distribuyen el alto de la barra. Con el cambio se verificaron seis iconos de cada lado, totalmente dentro de sus barras y accesibles al puntero, en vista normal y teatro.

`tests/native-battle-controls.cjs` comprueba las variantes clara/oscura, imagen de barra y variable de fondo de banners, tema general Okayu conservado, botones adyacentes, etiquetas accesibles, mapeo Unown normal/shiny, clics reales y persistencia tras recargar el cliente. Los cuatro PNG se cargaron desde el protocolo local de la aplicación. Las capturas de normal/teatro muestran las seis casillas y los controles Solrock/Lunatone. El fixture utiliza un perfil separado y comandos de combate simulados; no envía acciones al servidor.

La suite local pasó 50 pruebas Python, incluidas 21 pruebas Node (7 de streamer y 14 de Glass/arranque/recursos/controles). Los hashes de todos los recursos coinciden con sus manifiestos; las imágenes originales no se modificaron.

La revisión se aplicó a la instalación habitual con Showdown cerrado: transacción `665198e8673d45b78c330d0595e4011f`, 15 archivos cambiados y siete módulos conservados. Estado `installed` sin conflictos; composición verificada y SHA-256 de preferencias, Glass y tema conservados. El gestor de Descargas contiene la misma revisión. No se publicó nada en GitHub.

Separación para publicación: Solrock/Lunatone y su selector se trasladaron a Showdown+, con punto de integración propio en los controles de teatro. Se actualizaron los tests de estado y el fixture nativo para la API independiente; 50 pruebas Python pasaron tras la separación. Las pruebas visuales nativas anteriores corresponden a la versión previa a esta separación; no se atribuyen nuevas mediciones de rendimiento a este refactor.
