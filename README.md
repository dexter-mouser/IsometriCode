# IsometriCode

**Ver en línea:** https://dexter-mouser.github.io/IsometriCode/

Escena isométrica 3D interactiva que reproduce la arquitectura de la Sede Dirección General del Grupo Bancolombia en Medellín, sin logos ni marcas. El edificio es un volumen lineal de unos 380 × 27 m y 54 m de alto, partido en Torre Norte y Torre Sur por una plazoleta central con fuente. Las torres se unen con dos puentes de vidrio verde que funcionan como zona de vigilancia y control; tienen cámaras y balizas. Además, tienen fachada blanca con parasoles verticales, lobby de vidrio en planta baja y un volumen de vidrio en cada extremo.

El entorno sigue la disposición real de la zona, tomada de la vista satelital:

- **Hacia el río:** la plaza frontal con bancas, jardineras, palmeras y personas caminando; el metro elevado con su estación al norte; la Avenida Regional; el río; la Autopista Sur; y un parque.
- **Hacia el oriente:** la Carrera 48, una franja de bodegas con techo a dos aguas, claraboyas y portones, y dos filas de barrios de ladrillo y torres.
- **Al norte:** la Calle 30, que pasa elevada sobre la Regional, el río y la Autopista Sur, con una oreja de acceso.
- **Al sur:** una calle a nivel con un puente bajo sobre el río.

Los edificios de ladrillo tienen locales comerciales en la planta baja (vitrina y toldo de color hacia la calle), retranqueos escalonados, tanques de agua y cuartos de máquinas. Las torres claras tienen franjas de balcones y un remate con antena.

Todo está sobre un bloque cuadrado de tierra que flota, con capas de tierra, roca, cables del alumbrado, raíces y tubos colgando. Nubes y pájaros pasan sobre la ciudad; las nubes se desvanecen al acercarse. El botón Día/Tarde del menú cambia con una transición suave a una tarde cálida: el sol baja y las sombras se alargan, el cielo se vuelve naranja y se encienden ventanas en la ciudad y en el edificio.

Al pasar el cursor, cada piso, ventana o zona se resalta. Al tocarlos pasa lo siguiente:

- **Piso:** la cámara viaja a ese piso, la torre se corta y se ve la planta con 8 oficinas de distintos diseños (open space, sala de juntas, oficina privada, zona de descanso). Al tocar una, se entra a ella.
- **Ventana:** la cámara viaja a la ventana y se ve una de esas oficinas a través del vidrio.
- **Puente:** se entra a la sala de control, con muro de pantallas, consolas y operadores.
- **Plaza:** la cámara se acerca y deja girar y hacer zoom.

Los botones del panel son de prueba. La ciudad, las vías y el metro son decorativos.

Está pensada solo para escritorio y usa la luz y los colores de un día natural.

## Instalar y ejecutar

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # versión de producción en dist/
npm run preview    # sirve dist/ para probarla
```

## Publicación

Cada push a `main` ejecuta `.github/workflows/pages.yml`, que compila el proyecto y lo publica en GitHub Pages. En producción, Vite usa la ruta base `/IsometriCode/` (ver `vite.config.js`).

## Controles

- **Clic izquierdo y arrastrar:** gira la cámara 360° en horizontal.
- **Clic derecho (o central) y arrastrar:** desplaza la vista dentro del bloque.
- **Rueda:** acerca o aleja hacia el cursor, entre 0,8× y 4×.
- **Barra de zoom (abajo a la derecha):** la mitad es el zoom predeterminado (1×); «−» y «+» avanzan por pasos y un doble clic en la barra vuelve a la mitad.
- **Doble clic en el fondo:** vuelve a la vista inicial.
- **Clic en un piso, ventana, puente o plaza:** entra a ese nivel. «Volver», la X o `Esc` regresan al nivel anterior.
- **Clic en el lobby o en una azotea:** abre solo el panel.
- **Teclado (solo el edificio):** fuera de un piso, ↑/↓ recorren los pisos y ←/→ cambian de torre. En la planta de un piso, ←/→ recorren las oficinas y ↑/↓ cambian de lado del pasillo. Enter entra al elemento resaltado y Esc vuelve.
- **Botón Día/Tarde (pie del menú):** alterna la luz del día y de la tarde.

## Estructura

```
index.html              Estructura de la página: menú, lienzo, zoom, fundido, etiqueta, panel y aviso
public/fuentes/         Barlow Condensed e Inter en woff2, servidas localmente
src/main.js             Arranque: une la escena, los interiores, la interacción y la interfaz
src/datos/
  edificio.js           Torres, pisos, ventanas, volúmenes de vidrio, puentes y plazas
  ciudad.js             Terreno flotante, manzanas, Carrera 48, Calle 30, calle sur, vías rápidas, río y metro
  oficinas.js           Diseños de oficina, reparto por piso y distribución de la planta
  menu.js               Botones del menú lateral
  tema.js               Colores de la interfaz (variables CSS), la escena, las oficinas y sus variantes, el control, la plaza y los ambientes de día y tarde
