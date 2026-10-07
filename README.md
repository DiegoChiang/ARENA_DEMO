# Simulación · Recursos No Reusables

Presentación web interactiva basada en la clase suministrada y en los modelos `Tienda de regalos.doe` y `Tienda de regalos ESC.doe`.

## Abrir

Abre `index.html` en un navegador moderno. No requiere npm, servidor ni instalación.

## Navegación

- `→` o `Espacio`: siguiente micro-paso
- `←`: micro-paso anterior
- `↓`: siguiente slide
- `↑`: slide anterior
- `F`: pantalla completa
- `R`: reiniciar slide

## Mejoras incluidas en esta versión

- Interfaz de explicación con **estética inspirada en Arena**: cinta superior, Project Bar, módulos tipo `Create`, `Assign`, `Decide`, `Process`, `Record`, `Dispose`, etc.
- **Ventanas de módulos** con apariencia de cuadro de diálogo de Arena.
- Inclusión del **Expression Builder** en los micro-pasos donde sí se usa una expresión.
- En cada expresión se indica **qué categoría del Expression Builder** usar para encontrar funciones, variables o atributos.
- Simulación docente ampliada con varios casos:
  - rama `TRUE` del Decide de stock,
  - rama `FALSE` del Decide de stock,
  - rama `TRUE` del Decide de devolución,
  - rama `FALSE` del Decide de devolución,
  - ejemplo de **reposición**.

## Enfoque docente

La resolución mantiene sincronizadas tres vistas:

`Texto del problema ⇄ Dibujo técnico ⇄ Arena`

La réplica de Arena es pedagógica e interactiva. Está inspirada en la estructura del software y en los módulos/configuraciones observados en los archivos `.doe`, así como en capturas y guías de Arena, pero no pretende ser una reproducción pixel-perfect de una versión específica.

La slide **Ejecución docente** usa una secuencia controlada de eventos para explicar estados. No sustituye una corrida estadística real de Arena.
