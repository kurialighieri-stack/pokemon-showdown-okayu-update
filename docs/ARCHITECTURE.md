# Arquitectura

## Modelo de instalación

Okayu Update es un gestor externo. No se queda residente interceptando el combate. Modifica una instalación extraída del programa original y registra exactamente los bytes sustituidos o creados. Los módulos se componen en un plan antes de escribir la instalación.

El orden declarado es: conexión común, rendimiento, avisos, tema, Showdown+ e idiomas. La conexión común carga estilos y scripts seleccionados durante el arranque del cliente. El módulo «Mejoras de optimización» (`performance`) reemplaza las implementaciones originales del modo cine y streamer; no deja activo un segundo observador. El módulo de avisos agrega una llamada opcional al constructor de controles presente tanto en el modo cine original como en el optimizado.

La versión del paquete y las huellas de los archivos de programa deben coincidir. Este mecanismo adapta una versión concreta; no es una API oficial de plugins proporcionada por Pro.

## Paquete de módulo

`modules/index.json` enumera los módulos de confianza distribuidos con el gestor. Cada `addon.json` contiene:

- `id`, `name`, `version`, `order` y `appVersions`.
- `files`: archivos nuevos o sustituidos y SHA-256 de su contenido.
- `edits`: anclas literales que deben aparecer exactamente una vez.
- `platformFiles` y `platformEdits`: recursos y anclas adicionales por plataforma; Windows utiliza un ICO propio y la identidad de ventana Okayu.
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

La interfaz gráfica utiliza diálogos de Zenity y comparte el mismo motor que la CLI. Incluye selección de instalación/módulos, importación de XPI, reversión, recuperación, diagnóstico y apertura de la aplicación. Desde alpha.2, el gestor detecta accesos del menú, el proceso principal y ubicaciones habituales; no busca por texto de terminal ni enumera procesos hijos. Reconoce el archivo AppImage de origen y excluye los montajes temporales.

La preparación crea una instalación persistente por SHA-256 dentro de la carpeta de datos del gestor. Reutiliza una preparación existente, recuerda la selección y distingue un AppImage actualizado. Si el archivo no tiene permiso de ejecución, utiliza una copia temporal sin cambiar sus bytes ni sus permisos. La extracción y la compilación muestran progreso y guardan los registros extensos.

Después de instalar se crea un acceso propio en el menú. No se sobrescribe el acceso original ni un acceso Okayu personalizado. La reversión retira únicamente el acceso administrado que apunte a esa instalación.

La extracción de AppImage conserva el archivo original y no vuelve a empaquetarlo.

## Identidad gráfica del módulo Okayu

El PNG del módulo sustituye el icono nativo en `app/assets/icons/icon.png`, ya utilizado por la ventana y el Battle Hub. El cliente usa ese mismo recurso en las cabeceras conservando su geometría. Los bytes originales del icono se respaldan como cualquier otro archivo, y la imagen nueva se incluye en las huellas del módulo.

El tema registra una clase de ventana Linux propia que coincide con el acceso del gestor. La conexión común evita la actualización automática de accesos globales de Pro en la copia modificada; el gestor crea y retira únicamente su acceso. Así el original mantiene su lanzador y su icono. La marca pertenece a la instalación del módulo y no a la selección momentánea de paleta.

## Importación verificada de XPI (alpha.3)

`okayu_update/xpi.py` separa búsqueda y validación. Solo consulta las rutas conocidas de Firefox Linux, Flatpak y Snap, los registros de perfiles y el GUID de Showdown+. Deduplica perfiles/archivos resueltos y limita el tamaño de registros. La GUI permite elegir candidato, archivo manual o enlaces oficiales; la CLI usa detección si no recibe XPI.

`import.acceptedPackages` declara los dos hashes oficiales admitidos. El gestor copia el archivo a una carpeta temporal, verifica ese mismo snapshot (SHA-256, identidad, versión, manifiesto y recursos) y lo extrae con las protecciones de rutas habituales. Los deltas validan sus archivos de entrada antes de adaptarlos. Un fallo no llega a la transacción. El comprobante de recursos importados omite la ruta Firefox.

## Streamer y composición de módulos (alpha.3)

El emisor captura la región nativa del Hub en vez de leer y recortar el bitmap de toda la ventana. Su geometría deriva de la barra lateral, independiente del ancho del cliente en teatro. La caché no se repuebla con capturas de una época invalidada. Las consultas de paneles y geometrías se reutilizan solo dentro de una lectura de máscaras; la lectura posterior reconstruye sus datos, sin reutilizar posiciones antiguas. El bucle comprueba el ACK pendiente antes de iniciar otro ciclo de captura/enmascarado; conserva solo la captura anticipada ya iniciada. No elimina las comprobaciones de privacidad del emisor original.

Okayu añade su color al emisor y al visor mediante anclas pequeñas, en vez de entregar una segunda copia completa que pudiera sobrescribir las optimizaciones. Se puede instalar Okayu sin rendimiento y rendimiento sin Okayu.

El icono nativo de alpha.3 es un PNG RGBA cuadrado de 512 × 512; conserva la proporción del dibujo y usa un recurso de nombre nuevo en el acceso para evitar la caché del icono rectangular anterior. Ambos recursos pertenecen a la transacción del tema y se retiran/restauran con ella.

## Glass: capacidades separadas

`modules/glass` añade un módulo opcional sin reemplazar la hoja de estilos ni el panel completo de Pro. Conecta un archivo principal, estilos de superficie y una tarjeta independiente junto a la lista de Add-ons. Reutiliza el IPC existente del panel con una clave exacta `okayuGlass`, valida sus valores y guarda un JSON propio mediante renombrado. El renderer del cliente no recibe acceso al sistema de archivos ni comandos nativos.

