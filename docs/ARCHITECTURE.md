# Arquitectura

## Modelo de instalación

Okayu Update es un gestor externo. No se queda residente interceptando el combate. Modifica una instalación extraída del programa original y registra exactamente los bytes sustituidos o creados. Los módulos se componen en un plan antes de escribir la instalación.

El orden declarado es: conexión común, rendimiento, avisos, tema, Showdown+ e idiomas. La conexión común carga estilos y scripts seleccionados durante el arranque del cliente. El módulo de rendimiento reemplaza la implementación original del modo cine; no deja activo un segundo observador. El módulo de avisos agrega una llamada opcional al constructor de controles presente tanto en el modo cine original como en el optimizado.

La versión del paquete y las huellas de los archivos de programa deben coincidir. Este mecanismo adapta una versión concreta; no es una API oficial de plugins proporcionada por Pro.

## Paquete de módulo

`modules/index.json` enumera los módulos de confianza distribuidos con el gestor. Cada `addon.json` contiene:

- `id`, `name`, `version`, `order` y `appVersions`.
- `files`: archivos nuevos o sustituidos y SHA-256 de su contenido.
- `edits`: anclas literales que deben aparecer exactamente una vez.
- `clientScripts` y `styles`: recursos del cliente que carga la conexión común.
- `rebuildShowdex`: necesidad de recompilar el calculador.
- `import`: paquete externo admitido por SHA-256, utilizado por Showdown+.

Los hashes locales detectan discrepancias de contenido; no constituyen una firma de editor. Los paquetes de este repositorio se consideran código de confianza. No hay un mercado de módulos ni descarga/ejecución automática de instaladores comunitarios.

## Instalación y cambio de selección

1. Identificar `resources/app` y la versión original.
2. Tomar un bloqueo exclusivo del gestor y comprobar que no se ejecuta esa instalación.
3. Comprobar versión, huellas, rutas y ausencia de transacciones pendientes.
4. Si ya está instalado el gestor, reconstruir virtualmente los originales a partir de los respaldos.
5. Componer los módulos seleccionados; cada ancla debe ser inequívoca.
6. Importar Showdown+ si fue seleccionado, conservando el paquete externo separado del repositorio.
7. Si hace falta, compilar Showdex en una carpeta temporal. Un fallo aquí no modifica la aplicación.
8. Guardar respaldos, hashes y registro de recuperación fuera de la instalación.
9. Sustituir archivos mediante escrituras temporales y renombrado; registrar el estado activo al terminar.

La operación conjunta sobre varios archivos no es una transacción atómica del sistema de archivos. El registro permite deshacer escrituras si el proceso falla o recuperar la operación después de una interrupción. Por eso la aplicación debe estar cerrada durante instalación, reversión y recuperación.

## Reversión y recuperación

La reversión exige la misma versión de aplicación y que los archivos sigan coincidiendo con la instalación registrada. Verifica también los respaldos. Si hubo ediciones externas, se detiene sin sobrescribirlas.

La recuperación admite únicamente los valores anteriores o posteriores registrados para cada archivo. Una modificación externa durante una operación requiere revisión; el gestor evita restaurar sobre contenido desconocido.

Los directorios vacíos pueden permanecer después de revertir; los archivos originales se restauran byte por byte. Los respaldos se conservan para diagnóstico y no se borran automáticamente.

## Actualizaciones

La aplicación original mantiene su identidad, perfil y actualizador. Los respaldos y módulos están fuera de la instalación reemplazable. Una actualización puede sustituir los archivos modificados: hay que volver a ejecutar el gestor con un adaptador compatible.

Una versión desconocida se rechaza antes de instalar. Una reinstalación limpia conocida puede recibir los módulos nuevamente. Una mezcla parcial de originales, archivos modificados o ediciones ajenas no se acepta como actualización limpia.

Los módulos de tema e idiomas usan una compilación explícita de Showdex con prioridad en el protocolo local y el cargador. Esto evita que otra generación del calculador oculte silenciosamente esos módulos, pero fija Showdex a la versión del adaptador. Su adopción de versiones nuevas requiere pruebas y una revisión del adaptador.

## Compilación de Calcdex

Se extrae el código fuente incluido en la distribución original de Pro. Las dependencias fijadas se preparan con el pnpm incluido y `--ignore-scripts`. Los hooks de Pro se aplican al compilar sin editar el checkout original. El tema cambia las variables de color; los idiomas cambian recursos y etiquetas, conservando los datos canónicos y el motor de daño.

La caché de compilación permanece fuera de la instalación. Esta alfa no empaqueta un calculador compilado ni instala un runtime nuevo.

## Interfaz

La interfaz gráfica utiliza diálogos de Zenity y comparte el mismo motor que la CLI. Incluye selección de instalación/módulos, importación de XPI, reversión, recuperación, diagnóstico y apertura de la aplicación. La extracción de AppImage crea una distribución extraída; no modifica el archivo AppImage original ni vuelve a empaquetarlo.
