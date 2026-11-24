# Okayu Update Android — APK de prueba 0.1.0-prototype.2

Desarrollado con asistencia de IA; véase ../AI_DISCLOSURE.md. **No es todavía la versión completa del plan.** Glass y streamer se excluyen. Se publica el código y la documentación; el APK se publica como prueba con recursos y créditos de terceros.

## Funciona en esta etapa

- APK de depuración firmado, Android 10+, horizontal, una sola WebView con recursos locales HTTPS. Cliente fijado al commit `f7dac498bb00b920227a32502267d7de358ae965`, archivo fuente validado por SHA-256 antes de empaquetar.
- Conexión oficial como invitado, cliente y constructor de equipos originales; puente para las peticiones originales del servidor de login. El test de login solo comprobó `upkeep`, no utilizó contraseñas.
- Combate con escenario a pantalla completa y sprites escalados uniformemente. Menú flotante de cinco acciones: Luchar, Pokémon, Calcdex, Chat y Huir. Los ataques son cápsulas coloreadas por tipo con segmento negro para PP; el resto de acciones usa blanco/negro. No hay panel rectangular detrás ni columna permanente que reduzca el escenario. Se conservan los botones y comandos originales.
- Selector de equipo a pantalla completa con seis cápsulas, vista previa y confirmación explícita. Objetivos de dobles en dos filas de cápsulas: rivales arriba y aliados abajo, manteniendo restricciones originales. Opciones a pantalla completa con lista desplazable y botón inferior para volver.
- Iconos superiores blancos con sombra y sin fondo; indicadores de equipo horizontales. Narración en superficie fija con escritura progresiva, configurable y compatible con Unown y movimiento reducido. Información de ataques mediante pulsación larga y tarjeta amplia basada en el tooltip original.
- Showdex standalone, tema Okayu/Pro/claro/oscuro, controles Unown y Solrock/Lunatone, carga de Showdown+ y transporte de sus sprites HD. Se reutilizan los módulos presentes en la instalación Pro de entrada.
- Preferencias nativas privadas, compartir, apertura de enlaces HTTPS y código de selector de documentos/importación/exportación. Los flujos de documentos todavía requieren validación manual.
- Respeto de barras/cutouts/IME, cierre de utilidades con Atrás y recuperación básica de navegación. No se promete conexión permanente en segundo plano.

## Compilar

Requiere Node 24, Python 3.10+, JDK **17**, SDK Android plataforma 35 / build-tools 35.0.0. El wrapper fija Gradle 8.11.1 con SHA-256. Si abres el proyecto en Android Studio, selecciona JDK 17 para Gradle: el JBR 25 incluido en Studio no es el JDK del proyecto.

1. Obtén la distribución original Pro 1.2.0 y prepara la instalación local con los módulos Okayu/idiomas/Showdown+. Su XPI se importa mediante el gestor habitual. No se distribuyen estos recursos con el código Android.
2. Extrae `resources/app/build/upstream/pokemon-showdown-client-source.zip` en una carpeta de trabajo. Copia `android/client-package-lock.json` como `package-lock.json` allí y ejecuta `npm ci --ignore-scripts` y `node build`. No modifiques los fuentes del cliente.
3. Ejecuta `python3 android/tools/prepare-client.py --source /ruta/al/cliente --pro /ruta/Pro/resources/app`. Se comprueba el archivo fuente original, los fuentes TS y los hashes de datos fijados en `client-data.lock.json`. Los recursos generados quedan ignorados por Git. Un cambio de datos remoto detiene el empaquetado en lugar de aceptarlo silenciosamente.
4. Configura `android/local.properties` con `sdk.dir=/ruta/al/SDK` y `JAVA_HOME` apuntando a JDK 17. Ejecuta `cd android && ./gradlew :app:assembleDebug :app:lintDebug`.
5. Resultado: `android/app/build/outputs/apk/debug/app-debug.apk`. El build verifica todos los hashes del manifiesto de recursos. La firma de depuración se mantiene fuera del repositorio. Se distribuye como pre-release experimental firmada con la misma clave de depuración; no es la firma definitiva de una versión estable.

## Pruebas

- `node android/tools/layout-test.cjs`: siete tamaños geométricos.
- `python3 -m unittest discover -s android/tests -q`: integridad del paquete, exclusiones y datos fijados.
- `python3 -m unittest discover -s tests -q`: regresión del gestor Linux.
- `android/tests/native-*.js` y `native-touch.cjs`: fixtures CDP para WebView. Usan batallas simuladas y sustituyen el envío de comandos antes de montar la sala. No ejecutar estos fixtures en una sesión de juego real.
- `android/tools/cdp.cjs archivo.js`: ejecuta el fixture con un puerto CDP ya redirigido por adb (variable `CDP_PORT`, por defecto 9222). Depuración WebView habilitada solo en builds debuggable.

## Limitaciones y distribución

Los seis addons originales de Pro, el Hub completo (historial/estadísticas/mensajes), la integración de búsqueda/guardado de replays y el actualizador/instalador propio **aún no están portados**. El botón de actualizaciones abre GitHub Releases; no es un actualizador automático. Matchmaking real, autenticación con cuenta, muerte de proceso, reconexión, funcionamiento completo de los cuatro módulos Showdex, importación/exportación y pruebas térmicas prolongadas siguen pendientes. El cliente conserva esas funciones originales donde son web, pero no se consideran verificadas por ello.