Con Glass desactivado al arrancar se crea el BrowserWindow opaco original, sin vistas adicionales, adaptador del cliente, observadores de superficies ni solicitud de blur. Activarlo/desactivarlo guarda la preferencia y avisa si se debe reabrir la app para cambiar el tipo de ventana nativa. En la ventana transparente se puede apagar/restaurar el estilo inmediatamente; reabrirla elimina también el coste del canal alfa. Cambiar transparencia o blur no requiere reinicio.

Solo con Glass activado al arrancar se usa BaseWindow con un WebContentsView explícito para el Hub y el WebContentsView original del cliente. En teatro se oculta la vista nativa del Hub, conservando su DOM para streamer; no se duplica la interfaz. Las ventanas de ajustes y el tooltip nativo comparten la configuración.

El adaptador anterior basado en getComputedStyle, TreeWalker, marcadores por elemento y un MutationObserver de superficies fue retirado. Ahora se instala una hoja fija de unos 4 KB en una capa CSS de origen usuario, con reglas importantes que prevalecen sobre los fondos del tema sin incrementar su especificidad. Una base común evita acumular alfa en tarjetas anidadas. No se mide ni recorre el DOM, no hay IPC de hover ni regeneración de CSS al montar controles o recibir líneas del combate. Se conservan el árbol del combate, imágenes, iconos, etiquetas de tipos y barras de salud. El texto, sus sombras y la geometría no cambian. Glass retira también los `backdrop-filter` heredados de superficies planas: en este Chromium, el filtro nativo del log volvía a componer el fondo semitransparente. Los filtros se limitan a menús y tooltips, con `none` para 0 px. Esas ventanas flotantes reciben el mismo tinte de Pro/Okayu para que el fondo del combate no sustituya su color. No se desenfocan los paneles grandes.

El addon Okayu selecciona ese tema una sola vez mediante `okayuDefaultThemeVersion` en las preferencias de Showdown. Después respeta las elecciones del usuario. El Hub recuerda el último tema validado en `okayu-theme.json` y su HTML recibe el atributo de tema antes del primer render. Okayu usa las reglas de Pro con variables de paleta, sin duplicar una interfaz. La conexión común entrega al preload un paquete completo de estilos (cliente, teatro, Replays y módulos). Chromium lo analiza mediante CSSOM y se conserva cada declaración de `style.cssText`, incluidas abreviaturas como `font` y sus reinicios implícitos. Las declaraciones normales se insertan con origen autor y las `!important` con origen usuario, preservando la prioridad de distribución de Pro sin duplicar la hoja completa. El arranque espera la confirmación y no vuelve a insertar el paquete. Si falla la entrega temprana, se restaura la carga de compatibilidad a ambos orígenes. El nodo `showdown-pro-theme` queda vacío.

El lector COSMIC acepta solo los archivos conocidos de tema, valores y tamaños limitados. Observa tres directorios de preferencias sin recorrer ni modificar el resto del sistema. Otros escritorios usan controles manuales. El backend X11 consulta la capacidad anunciada y dirige `xprop` mediante argumentos, sin shell, únicamente al handle de esta ventana; no busca ni cambia ventanas ajenas. Wayland informa de la ausencia de API nativa en Electron: no hay una simulación etiquetada como Frosted Glass real ni cambios globales del compositor. Un backend Wayland real queda pendiente; no se distribuye un runtime Electron modificado.

El adaptador de Showdown+ carga `ui/panels.css` mediante un único enlace a la URL de la extensión, en vez del transporte CSS de content-script de Electron. Así las URLs relativas de imágenes y fuentes conservan su base `ui/`. El enlace se crea al estar disponible el documento; cualquier observador de arranque se desconecta inmediatamente. Se utilizan los recursos originales y no se altera el XPI fuente.


### Controles de combate con sprites

`battle-messages` conserva la clave de visibilidad existente y añade `okayuShowdownPlusPanelTheme` (`light`/`dark`) en el almacenamiento del cliente. Sin elección explícita sigue la clase clara/oscura del tema. Unown normal/shiny representa textos visibles/ocultos; Solrock/Lunatone representa barras y banners claros/oscuros. Los botones conservan título, etiqueta accesible y estado pulsado. Sus PNG locales originales se presentan en SVG con viewBox ajustado al contenido, sin red ni modificación de las imágenes. El selector de barras se oculta si Showdown+ no está cargado.

El adaptador de Showdown+ expone las URL privadas de las dos imágenes de barra y una marca en la raíz al cargar su hoja. Las reglas de presentación seleccionan imagen, fondo y tinta de los componentes, incluidos los banners con shadow DOM, sin cambiar el tema general. Un delta del importador, protegido por el SHA-256 original de `ui/panels.js`, usa el mayor entre el tamaño declarado y la lista conocida; evita truncar una selección de cuatro de un equipo de seis. Las filas CSS automáticas con mínimo cero distribuyen el espacio disponible según el número real de miembros. No se alteran los datos del equipo, comandos o animaciones.

El selector de barras y banners pertenece ahora exclusivamente a `showdown-plus`: script, estado persistente y sprites Solrock/Lunatone. Se adjunta al mismo grupo visual de controles después del botón Unown cuando está instalado, o crea ese grupo cuando el módulo de textos no está seleccionado. El módulo de textos conserva solo visibilidad y sprites Unown.
