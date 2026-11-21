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

Se añadieron 15 pruebas de descubrimiento y selección, para un total de **30 pruebas automatizadas aprobadas**. Cubren rutas con espacios, lectura de accesos sin ejecutarlos, proceso principal frente a renderers/terminales, ubicaciones de descargas, descarte de montajes temporales/experimental, preparación de un AppImage sin permiso de ejecución, reutilización, detección de una imagen cambiada, fallo de extracción, accesos de menú y recorrido sin selector de carpeta cuando hay una única instalación.

Además se preparó el AppImage original 1.2.0 real en una carpeta de prueba. Se verificó su SHA-256 sin cambios, la validación de los originales y que la siguiente detección devolviera una sola instalación persistente en lugar de su montaje temporal o de varios procesos. La salida extensa de extracción se guardó en un registro.

Los módulos de combate no cambiaron en alpha.2; las pruebas de Electron descritas arriba corresponden a alpha.1 y no se repitieron las mediciones del combate. La selección guiada y los diálogos se probaron mediante dobles de prueba; no se realizó una auditoría visual completa de Zenity.
