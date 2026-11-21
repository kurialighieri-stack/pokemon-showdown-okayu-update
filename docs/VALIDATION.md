# Validación de las versiones alfa

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
