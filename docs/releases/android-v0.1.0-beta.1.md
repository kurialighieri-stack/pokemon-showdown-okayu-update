# Android 0.1.0-beta.1 — Tableta y Calcdex

Beta pública para Android 10 o posterior. Actualiza prototype.1 con la misma firma de depuración, conservando los datos privados de la app. No es una versión estable ni completa; Glass y streamer siguen excluidos.

## Cambios

- Corrige el recorte del combate y el segundo panel de escritorio al utilizar una tableta.
- Amplía controles, iconos, textos y tarjetas de vida en tableta; mantiene el tamaño de los sprites. Barras completas y separadas en dobles.
- Volver queda debajo de los ataques, en una franja propia. Los menús principal y de combate terminado se alinean con las tarjetas aliadas cuando cabe la columna lateral; en tabletas más estrechas se conserva separación mediante desplazamiento.
- Calcdex apila movimientos y estadísticas y ajusta sus columnas tanto en teléfono como en tableta. Corrige textos montados y proporciona una salida Android cuando falta la X nativa.
- Inicio en teléfono con pestañas horizontales y contenido a ancho completo, como en tableta, sin modificar la preferencia de distribución del usuario.
- Mantiene los tamaños del combate en teléfono y los controles de reproducción accesibles durante los mensajes.

## Validación y límites

Probado en Samsung SM-X400 (1408 × 880 dp). Viewports emulados sobre ese mismo dispositivo: 1000 × 600, 1024 × 768, 1280 × 800 y móviles 640 × 360, 800 × 360, 960 × 540. Estas emulaciones no equivalen a otros teléfonos físicos.

Fixtures de ataques, equipo, objetivos de dobles, opciones, cierres, final de combate, replay, tarjetas/SVG y tablas de Calcdex; compilación, lint y comprobaciones de integridad. Detalles y límites: [validación Android](../../android/VALIDATION.md).

Siguen pendientes la matriz funcional completa del port, reconexión y terminación de proceso exhaustivas y pruebas térmicas prolongadas. Se adjuntan APK, fuentes y SHA-256. La clave privada no se incluye.

## Créditos y aviso de fans

Proyecto de fans independiente, sin ánimo de lucro, **no oficial** y sin afiliación, patrocinio ni respaldo de los titulares.

Pokémon, escenarios, fondos, gráficos, música y marcas pertenecen a sus respectivos titulares. Los créditos de los fondos y escenarios corresponden a **GAME FREAK y The Pokémon Company**, y a Nintendo y Creatures en los derechos que les correspondan. Todos los derechos sobre esos materiales permanecen en sus respectivos titulares.

Showdown+: **JxstMichie / Nathan Michael (Nuri)**, incluidas sus adaptaciones y renders personalizados. Pokémon Showdown: Smogon y colaboradores. Showdown Pro: Ryukotsuki y colaboradores. Showdex: Keith Choison, analogcam y colaboradores.

La licencia del código propio no concede derechos sobre recursos ajenos. Los créditos, la ausencia de lucro y el carácter de captura de pantalla no se presentan como autorización ni sustituyen permisos de los titulares. Véanse [el aviso incluido en el APK](../../android/FAN_PROJECT_NOTICE.md) y [las licencias y atribuciones](../../THIRD_PARTY_NOTICES.md).

Desarrollado con asistencia extensa de IA (OpenAI Codex), bajo la dirección del mantenedor: [declaración](../../AI_DISCLOSURE.md).

Para reportar un fallo, utiliza la plantilla **Android beta issue**, con el commit o versión, modelo, Android/WebView, tema y pasos; elimina datos personales de capturas y registros.