Showdown+ incluye recursos cuyo aviso oficial separa el código de las ilustraciones/renders. El APK de prueba usa la copia importada localmente por el usuario. La pre-release incluye avisos de fans y atribuciones por decisión del mantenedor; no se afirma contar con autorización adicional ni que los créditos concedan derechos. Código y APK tienen alcances de licencia distintos. Véase https://github.com/JxstMichie/PokemonShowdownPlus/blob/main/LICENSE.

No anunciar paridad completa antes de completar `VALIDATION.md`.

## Temas y acabado del combate

Android ofrece Okayu, Gawr Gura (sustituye Pro y migra esa preferencia), Raora Panthera, Cecilia Immergreen y Amelia Watson, además de Claro/Oscuro/Sistema. Son paletas originales inspiradas en los personajes, sin incorporar ilustraciones ni implicar afiliación. Comparten la estructura Pro; el cambio de tema actualiza colores y el banner diagonal del selector de equipo sin recrear el combate. Las barras de seis Pokémon son cápsulas horizontales y respetan el control de HUD claro/oscuro. Los controles originales de final de batalla también usan píldoras.

Referencias visuales: [Gawr Gura](https://hololive.hololivepro.com/en/talents/gawr-gura/), [Raora Panthera](https://hololive.hololivepro.com/en/talents/raora-panthera/), [Cecilia Immergreen](https://hololive.hololivepro.com/en/talents/cecilia-immergreen/), [Watson Amelia](https://hololive.hololivepro.com/en/talents/watson-amelia/). Los colores son interpretaciones de diseño propias, no códigos oficiales.

### Revisión de pantallas y reproducción

El selector muestra Okayu, Raora, Ceci, Gura, Bae y Amelia. Bae corresponde a una paleta roja/carbón/blanco cálido inspirada en Hakos Baelz; se mantienen las claves persistentes `okayu`, `raora`, `cecilia`, `gura`, `baelz` y `amelia`.

Opciones utiliza el papel claro, acento diagonal y cápsulas del selector de equipo. Calcdex emplea el color de acento como fondo, con tarjetas claras y la misma identidad de controles. Los paneles de movimientos de Calcdex conservan los colores semánticos y usan texto oscuro. El botón de cierre elimina el estado del panel Android, sin reconstruir el calculador.

Replays y partidas espectadas mantienen un dock de controles original accesible durante la narración. Esta sigue ocultando el resto del HUD; no cubre el dock. El temporizador es una única cápsula con reloj y el tiempo original: tocarla envía `/timer start` o `/timer stop`, sin anticipar la respuesta del servidor; en modo espectador es informativa.

Los movimientos de daño muestran la eficacia calculada por `BattleTooltips.getMoveEffectiveness`, con el tipo efectivo producido por el cliente. En dobles, resultados diferentes se muestran por rival con sus multiplicadores y descripción accesible. Se conserva la información conocida, sin estimar habilidades u objetos ocultos, y no cambia la elección enviada. Los movimientos de estado no reciben una etiqueta de daño.

## Rotación de fondos

Cada combate moderno nuevo utiliza el siguiente fondo de la secuencia `battle-stadium.png` → `final-stadium.png` → `new-save.png`. La asignación por identificador se guarda únicamente en el almacenamiento privado del WebView, para conservarla al abrir su replay o reiniciar la aplicación. El cambio sucede al crear el combate, no durante un turno. Fondos especiales y generaciones antiguas conservan el comportamiento original. Si el almacenamiento está bloqueado o lleno, se utiliza una selección determinista por identificador.

Los tres recursos ya deben existir en el Showdown+ importado localmente: el empaquetado verifica sus hashes de `backgrounds.lock.json` y falla si faltan o difieren. No se descargan dinámicamente ni se añaden al repositorio. `node android/tools/backgrounds-test.cjs` prueba el ciclo, persistencia y fallos de almacenamiento; `native-backgrounds.js` verifica las tres imágenes en WebView.

La publicación de fuentes no implica que se haya completado la matriz funcional del port. Los APK locales son de depuración y prueba, no versiones estables firmadas con una clave definitiva. El workflow Android solo comprueba geometría, rotación y sintaxis, sin descargar componentes externos ni utilizar claves.

## Interfaz de tableta y tablas de Calcdex (prototype.2)

Las reglas de ampliación se activan desde 1000 CSS px. En tableta, controles de 72 dp y texto ampliado; tarjetas de nombre/vida completas y menú principal/final alineados con el HUD aliado cuando hay ancho suficiente. Volver permanece debajo de los ataques, en una franja reservada. El tamaño de los Pokémon no cambia. Las tabletas más estrechas desplazan las listas dentro de su columna para conservar separación.

Calcdex apila movimientos y estadísticas en teléfono y tableta, con columnas propias para cada tamaño y salida accesible. Este ajuste de tablas es el único cambio visual nuevo aplicado al teléfono.

Pruebas específicas: `native-tablet-ui.js`, `native-tablet-menus.js`, `native-calcdex-tables.js` y `native-phone-ui.js`. Para emular otro viewport en el dispositivo de pruebas: `CDP_PORT=9224 CDP_VIEWPORT=800x360 node android/tools/cdp.cjs android/tests/native-calcdex-tables.js`. No ejecutar fixtures con una batalla real activa; reiniciar al finalizar.
