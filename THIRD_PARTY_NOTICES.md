# Procedencia y componentes externos

- **Pokémon Showdown Pro 1.2.0**, Ryukotsuki y colaboradores: https://github.com/Ryukotsuki/PokemonShowdownPro — AGPL-3.0-or-later. Los módulos contienen adaptaciones de sus archivos; `LICENSE` conserva el texto de la licencia. La aplicación y su runtime no se incluyen en este repositorio.
- **Pokémon Showdown client**, Smogon y colaboradores: https://github.com/smogon/pokemon-showdown-client — AGPL-3.0. Se usa el cliente que entrega Pro; este repositorio no incorpora una distribución propia del cliente.
- **Showdex 1.4.2**, Keith Choison y colaboradores: https://github.com/doshidak/showdex/tree/165abdb05ad08c5b286f71e21cc1907852efd76f — AGPL-3.0. Las transformaciones locales están en los módulos de tema e idiomas. El gestor compila a partir del archivo de código fuente entregado con Pro y conserva sus recursos/avisos en la instalación. No se distribuye el calculador compilado aquí.
- **Showdown+ 1.4**, Nathan Michael / JxstMichie: https://github.com/JxstMichie/PokemonShowdownPlus (XPI oficial v1.4: https://github.com/JxstMichie/PokemonShowdownPlus/releases/tag/v1.4) y https://addons.mozilla.org/firefox/addon/pokemon-showdown-plus/. Mozilla identifica su licencia como **Partial PolyForm Non-Commercial License**, con términos propios: https://addons.mozilla.org/firefox/addon/pokemon-showdown-plus/license/. La licencia AGPL del gestor no concede derechos sobre ese componente. El repositorio entrega el adaptador para Electron y deltas de compatibilidad; el usuario importa el paquete oficial localmente. No se incluyen el XPI, renders, sprites, sonidos ni fondos del complemento.
- **Electron, Node.js, pnpm y extensiones incluidas con Pro** conservan las licencias y avisos de la distribución original. El gestor no los redistribuye.

Este proyecto es independiente y no es una publicación oficial de Pokémon Showdown, Showdex, Showdown+, Nintendo, Game Freak ni The Pokémon Company.

## Identidad Okayu

El logo de onigiri morado fue proporcionado por el mantenedor para integrarlo en el paquete. Se conserva su PNG sin alterar. No es un recurso extraído de Showdown ni de Showdown+; la licencia del código no cambia los derechos que correspondan a esa imagen.


## Sprites de los controles

Los cuatro PNG de `modules/{battle-messages,showdown-plus}/files/app/assets/icons/controls/` proceden del repositorio [PokéAPI/sprites](https://github.com/PokeAPI/sprites) y se conservan sin modificar. Pokémon y sus imágenes pertenecen a sus respectivos titulares (Nintendo, Game Freak y The Pokémon Company); la licencia del código del gestor no concede derechos sobre esas imágenes. Se utilizan únicamente como iconos identificadores de Pokémon en este proyecto independiente.

- [Solrock, icono de generación VII](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons/338.png) — SHA-256 `52877bd782ee0e53aea4666668600cbbb371cfe4ea36a98e445608dbd44d44a9`.
- [Lunatone, icono de generación VII](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons/337.png) — SHA-256 `fedcea6c95b5866f08d2db569450139a460e98ae3250f99574b1ab2963aed4fb`.
- [Unown normal](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/201.png) — SHA-256 `f75c23d3c7717c325083edc902470d4007d8e491647320b75f9fdfc8d1f446ad`.
- [Unown shiny](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/201.png) — SHA-256 `42608a88b9f55f801a5a7d43e273171cc0c2e3b1ecb45d8e182eb6274f8b1d24`.
