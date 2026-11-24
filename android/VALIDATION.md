# Validación Android — 23 de noviembre de 2026

Estado: prototipo funcional; paridad completa pendiente. Publicación de código y APK de prueba con firma de depuración.

## Verificado

- `assembleDebug` y `lintDebug`: compilación correcta; firma de depuración comprobada con apksigner.
- 50 pruebas Python del gestor Linux, 3 pruebas Python de recursos Android y 4 casos Node de geometría correctos.
- Emulador API 37 y teléfono autorizado modelo 2311DRK48G, API 36. Una WebView persistente; no se instaló ni modificó la aplicación Linux durante estas pruebas.
- Conexión oficial como invitado y petición nativa `upkeep` al servidor de login. No se introdujeron contraseñas ni se iniciaron partidas.
- Combates simulados de dobles y solicitudes originales de movimientos. Antes del fixture se sustituye el envío al servidor por una función vacía. En el teléfono los cuatro movimientos quedaron en columna y conservaron objetivos táctiles de al menos 48 dp.
- La geometría de columna fija de la primera prueba fue sustituida por el rediseño del 24 de noviembre: escenario a pantalla completa, sprites contenidos con escala uniforme y menú contextual flotante. Viewport físico útil de aproximadamente 862 × 406 dp.
- Los cinco iconos dan RGB 255/255/255, fondo alfa 0, borde 0 y sombra negra. Sus botones mantienen áreas táctiles de 48 dp. Separación menú/banners rivales: 8 dp.
- Seis casillas por equipo en filas horizontales. Herramientas y turno en zonas separadas. El fixture de colisiones comprueba sus rectángulos.
- Log, salas y Calcdex abren y cierran sin cambiar la instancia de Battle. Calcdex se muestra como panel amplio y se oculta sin dejar una capa interceptando el combate. Showdex inicializó y Showdown+ completó su cargador hasta debug.js, con barras y sprites HD visibles.
- Pulsación larga sobre un movimiento: tooltip bloqueado/visible y decisiones vacías antes/después. Se reutiliza el comportamiento táctil original del cliente.
- Pro/Okayu/claro/oscuro cambian sus clases y conservan la elección original al terminar el test.
- El puente nativo rechazó un método desconocido. Un iframe del mismo origen tuvo el objeto de mensajería pero no pudo modificar preferencias: el filtro de frame principal lo impidió.
- Muestra inicial de 300 frames con sprites animados en primer plano: mediana 8.3 ms, p95 8.4 ms y máximo 16.7 ms en el teléfono. No es un benchmark de turnos, autonomía o temperatura sostenida.

## Todavía no aceptado como versión completa

- Cuenta real, matchmaking y desafíos, reconexión y muerte de proceso.
- Todos los formatos/fases: triples, objetivos de dobles, cambios forzados, Tera y decisiones comparadas exhaustivamente con la referencia.
- Flujos completos de los cuatro módulos Showdex y los seis addons originales Pro.
- Hub completo, estadísticas/historial/mensajes, búsqueda y guardado integrado de replays.
- Actualizador propio, importación/exportación mediante el selector de documentos y pruebas de teclado/accesibilidad exhaustivas.
- Matriz nativa de todos los tamaños de pantalla y pruebas térmicas prolongadas. Se verificaron cuatro tamaños con la función geométrica pura; no se presentan como cuatro dispositivos físicos.
- Derechos sobre recursos gráficos: el APK de prueba incluye avisos de fans y créditos; no se afirma haber obtenido autorización adicional ni que la atribución sustituya permisos de los titulares.

Los fixtures y sus resultados no contienen cuentas reales. Las capturas del teléfono se conservaron como evidencia local, fuera del repositorio.

## Revisión visual Android del 24 de noviembre

- Se reemplazó la apariencia de escritorio de los controles por un estilo Android aislado (`combat-skin.css`): cápsulas blancas/negras y movimientos por tipo, PP en segmento negro diagonal, sin degradados Pro ni contenedor sólido detrás.
- Se corrigió la reutilización de nodos por Preact: al salir del selector de equipo se eliminan exclusivamente las marcas visuales de ese rol. No se alteran `data-cmd`, restricciones ni manejadores de decisiones.
- `native-context.js`: cinco acciones en orden, apertura sin enviar decisiones, seis tarjetas, objetivos de dobles y vuelta mediante cancelación original, confirmación original de abandono y cambio forzado sin salida inválida.
- `native-skin.js`: transición equipo → ataques sin etiquetas de salud o estado residuales; cuatro cápsulas de al menos 48 dp, sin solapamientos, colores distintos por tipo y PP dentro del contorno. Comprueba ausencia de degradados de escritorio y desplazamiento horizontal del control Tera.
- La matriz completa y las pruebas térmicas sostenidas continúan pendientes. Los fixtures usan una sala sintética y envío al servidor anulado; se reinicia la aplicación al finalizar para restaurar su funcionamiento normal.
- `native-team-confirm.js`: previsualización sin elegir; confirmación delegada a un único cambio original; ninguna decisión parcial de dobles enviada.
- En pantallas de poca altura, el listado de equipo puede desplazarse para conservar objetivos táctiles de 48 dp; los botones inferiores permanecen fuera del desplazamiento.

