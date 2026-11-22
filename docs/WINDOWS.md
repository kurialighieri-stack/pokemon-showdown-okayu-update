# Viabilidad de Windows (sin implementar todavía)

Los módulos de optimización, controles de combate, tema Okayu, Showdown+ e idiomas de Calcdex utilizan principalmente JavaScript/CSS del cliente Electron. Su reutilización es viable, pero no constituye compatibilidad probada con la distribución Windows. Glass se excluye deliberadamente del alcance Windows.

El gestor actual importa fcntl en manager.py y discovery.py, comprueba procesos en /proc, usa Zenity, prepara AppImage y crea accesos .desktop. Se necesitan bloqueo y detección de procesos Windows, selección de instalación y diálogos compatibles, launcher y accesos .lnk, rutas de perfiles Firefox Windows, icono .ico y adaptación del runtime Node/compilación de Showdex. Debe inspeccionarse la distribución oficial Windows (archivos extraídos o app.asar según su empaquetado real), crear huellas de compatibilidad específicas y probar instalación, actualización y reversión. Nunca se deben reutilizar a ciegas las huellas Linux.

Plan propuesto: conseguir distribución Windows original de la misma versión, separar las operaciones del sistema del motor de composición, portar el instalador y ejecutar una matriz de módulos sin Glass en Windows real. No hay una compilación Windows ofrecida ni pruebas de rendimiento Windows en esta publicación.
