# Android 0.1.0-prototype.1 — APK de prueba

Port Android horizontal de Pokemon Showdown: Okayu Update, Android 10 o posterior. Se publica como **pre-release de prueba**, con firma de depuración; no es una versión estable ni tiene todavía paridad completa con Showdown Pro. No incluye Glass ni streamer.

## Cambios

- Combate con escenario a pantalla completa y controles contextuales en píldoras; acciones y objetivos originales del cliente.
- Calcdex y Opciones con tarjetas claras, acento del tema y contraste corregido. Revisión de diez recorridos de cierre y retorno.
- Replays/espectador con controles de reproducción accesibles durante la narración. Temporizador en cápsula con tiempo y start/stop original.
- Narración inferior, idioma de las habilidades y eficacia de ataques calculada por el cliente, diferenciando objetivos en dobles.
- Temas Okayu, Raora, Ceci, Gura, Bae y Amelia.
- Rotación de los tres fondos importados de Showdown+ por combate nuevo; asignación privada persistente para replays.

## Pruebas y límites

Compilación y lint Android; pruebas de integridad, geometría y rotación; fixtures de WebView y validación en teléfono. La matriz completa de funciones, reconexión, terminación de proceso, todos los formatos y pruebas térmicas prolongadas continúan pendientes: [validación](../../android/VALIDATION.md).

El APK usa una clave de depuración conservada fuera del repositorio. Una futura versión estable puede requerir otra vía de migración; no se publica una clave privada. Se adjuntan SHA-256 y fuentes; GitHub también conserva el código del tag. Los recursos y fuentes externos mantienen sus licencias y procedencia.

## Créditos y aviso de fans

Proyecto de fans independiente, sin ánimo de lucro, **no oficial** y sin afiliación, patrocinio ni respaldo de los titulares.

Pokémon, escenarios, fondos, gráficos, música y marcas pertenecen a sus respectivos titulares. Los créditos de los fondos y escenarios corresponden a **GAME FREAK y The Pokémon Company**, y a Nintendo y Creatures en los derechos que les correspondan. Todos los derechos sobre esos materiales permanecen en sus respectivos titulares.

Showdown+: **JxstMichie / Nathan Michael (Nuri)**, incluidas sus adaptaciones y renders personalizados. Pokémon Showdown: Smogon y colaboradores. Showdown Pro: Ryukotsuki y colaboradores. Showdex: Keith Choison, analogcam y colaboradores.

La licencia del código propio no concede derechos sobre recursos ajenos. Los créditos, la ausencia de lucro y el carácter de captura de pantalla no se presentan como autorización ni sustituyen permisos de los titulares. Véanse [el aviso incluido en el APK](../../android/FAN_PROJECT_NOTICE.md) y [las licencias y atribuciones](../../THIRD_PARTY_NOTICES.md).

Desarrollado con asistencia extensa de IA (OpenAI Codex), bajo la dirección del mantenedor: [declaración](../../AI_DISCLOSURE.md).

Para reportar un fallo, utiliza la plantilla **Android prototype issue**, con el commit o versión, modelo, Android/WebView, tema y pasos; elimina datos personales de capturas y registros.