## Barras, temas y cierre de combate

- `native-themes.js`: cinco paletas distintas en el selector Android, clases base conservadas, banner diagonal por tema y seis casillas sobre cada cápsula horizontal. Pro se migra a Gawr Gura.
- `native-end-menu.js`: acciones originales de cierre/replay en cápsulas de 48 dp, sin degradados de escritorio. Se marca únicamente `battle.ended` en la sala sintética; no se envían victorias ni resultados al servidor.
- Inspección visual en teléfono: banner diagonal y tarjetas de equipo, barras horizontales y cinco acciones finales visibles. Android mantiene datos y preferencias; esa revisión se mantuvo local antes de preparar la publicación de prueba.

## Narración, perspectiva y controles compactos

- Controles del menú compactados al 85 % visual aproximado, conservando áreas táctiles de al menos 48 dp; el tamaño de toda la WebView permanece igual.
- Narración en barra inferior de ancho completo, con colores del tema. Mientras está visible se ocultan controles, barras de vida, turno e indicadores de equipo, conservando su geometría. Al terminar se restauran; no se insertan esperas en el motor de combate.
- Showdown+ usa anclas ligadas a las barras aliadas en dobles. Tras el ajuste inicial de proximidad, se aplica el aumento adicional solicitado del 30 % (factor de presentación total 1.456 sobre la referencia original). Singles y rivales conservan su escala. Se reutiliza la misma ruta de posición para animaciones, FX y tooltips.
- Los banners de habilidad traducen el nombre mediante `TL(Dex.abilities.get(...))` al mostrarse, con el nombre original como fallback. Se retira el posesivo inglés fijo del nombre del Pokémon. El teléfono verificó «Pressure» → «Presión».
- `native-presentation.js`: ancho y posición de la narración, ocultación/restauración del HUD, escala y anclas de dobles, invariancia de singles y habilidad localizada.

## Pulido de utilidades, replays y eficacia

- `native-ui-polish.js`: reloj con 1:33, órdenes start/stop capturadas sin red, temporizador nativo duplicado oculto, confirmación original de rendición centrada encima del menú, opciones claras con cápsulas y Bae, contraste de información de movimientos/Calcdex y cierre sin capa residual. Misma instancia de combate.
- `native-viewer.js`: siete controles originales de reproducción/espectador, sin solapamiento, disponibles durante la narración y fuera de la franja de texto. Avanzar no recrea el combate.
- `native-effectiveness.js`: el ataque de hielo usa el cálculo original para mostrar Dragonite 4× y Stantler 1× por separado, con descripción localizada, sin alterar elecciones.
- Las pruebas se ejecutan solo en salas sintéticas, capturando el envío antes de simular comandos. No prueban partidas reales, permisos de detener el temporizador de otra persona ni paridad completa del port.
- `native-close-controls.js`: cierre por botón de Opciones, log, salas, Hub, opciones nativas, confirmación de rendición y ficha de movimiento; X y Atrás de Calcdex, incluyendo reapertura y repetición. Diez cierres completados sin capa residual y sin recrear el combate.
- Calcdex cierra primero su interfaz nativa y después el panel Android. Log, salas y Hub tienen un botón visible de vuelta. El fondo de Calcdex usa el acento del tema; las tarjetas conservan superficie clara y texto oscuro.

## Rotación y créditos para prototype.1

- `backgrounds-test.cjs`: ciclo de tres fondos, persistencia entre instancias, almacenamiento malformado y fallback determinista cuando el almacenamiento falla.
- `native-backgrounds.js`: `battle-stadium.png` → `final-stadium.png` → `new-save.png` en tres combates nuevos; reaplicar la escena conserva la elección. Los tres PNG se decodificaron en WebView a 800 × 480.
- `native-credits.js`: aviso local con GAME FREAK, The Pokémon Company, proyecto no oficial sin ánimo de lucro y asistencia de IA; vuelta de Créditos a Opciones correcta.
- Compilación/lint correctos; 3 pruebas de integridad Android y 60 pruebas del gestor ejecutadas (10 casos dependientes de otro entorno omitidos en Linux). Los checks de fuente para GitHub no sustituyen la validación física ni la matriz pendiente.