src/escena/
  escenario.js          Renderer, luces, sombras y bucle (dibuja la vista activa; se pausa con la pestaña oculta)
  ambiente.js           Transición entre día y tarde: luces, cielo y ventanas encendidas
  camara.js             Cámara ortográfica: giro, desplazamiento, zoom al cursor, viajes y regreso
  terreno.js            Bloque de tierra flotante: capas, roca, cables, raíces y tubos
  edificio.js           Edificio desde datos, corte por piso, cámaras y balizas de los puentes
  planta.js             Planta de un piso: oficinas clicables con muebles y personas
  plaza.js              Franjas de piso, fuente, bancas, jardineras y personas caminando
  entorno.js            Vías rápidas, río, árboles y carros
  ciudad.js             Manzanas y arquitectura (locales, retranqueos, bodegas, torres con balcones), calles, palmeras y postes
  metro.js              Viaducto, estación y tren
  cielo.js              Nubes (se desvanecen con el zoom) y bandadas de pájaros
  oficina.js            Interiores vistos por una ventana: 4 diseños de oficina con variantes y la sala de control
  utilidades.js         Cajas instanciadas, lotes de piezas fijas, color por vértice, unión de geometrías y aleatorio con semilla
src/interaccion/
  seleccion.js          Resaltado y clic (un raycast por fotograma; los clicables cambian según el nivel)
  vistas.js             Niveles apilados: ciudad → plaza, piso u oficina → oficina, con fundido y «Volver»
  acciones.js           Qué hace cada tipo de elemento al tocarlo y qué muestra el panel
  funciones.js          Funciones de los botones del menú y del panel (conectadas, aún vacías)
  teclado.js            Navegación con flechas, Enter y Esc sobre el edificio
src/interfaz/           Menú, panel, etiqueta, aviso, control de zoom e iconos SVG
src/estilos/            base.css, menu.css, panel.css y zoom.css
```

## Cómo funciona

- **Edificio por código:** `src/escena/edificio.js` lee `src/datos/edificio.js` y crea los pisos, las ventanas, las losas y los parasoles como mallas instanciadas, una sola llamada de dibujo por tipo. Cada pieza guarda su torre y su piso. Cada elemento clicable trae un `destino` (posición, dirección y zoom) para el viaje de la cámara. Escala: 1 unidad ≈ 4,5 m.
- **Corte por piso:** al elegir un piso, sus piezas y las de arriba se ocultan con una matriz de escala cero, junto con la azotea y los puentes superiores. Encima de la losa se arma la planta de `planta.js`: cada oficina es una sola malla con color por vértice, así que se resalta y se toca entera. Al volver, todo se restaura y la planta se libera de memoria.
- **Interiores:** `oficina.js` tiene su propia escena y cámara en perspectiva con los cinco diseños; `mostrarDiseno(diseño, semilla)` elige cuál se ve.
  - **Qué diseño:** la ventana usa uno estable según su id, las oficinas de la planta usan el suyo y los puentes, la sala de control.
  - **Variantes:** la semilla (el id) cambia el color de sillas, sofás y madera, la pared de acento, el piso y qué personas están, así que dos oficinas del mismo diseño no se ven iguales. La planta de cada piso también tiene su propia paleta de muebles.
- **Niveles:** `vistas.js` apila los niveles. Cada nivel guarda el contenido de su panel y cómo deshacerse. «Volver» desapila, deshace (cámara, corte o fundido) y reabre el panel del nivel anterior. La cámara también apila las vistas guardadas en cada viaje.
- **Zoom:** la rueda guarda el punto del suelo bajo el cursor y, al cambiar el zoom, desplaza el objetivo para que ese punto no se mueva. El desplazamiento con clic derecho hace lo mismo entre dos posiciones del puntero. El objetivo no sale del bloque.
- **Ciudad:** manzanas en una cuadrícula de `src/datos/ciudad.js`. Cada parcela se construye según su tipo (ladrillo, torre o bodega), y cada pieza (locales, vitrinas, toldos, techos a dos aguas, balcones, tanques) va en su propia malla instanciada. Las ventanas y los techos se pintan en el shader; en la tarde, un azar por ventana decide cuáles se encienden.
- **Día y tarde:** `ambiente.js` interpola colores, intensidad y posición del sol, la luz del cielo y el degradado del fondo. Avisa del valor intermedio al edificio, a la ciudad y a los interiores.
- **Botones:** el menú y los botones «Prueba» del panel llaman a `ejecutarFuncion(id)` de `funciones.js`. Cada botón tiene ahí su id (`menu/prueba-1`, `piso/prueba-2`…) con la función pendiente; hasta que se le asigne una, solo avisa.
- **Selección:** un rayo por fotograma solo cuando el cursor está sobre la escena, no se arrastra y no se está dentro de un interior. Un clic cuenta si el puntero se movió menos de 5 px.
- **Rendimiento:** las piezas fijas (vías, río, muros, calles, puente de la Calle 30, viaducto, estación, cámaras) se unen por lotes en pocas mallas; además hay mallas instanciadas, una sola luz con sombras, `pixelRatio` de 2 como máximo y bucle pausado con la pestaña oculta. En desarrollo, `window.escenaDesarrollo` da acceso al renderer (`renderer.info`), a `probarAccion` para simular clics y a `vistas`.

## Cambios frecuentes

- **Pisos, tamaño de las torres o puentes:** `src/datos/edificio.js`.
- **Oficinas por piso y orden de los diseños:** `src/datos/oficinas.js`. Los muebles de la planta están en `src/escena/planta.js`, y los interiores en `src/escena/oficina.js`.
- **Lo que hace un clic y el contenido del panel:** solo `src/interaccion/acciones.js` (una función por tipo: `piso`, `oficina`, `ventana`, `puente`, `plaza` y `zona`).
- **Botones del menú:** `src/datos/menu.js` (iconos en `src/interfaz/iconos.js`).
- **Darle función a un botón:** solo `src/interaccion/funciones.js` (reemplaza `pendiente` por la función).
- **Ciudad, vías, metro o terreno:** `src/datos/ciudad.js`.
- **Colores:** solo `src/datos/tema.js`.
