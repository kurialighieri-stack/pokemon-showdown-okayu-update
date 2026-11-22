# Windows x64 — alfa sin Glass

El gestor admite el ZIP oficial de **Pokémon Showdown Pro 1.2.0 para Windows x64**. Incluye rendimiento/cine/streamer, botón Unown para avisos, tema Okayu, Showdown+ 1.4 (Solrock/Lunatone) e idiomas de Calcdex. Glass no aparece en el catálogo Windows y la CLI rechaza ese ID.

## Inicio rápido

1. Extrae `Okayu-Update-Windows.zip` en una carpeta propia de ruta corta, por ejemplo `C:\Okayu`, para evitar los límites del extractor de Windows.
2. Descarga [PokemonShowdownPro-1.2.0-windows-x64.zip](https://github.com/Ryukotsuki/PokemonShowdownPro/releases/download/v1.2.0/PokemonShowdownPro-1.2.0-windows-x64.zip).
3. Cierra Showdown Pro y abre `Okayu-Update.cmd`. Solicita permisos de administrador automáticamente mediante UAC; si cancelas la solicitud, el gestor no se inicia.
4. Elige **Instalar / cambiar módulos**. Si no hay una instalación detectada, selecciona el ZIP oficial. Se verifica su SHA-256 y se prepara una copia permanente; el ZIP original se conserva.
5. Marca los módulos. Para Showdown+ puedes reutilizar la extensión detectada en Firefox o elegir un XPI oficial 1.4.
6. Espera a que compile Calcdex y termine la instalación. Abre **Pokemon Showdown: Okayu Update** desde Inicio o desde el gestor.

Python es una dependencia externa: instala **Python 3.10 o posterior con el lanzador `py`** desde [python.org](https://www.python.org/downloads/windows/). El paquete principal no incluye Python. Si falta, el lanzador muestra el requisito y el enlace de descarga. Se usa el Node incluido en Pro; no necesitas instalarlo aparte. Los diálogos utilizan Windows Forms mediante Windows PowerShell 5.1. No se cambia la política global de ejecución. La primera compilación necesita conexión y puede tardar varios minutos; sus registros contienen el detalle.

La base comprobada es el ZIP. Una instalación mediante Setup solo se acepta si sus archivos coinciden exactamente con las huellas Windows. No se extraen instaladores EXE ni archivos ASAR.

## Datos y reversión

Los respaldos, copias administradas y registros quedan en `%LOCALAPPDATA%\pokemon-showdown-okayu-update`. No elimines esa carpeta si necesitas revertir. Puedes elegir otra con `--data` o `OKAYU_UPDATE_DATA`.

```bat
Okayu-Update.cmd discover
Okayu-Update.cmd prepare "C:\Descargas\PokemonShowdownPro-1.2.0-windows-x64.zip"
Okayu-Update.cmd xpi-discover
Okayu-Update.cmd plan "C:\ShowdownPro"
Okayu-Update.cmd apply "C:\ShowdownPro" --modules performance,battle-messages,theme-okayu,showdown-plus,calcdex-languages --xpi auto
Okayu-Update.cmd status "C:\ShowdownPro"
Okayu-Update.cmd revert "C:\ShowdownPro"
Okayu-Update.cmd recover "C:\ShowdownPro"
```

La importación de Firefox verifica una copia privada del XPI sin modificar el perfil. Los diagnósticos omiten rutas y datos del perfil. `xpi-discover` muestra rutas locales: revisa su salida antes de compartirla.

Se usa un bloqueo Windows y se comprueban los procesos antes de escribir. La compilación serializa su caché y copia dependencias para evitar rutas largas de pnpm. Asigna temporalmente una letra de unidad libre a la carpeta de datos y la retira al finalizar. Una terminación forzada del gestor puede dejar esa asignación hasta cerrar sesión. Las transacciones conservan sus respaldos.

El acceso propio de Inicio utiliza un ICO Okayu cuando está instalado el tema. No se modifica el icono del archivo EXE ni se copia el perfil de Showdown. Revertir desde el gestor retira su acceso; la CLI revierte los archivos y conserva el acceso para abrir la distribución original.

## Compatibilidad y pruebas

`compatibility/1.2.0-windows.json` registra huellas obtenidas del ZIP oficial, SHA-256 `7b572264df34ec77bc6c2edd3f18ca439f737a7ef0a0ea9306492ed60ca2abd8`. Las diferencias textuales frente a Linux son CRLF. Se comprueban las huellas antes de normalizar texto para aplicar las anclas; los respaldos conservan los bytes originales.

Consulta [VALIDATION.md](VALIDATION.md) para resultados y límites. Es una alfa: no presupone compatibilidad con versiones futuras de Pro o Showdex, y no incluye actualizaciones automáticas del gestor.

## Empaquetar el gestor

```bat
py -3 tools\build_windows.py --output Okayu-Update-Windows.zip
```

El paquete principal contiene código fuente, módulos sin Glass, documentación y licencias. No incluye Python, Pro, dependencias descargadas de Calcdex, el XPI ni perfiles de usuarios. Para una distribución portable opcional, añade `--python-zip python-3.13.9-embed-amd64.zip`: se comprueba la huella del runtime y se incluye su licencia. Ese runtime se incorpora solamente al ZIP generado, nunca al repositorio.
