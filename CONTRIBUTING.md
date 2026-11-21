# Contribuir

Abre una incidencia antes de ampliar el soporte de versiones. Incluye versión de Pro, módulos activos y diagnóstico del gestor. No adjuntes el perfil del navegador, equipos privados ni paquetes de terceros.

Para un adaptador nuevo:

1. Parte de una distribución original y conserva sus huellas.
2. Identifica los cambios mínimos y sus dependencias. Evita acumular dos implementaciones del mismo sistema.
3. Actualiza las anclas y `compatibility/` para la versión concreta; no relajes la comprobación global para aceptar archivos desconocidos.
4. Prueba instalación, cambio de selección, reinstalación, fallo de escritura, recuperación y reversión byte por byte.
5. Ejecuta pruebas visuales en el cliente, Hub, Calcdex, combate y repeticiones. Para rendimiento, compara mediciones reproducibles; una captura estática no verifica FPS.
6. Comprueba que una actualización desconocida se rechaza y que no se restauran archivos antiguos encima de ella.

Pruebas del gestor: `python3 -m unittest discover -s tests -v`.

Las revisiones de Showdown+ deben conservar sus condiciones y separar el adaptador de sus recursos. No envíes paquetes XPI, renders o perfiles al repositorio.

La integración continua prueba el motor transaccional. No sustituye las pruebas de Electron, los servicios de Showdown ni las pruebas visuales de cada adaptador.
