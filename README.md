# Pokemon Showdown: Okayu Update

<img src="modules/theme-okayu/files/app/assets/icons/icon.png" width="100" alt="Logo Okayu" />

**Desarrollado con asistencia extensa de IA (OpenAI Codex), bajo la dirección del mantenedor.** Consulta [la declaración de uso de IA](AI_DISCLOSURE.md), las [pruebas de escritorio](docs/VALIDATION.md) y las [pruebas de Android](android/VALIDATION.md).

Okayu Update reúne un **gestor de modificaciones reversibles para Linux y Windows** sobre [Pokémon Showdown Pro](https://github.com/Ryukotsuki/PokemonShowdownPro), y un **port independiente para Android distribuido como APK de prueba**.

**Licencia del código propio: [GNU AGPL v3 o posterior — copyleft fuerte](LICENSE) (`AGPL-3.0-or-later`).**

**Escritorio: alpha.4 para Linux y Windows x64, compatible con Pro 1.2.0 cuando sus archivos coinciden con el adaptador de cada plataforma. Android: 0.1.0-prototype.2, para Android 10 o posterior. Son versiones experimentales; el port Android todavía no tiene paridad funcional completa.**

No es una versión oficial de Showdown, Showdex ni Showdown+.

En Linux y Windows, el gestor instala módulos sobre la aplicación original. No sustituye su interfaz por otro cliente ni mantiene un segundo motor de combate. Guarda los respaldos fuera de la instalación y permite volver a los archivos originales.

## Descargas y requisitos

Elige el paquete de tu plataforma. Las versiones de escritorio y Android se publican por separado:

| Plataforma | Versión | Descarga | Requisitos |
| --- | --- | --- | --- |
| Android | **0.1.0-prototype.2 · APK de prueba** | [Descargar APK](https://github.com/kurialighieri-stack/pokemon-showdown-okayu-update/releases/download/android-v0.1.0-prototype.2/Pokemon-Showdown-Okayu-Android-0.1.0-prototype.2.apk) · [Release, fuentes y SHA-256](https://github.com/kurialighieri-stack/pokemon-showdown-okayu-update/releases/tag/android-v0.1.0-prototype.2) | Android 10+, Android System WebView actualizado y conexión. No necesita Python, una instalación de Pro ni importar un XPI por separado. |
| Linux x86_64 | alpha.4 | [Descargar ZIP Linux](https://github.com/kurialighieri-stack/pokemon-showdown-okayu-update/releases/download/v0.1.0-alpha.4/Pokemon-Showdown-Okayu-Update-v0.1.0-alpha.4-linux.zip) | Python 3.10+, Zenity y Pro 1.2.0 original en AppImage o extraído. |
| Windows x64 | alpha.4 | [Descargar ZIP Windows](https://github.com/kurialighieri-stack/pokemon-showdown-okayu-update/releases/download/v0.1.0-alpha.4/Pokemon-Showdown-Okayu-Update-v0.1.0-alpha.4-windows.zip) | [Python 3.10+ con el lanzador `py`](https://www.python.org/downloads/windows/) y ZIP oficial de Pro 1.2.0 Windows x64. |

**Solo escritorio requiere Python para ejecutar el gestor e importar Showdown+.** Los ZIP de Linux y Windows no incluyen Python ni el XPI oficial; este se verifica al importarlo. La extensión instalada directamente en Firefox no depende de Python. El gestor utiliza el Node incluido en Pro para recompilar Calcdex; la primera compilación necesita conexión.

Android incluye los componentes empaquetados en su APK. La release adjunta las fuentes y `SHA256SUMS.txt`; los paquetes de escritorio tienen sus propios archivos de comprobación. Consulta [todas las releases](https://github.com/kurialighieri-stack/pokemon-showdown-okayu-update/releases).

## Inicio rápido (Android)

1. Descarga el **APK de prueba** desde la release de Android enlazada arriba; no descargues el ZIP de Linux o Windows para el teléfono.
2. Abre el archivo en Android y permite la instalación desde la aplicación que lo abre si el sistema lo solicita. Confirma la instalación con el instalador de Android.
3. Abre **Okayu Update · Prototype**. El combate se utiliza en horizontal; no necesitas instalar Showdown Pro ni Showdown+ por separado.
4. Abre **Opciones** para elegir idioma, sonido y tema. **Créditos y licencias** contiene el aviso de fans y las atribuciones.

El APK está firmado con una **clave de depuración**, no con una firma definitiva de versión estable. No se promete una migración automática a una futura firma distinta. Antes de instalarlo, revisa [el alcance y los pendientes del prototipo](android/VALIDATION.md).

## Inicio rápido (Windows)

1. Instala [Python 3.10 o posterior para Windows](https://www.python.org/downloads/windows/) e incluye el lanzador `py`.
2. Descarga y extrae el **ZIP Windows de Okayu Update** en una carpeta de ruta corta, por ejemplo `C:\Okayu`.
3. Descarga [el ZIP oficial de Pro 1.2.0 Windows x64](https://github.com/Ryukotsuki/PokemonShowdownPro/releases/download/v1.2.0/PokemonShowdownPro-1.2.0-windows-x64.zip). Cierra Showdown Pro.
4. Abre **`Okayu-Update.cmd`** y acepta la solicitud de administrador de Windows (UAC). Si cancelas, el gestor no se inicia.
5. Selecciona **Instalar / cambiar módulos** y el ZIP original de Pro o su carpeta instalada. Al elegir el ZIP se prepara una copia permanente y se conserva el archivo original.
6. Elige los módulos. Para Showdown+, reutiliza el XPI detectado en Firefox o selecciona uno oficial de la versión 1.4. El proceso de importación requiere Python mediante el gestor.
7. Espera a que termine la instalación y abre **Pokemon Showdown: Okayu Update** desde Inicio o desde **Abrir aplicación** en el gestor.

Windows incluye rendimiento, avisos, Okayu, Showdown+ e idiomas de Calcdex; **Glass se ofrece solo en Linux**. Los respaldos se guardan en `%LOCALAPPDATA%\pokemon-showdown-okayu-update`. Consulta [la guía completa de Windows](docs/WINDOWS.md).

## Android: funciones y alcance del prototipo

El port utiliza Kotlin, AndroidX WebKit y un único WebView. Reutiliza el cliente y sus cálculos; adapta su distribución para uso táctil. La interfaz de escritorio conserva sus módulos y distribución originales.

- **Combate horizontal a pantalla completa:** menús contextuales en píldoras para luchar, cambiar Pokémon, elegir objetivos en dobles, consultar Calcdex y chat, o abrir la confirmación original de rendición.
- **Tableta:** controles y tipografía ampliados, tarjetas de vida completas en dobles, menús inferiores y distribución sin el segundo panel de escritorio. Los tamaños de combate del teléfono se conservan.
- **Tablas de Calcdex:** movimientos y estadísticas apilados y con columnas adaptadas tanto en teléfono como en tableta.
- **Calcdex y Opciones:** tarjetas claras, fondo de acento en Calcdex, colores del tema, controles adaptados y cierres revisados.
- **Narración:** franja inferior de ancho completo con escritura progresiva y ocultación temporal del HUD. Los controles de replay/espectador permanecen accesibles durante los textos.
- **Temporizador y ataques:** reloj con tiempo restante y activación/desactivación al tocar; eficacia localizada mediante el cálculo original, diferenciada por rival cuando corresponde en dobles.
- **Temas:** Okayu, Raora, Ceci, Gura, Bae y Amelia, además de las opciones claro, oscuro y sistema.
- **Showdown+ y fondos:** recursos importados al empaquetar; rotación entre `battle-stadium.png`, `final-stadium.png` y `new-save.png` por combate nuevo, con asignación guardada para sus repeticiones.

**No incluye Glass ni streamer. No es todavía una versión con paridad completa con Showdown Pro.** Siguen pendientes la matriz funcional completa, pruebas de cuenta/matchmaking real, reconexión y terminación de proceso, flujos completos de complementos, actualizador propio y pruebas térmicas prolongadas. Las funciones web heredadas no se consideran verificadas solo por estar presentes.

Consulta [compilación y procedencia](android/README.md), [validaciones y pendientes](android/VALIDATION.md) y el [plan de interfaz](android/spec/UI-plan.md). Los recursos generados y las claves privadas no se guardan en Git. El APK de prueba incluye el [aviso de fans y créditos](android/FAN_PROJECT_NOTICE.md). Para feedback, utiliza **Issues → Android prototype issue** e indica versión, modelo, Android/WebView, tema y pasos, ocultando datos personales.

## Módulos del gestor (Linux y Windows)

| Módulo | Función |
| --- | --- |
| Mejoras de optimización | Optimiza cine y streamer: observador y paneles plegados, captura recortada del Hub, control del trabajo pendiente y Hub visible en teatro. |
| Botón de avisos | Permite ocultar/restaurar el recuadro narrativo y los avisos de habilidades, conservando el log. |
| Tema Okayu | Tema predeterminado al instalar su addon: paleta violeta y rosa que hereda Pro, con el logo Okayu en la ventana, el cliente, Battle Hub y el acceso propio del menú. |
| Showdown+ | Adaptación de Showdown+ 1.4 a Electron. Detecta el XPI instalado en Firefox o importa el oficial de Mozilla/GitHub. |
| Idiomas de Calcdex | Sigue el idioma de Showdown, usa sus nombres/descripciones y añade controles en español, con respaldo a inglés. |
| Glass para Linux (experimental) | Transparencia de superficies y blur interno con controles en Add-ons; lectura de preferencias COSMIC y solicitud de blur nativo en KWin/X11 si se anuncia compatible. |

Al instalar el addon Okayu, su primer arranque lo selecciona como tema predeterminado. Las elecciones posteriores de tema se conservan.

La conexión común de módulos se instala automáticamente. Showdown+ usa el cliente nuevo. Calcdex sigue usando los IDs y datos originales para los cálculos.

## Inicio rápido (Linux)

Requisitos: Linux, Python 3.10 o posterior y el **AppImage original o una distribución extraída** de Pokémon Showdown Pro 1.2.0. Para los diálogos gráficos instala Zenity mediante tu distribución. La primera compilación de Calcdex necesita conexión para obtener sus dependencias. Se utiliza el runtime Node que incluye Pro.

1. Instala Python 3.10 o posterior y Zenity mediante el gestor de paquetes de tu distribución. Descarga el **ZIP Linux de Okayu Update** desde Releases y descomprímelo en una carpeta propia.
2. Cierra la instalación de Showdown que vas a modificar.
3. Ejecuta `sh Okayu-Update.sh`.
4. Selecciona **Instalar / cambiar módulos**. El gestor detecta Showdown Pro mediante sus accesos del menú, procesos principales y ubicaciones habituales. Si encuentra una única opción, no pide buscar carpetas.
5. Si usas AppImage, confirma **Preparar**. El gestor crea automáticamente una instalación fija y conserva el archivo original. Si no detecta ninguna aplicación, puedes elegir directamente el AppImage que descargaste.
6. Elige los módulos. Showdown+ se selecciona por separado: puedes reutilizar un XPI detectado en Firefox, seleccionar un archivo o abrir los enlaces de descarga oficiales.
7. Espera a que termine la compilación e instalación; se muestra una ventana de progreso. Abre **Pokemon Showdown: Okayu Update** desde el menú de aplicaciones.

La distribución `.tar.gz` extraída de Pro se modifica directamente. Si tienes un AppImage, **Instalar / cambiar módulos** prepara automáticamente una distribución en `$XDG_DATA_HOME/pokemon-showdown-okayu-update/managed/` (por defecto, `~/.local/share/pokemon-showdown-okayu-update/managed/`). No necesitas saber dónde están los archivos internos. Se conserva el AppImage intacto. Esta alfa **no vuelve a empaquetar ni modifica el AppImage comprimido**. Después de instalar, el acceso **Pokemon Showdown: Okayu Update** abre la distribución modificada. El acceso anterior del AppImage sigue abriendo el original. También puedes elegir **Abrir aplicación** en el gestor.

No selecciones nuestra antigua copia experimental ni una instalación modificada manualmente: las huellas deben coincidir con la base original. El gestor conserva el perfil normal de la aplicación. Los módulos no copian perfiles, equipos, cookies ni credenciales.

El módulo Okayu también instala el logo proporcionado por el mantenedor en el icono nativo de la ventana, Battle Hub, la cabecera de Showdown y el acceso propio del menú. Los logos forman parte de la instalación del módulo, aunque cambies temporalmente de paleta; se restauran al revertir o retirar ese módulo. El acceso y el icono globales de la aplicación original se conservan. El AppImage original comprimido no cambia. Desde alpha.3 el icono nativo es cuadrado (512 × 512), con el dibujo centrado y escala proporcional; el acceso usa un nombre de recurso nuevo para evitar la caché del antiguo icono rectangular.

El tema Okayu aparece en las opciones de tema de Showdown después de reiniciar. Junto a los controles de combate, Unown normal indica textos visibles y Unown shiny indica textos ocultos; púlsalo para alternar. Con Showdown+ activo aparece al lado Solrock (barras y banners claros) o Lunatone (oscuros). Este selector no cambia el tema general; ambas elecciones se guardan entre sesiones. Las barras muestran todos los Pokémon conocidos del equipo y reparten su espacio para que los seis quepan. Los idiomas de Calcdex siguen las preferencias de Showdown.

La búsqueda evita listar procesos de Electron o recorrer todo el disco. Ignora los montajes temporales `/tmp/.mount_…` y la antigua copia experimental. Recuerda la instalación preparada para las próximas veces. Los detalles extensos de extracción y dependencias se guardan en registros locales en lugar de imprimirse en la terminal.

## Línea de comandos

Desde cualquier carpeta, usando la ruta al script:

```sh
sh ./Okayu-Update.sh discover
sh ./Okayu-Update.sh prepare /ruta/a/PokemonShowdownPro.AppImage
```

La interfaz gráfica realiza estos pasos sin comandos adicionales. Para operaciones avanzadas sobre una distribución ya preparada:

```sh
sh ./Okayu-Update.sh status /ruta/a/ShowdownPro
sh ./Okayu-Update.sh plan /ruta/a/ShowdownPro
sh ./Okayu-Update.sh apply /ruta/a/ShowdownPro
sh ./Okayu-Update.sh revert /ruta/a/ShowdownPro
```

Para incluir Showdown+:

```sh
sh ./Okayu-Update.sh apply /ruta/a/ShowdownPro \
  --modules performance,battle-messages,theme-okayu,showdown-plus,calcdex-languages \
  --xpi /ruta/a/pokemon_showdown_plus-1.4.xpi
```

### Showdown+: detección y descarga

El gestor busca Showdown+ **sin cambiar Firefox ni sus perfiles**. Incluye Firefox nativo (`~/.mozilla/firefox`, `~/.config/mozilla/firefox` y `$XDG_CONFIG_HOME/mozilla/firefox`), Flatpak (`~/.var/app/org.mozilla.firefox/`) y Snap (`~/snap/firefox/common/` y `current/`). Lee los registros `profiles.ini`/`installs.ini`, perfiles en rutas personalizadas y la entrada de esta extensión en `extensions.json`. Un complemento desactivado también puede reutilizarse. No enumera el resto de extensiones ni copia el perfil.

En Windows también detecta los perfiles de Firefox en `%APPDATA%\Mozilla\Firefox`. **La importación de Showdown+ requiere Python 3.10 o posterior para ejecutar Okayu Update**; no se descarga ni instala Python automáticamente.

La interfaz muestra los XPI compatibles encontrados y permite **Seleccionar XPI manualmente**. Si todavía no lo tienes:

1. Abre [los Releases oficiales de Showdown+ v1.4 en GitHub](https://github.com/JxstMichie/PokemonShowdownPlus/releases/tag/v1.4).
2. En **Assets**, descarga **pokemon-showdown-hd.xpi** (no «Source code»). También puedes descargar la versión 1.4 desde [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/pokemon-showdown-plus/).
3. Selecciona el archivo `.xpi` en el gestor. No es necesario instalarlo previamente en Firefox.

Solo se admiten estos dos paquetes exactos:

| Origen · v1.4 | SHA-256 |
| --- | --- |
| Mozilla | `d128d2e8703bbe8d6a38141ee8591a37acd26c99003d788f1ccfc019b876030c` |
| GitHub · pokemon-showdown-hd.xpi | `825eeb9bca4e618f620f4177bfdfbb6d77607c461258c8f7e2623564cf9a5fe3` |

Además de la huella, se comprueban el ID `PokemonShowdownHD@NathanMichael`, la versión 1.4, Manifest V2 y los archivos necesarios para el adaptador. Las anclas del adaptador tienen sus propias huellas. Un paquete distinto se rechaza antes de escribir la aplicación, aunque use el mismo nombre. Esto fija compatibilidad con los archivos probados; no certifica cualquier versión futura ni sustituye la firma de Firefox.

La importación verifica y extrae una **copia temporal privada**; el XPI de origen mantiene sus bytes y permisos. No hace falta cerrar Firefox. La aplicación Showdown que se modifica sí debe estar cerrada. Se registra origen/versión/huella del paquete, sin la ruta del perfil.

Para buscar desde terminal o usar la detección al instalar:

```sh
sh ./Okayu-Update.sh xpi-discover
sh ./Okayu-Update.sh apply /ruta/a/ShowdownPro \
  --modules performance,showdown-plus --xpi auto
```

Al omitir `--xpi` también se detecta automáticamente; si hay varios compatibles, la CLI usa el primero (la interfaz permite elegir). `xpi-discover` muestra rutas locales de candidatos compatibles: no publiques su salida sin revisarla.

### Mejoras de optimización

El módulo conserva el ID `performance`, por lo que los comandos existentes siguen funcionando. Sustituye la implementación de cine y streamer de forma reversible. El Hub se captura solo en su rectángulo visible (360 px o 48 px si está plegado), incluso cuando teatro da al cliente todo el ancho. El emisor deja de procesar cuadros adicionales mientras espera que el visor confirme el anterior; mantiene como máximo una captura anticipada.

Se conservan las máscaras de privacidad, la validación de geometría antes/después de capturar, el rechazo de cuadros ante cambios y la limpieza al cambiar opciones. No cambia las opciones de qué información mostrar. El rendimiento depende de resolución, GPU y complementos; consulta las mediciones y límites en [validación](docs/VALIDATION.md).


`plan` comprueba los cambios previstos sin modificar la instalación. `apply` sin `--modules` instala rendimiento, avisos, Okayu e idiomas. Puedes cambiar la selección ejecutando de nuevo `apply`; primero se reconstruye virtualmente la base respaldada, para no acumular parches.

## Glass para Linux: alcance experimental

Instala el módulo opcional **Glass para Linux** (ID `glass`) y abre su tarjeta en **Battle Hub → Add-ons**. Está desactivado inicialmente. Solo afecta a los temas **Pro y Okayu**. Al activar o desactivar Glass, reabre la app cuando lo indique la tarjeta: esto permite que Glass apagado use la ventana opaca original. Ajustar transparencia o blur no requiere reiniciar.

- **Transparencia:** ajusta el fondo de las superficies entre 0 y 95 %, con una base común para Hub, cliente, Showdex/Calcdex, controles, menús y ventanas de ajustes. Texto, iconos y campo de combate conservan su opacidad; las tarjetas anidadas no acumulan fondos sólidos.
- **Blur de menús:** de 0 a 24 px. Los menús y tooltips usan el tinte del tema y desenfocan el contenido de la app que tienen detrás, **no las ventanas ni el fondo de escritorio que estén detrás**. Puede aumentar el coste de GPU.
- **Usar configuración del sistema:** disponible cuando se pueden leer los ajustes de vidrio de COSMIC. Sigue el tema claro/oscuro, el permiso de vidrio en ventanas y el alfa de superficie `medium`; muestra el grosor de frost del sistema. No escribe en la configuración de COSMIC. Cuando se hereda, se deja el blur externo a cargo del sistema y se desactiva el blur interno añadido.

La tarjeta distingue el efecto interno de la capacidad nativa:

| Escritorio / sesión | Transparencia de la app | Blur real del escritorio |
| --- | --- | --- |
| COSMIC / Wayland | Solicitada a Electron; lectura de preferencias COSMIC | **Pendiente de un backend nativo**: Electron no expone `ext-background-effect-v1`. Leer las preferencias no activa ese protocolo. |
| KDE / X11 o XWayland explícito | Solicitada a Electron | Se solicita solo si el compositor anuncia `_KDE_NET_WM_BLUR_BEHIND_REGION` y existe `xprop`. La intensidad la determina KWin. |
| KDE / Wayland nativo | Solicitada a Electron | Requiere soporte/reglas del compositor fuera de esta alfa. |
| Ubuntu / GNOME y otros Linux | Solicitada a Electron; controles manuales | Sin garantía: depende del compositor y, en GNOME, de extensiones/reglas que este gestor no instala. |

**No es todavía soporte completo del Frosted Glass nativo de COSMIC.** La base portable, los controles y la herencia de preferencias están separados del backend para poder añadirlo sin duplicar el cliente. No se incluye un control engañoso de intensidad nativa ni se cambian globalmente otros programas. Las API de material/vibrancy de Electron son de Windows/macOS; el protocolo Wayland permite solicitar una región de blur, con algoritmo e intensidad sujetos al compositor. Fuentes: [Electron: ventanas transparentes](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles), [API de materiales](https://www.electronjs.org/docs/latest/api/base-window#winsetbackgroundmaterialmaterial-windows), [protocolo Wayland oficial](https://gitlab.freedesktop.org/wayland/wayland-protocols/-/blob/main/staging/ext-background-effect/ext-background-effect-v1.xml).

Las preferencias se guardan en `okayu-glass.json` dentro del perfil de la aplicación y sobreviven a las actualizaciones. La ventana solicita un canal alfa desde su creación al instalar este módulo; requiere reiniciar la app tras instalarlo o retirarlo. Algunos controladores o compositores pueden limitar la transparencia al maximizar/redimensionar. El módulo no captura el escritorio ni modifica la ventana de emisión de streamer. La adaptación usa una hoja CSS fija, sin recorrer elementos ni observar las animaciones. Desactívalo desde la tarjeta para volver a superficies opacas o retíralo desde el gestor para recuperar también la creación de ventana original.

## Respaldos, reversión y actualizaciones

Los registros y respaldos se guardan en `$XDG_DATA_HOME/pokemon-showdown-okayu-update`, o en `~/.local/share/pokemon-showdown-okayu-update`. No borres esa carpeta si necesitas revertir. Se puede seleccionar otra con `--data`.

Cada modificación comprueba las huellas originales y guarda los bytes anteriores. La reversión se detiene si un archivo cambió externamente. Un fallo de escritura intenta deshacer la transacción; una interrupción del proceso deja un registro recuperable:

```sh
sh ./Okayu-Update.sh recover /ruta/a/ShowdownPro
```

Después de una actualización, vuelve a ejecutar el gestor. **Esta alfa no promete compatibilidad automática con versiones futuras**: rechazará una versión o unos archivos desconocidos sin aplicar parches. Los adaptadores y módulos permanecen separados de la aplicación, para publicar una revisión compatible sin rehacer el paquete completo.

Nunca se restaura una versión antigua encima de una nueva. Una reinstalación limpia de una versión ya compatible puede modificarse de nuevo. Si hay una actualización parcial o ediciones ajenas, el gestor se detiene para conservarlas.

Okayu y el módulo de idiomas recompilan el Showdex 1.4.2 que incluye Pro 1.2.0 y lo sirven desde `build/okayu-update-showdex`. Mientras estén instalados, esa compilación tiene prioridad sobre las generaciones del actualizador nativo de Showdex. Para adoptar una versión nueva de Showdex hace falta validar y actualizar el adaptador; revertir devuelve la selección de recursos original.

## Reportar un problema tras una actualización

Usa **Issues → Incompatibilidad tras actualizar** e indica qué módulos seleccionaste y qué observaste. Puedes generar un diagnóstico:

```sh
sh ./Okayu-Update.sh diagnose /ruta/a/ShowdownPro > okayu-diagnostic.json
```

El diagnóstico contiene versiones, estado, nombres de archivos del programa y huellas. No incluye rutas absolutas, datos del perfil ni contenido de conversaciones. Revisa cualquier captura o registro de compilación antes de publicarlo; esos archivos pueden contener rutas locales.

## Documentación técnica

- [Arquitectura y transacciones](docs/ARCHITECTURE.md).
- [Pruebas y alcance de escritorio](docs/VALIDATION.md).
- [Guía Android y compilación](android/README.md).
- [Pruebas y pendientes de Android](android/VALIDATION.md).
- [Notas de la pre-release Android](docs/releases/android-v0.1.0-prototype.2.md).
- [Desarrollo con IA](AI_DISCLOSURE.md).
- [Guía de contribución](CONTRIBUTING.md).

## Desarrollo y alcance

```sh
python3 -m unittest discover -s tests -v
```

Los módulos declaran sus archivos, huellas y cambios exactos en `modules/*/addon.json`. `compatibility/1.2.0.json` identifica los originales admitidos. El gestor no ejecuta instaladores arbitrarios descargados por módulos: aplica los paquetes locales de este repositorio y, cuando procede, ejecuta el compilador de Showdex con dependencias fijadas y scripts de instalación desactivados.

Para desarrollo se puede reutilizar un checkout de Showdex 1.4.2 con sus dependencias mediante `--showdex-source /ruta/al/checkout`. Ese parámetro es una fuente de código confiada por el desarrollador, no un mecanismo de descarga verificada.

macOS, actualizaciones automáticas del gestor y reconstrucción de AppImage quedan fuera de esta alfa.

## Licencias y autoría

El código propio del gestor y las adaptaciones derivadas de Pro se distribuyen bajo **GNU Affero General Public License, versión 3 o cualquier versión posterior** (`AGPL-3.0-or-later`), una licencia de **copyleft fuerte**. El texto íntegro está en [LICENSE](LICENSE) y el identificador está declarado en [pyproject.toml](pyproject.toml).

Al redistribuir el código cubierto o sus versiones modificadas deben conservarse los avisos y proporcionarse el código fuente correspondiente bajo los términos de la AGPL. Su sección 13 también exige ofrecer el código fuente correspondiente a quienes interactúen remotamente por red con una versión modificada, cuando se dé ese supuesto. El texto de la licencia determina las obligaciones aplicables; no se imponen restricciones adicionales.

Se conserva la licencia de Pro y las atribuciones de sus autores. Consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) para los componentes y recursos externos. Los recursos de Showdown+ no se guardan en Git ni cambian de licencia: el gestor de escritorio los importa desde el paquete oficial y el APK Android de prueba los incorpora al empaquetar, con sus avisos y atribuciones. La AGPL del gestor no relicencia Showdown+, los sprites de Pokémon ni otros recursos de terceros. Los paquetes Linux y Windows de Releases incluyen `LICENSE` y los avisos de terceros.

## Proyecto de fans y créditos

Proyecto independiente, **no oficial y sin ánimo de lucro**, sin afiliación, patrocinio ni respaldo de los titulares. Los créditos de fondos y escenarios de Pokémon corresponden a **GAME FREAK y The Pokémon Company**, y a Nintendo y Creatures en los derechos que les correspondan. Todos los derechos sobre sus materiales permanecen en sus respectivos titulares. Se conservan también los créditos de Showdown+, sus renders y los demás componentes.

La atribución y el carácter no lucrativo no se presentan como autorización de los titulares. La licencia del código propio no concede derechos sobre gráficos, audio ni marcas ajenas. Consulta [el aviso incluido en Android](android/FAN_PROJECT_NOTICE.md) y [las atribuciones completas](THIRD_PARTY_NOTICES.md).

## Portabilidad

Consulta [la guía de Windows x64](docs/WINDOWS.md). El adaptador Windows excluye Glass y utiliza huellas propias de la distribución ZIP oficial. El selector Solrock/Lunatone pertenece al módulo Showdown+ y no requiere instalar el botón Unown.
