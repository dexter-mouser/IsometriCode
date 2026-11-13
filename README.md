# IsometriCode

Escena isométrica 3D interactiva que reproduce la arquitectura de la Sede Dirección General del Grupo Bancolombia en Medellín, sin logos ni marcas. Es un volumen lineal de unos 380 × 27 m y 54 m de alto, partido en Torre Norte y Torre Sur por una plazoleta central. Las torres se unen con dos puentes de vidrio verde y tienen fachada blanca con parasoles verticales, lobby de vidrio en planta baja y un volumen de vidrio en cada extremo: verde en el norte y claro en el sur. El frente largo mira al río y la parte trasera a la avenida. Alrededor hay una ciudad de manzanas y edificios de ladrillo, una avenida con palmeras y postes, la autopista, el río, un metro elevado con estación y un tren que pasa, nubes y pájaros. Se puede girar la cámara alrededor del edificio, y cada piso, ventana o zona se resalta al pasar el cursor y abre un panel de prueba al hacer clic. Por ahora los botones solo muestran avisos de prueba. La ciudad y el metro son decorativos: no responden a clics.

Está pensada solo para escritorio y usa la luz y los colores de un día natural.

## Instalar y ejecutar

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # versión de producción en dist/
npm run preview    # sirve dist/ para probarla
```

## Controles

- **Arrastrar:** gira la cámara 360° en horizontal.
- **Rueda:** acerca o aleja entre 0,8× y 1,6×.
- **Doble clic en el fondo:** vuelve a la vista inicial.
- **Clic en un piso, ventana o zona:** abre el panel. Lo cierran `Esc` y la X, y también un clic en el fondo.

## Estructura

```
index.html              Estructura de la página: menú, lienzo, etiqueta, panel y aviso
public/fuentes/         Barlow Condensed e Inter en woff2, servidas localmente
src/main.js             Arranque: une la escena, la interacción y la interfaz
src/datos/
  edificio.js           Torres, pisos, ventanas, volúmenes de vidrio, puentes y plazas
  ciudad.js             Radio del terreno, manzanas, avenida y metro
  menu.js               Botones del menú lateral
  tema.js               Colores de la interfaz (variables CSS) y de la escena
src/escena/
  escenario.js          Renderer, luces, sombras y bucle (se pausa con la pestaña oculta)
  camara.js             Cámara ortográfica isométrica: giro, zoom y reinicio
  edificio.js           Genera el edificio desde datos/edificio.js
  entorno.js            Terreno, autopista, río, árboles y carros de autopista y avenida
  ciudad.js             Manzanas, edificios con ventanas en el shader, avenida, palmeras y postes
  metro.js              Viaducto, estación y tren
  cielo.js              Nubes y bandadas de pájaros
  utilidades.js         Cajas instanciadas, color por vértice y aleatorio con semilla
src/interaccion/
  seleccion.js          Resaltado y clic (un raycast por fotograma)
  acciones.js           Qué hace cada tipo de elemento al tocarlo
src/interfaz/           Menú, panel, etiqueta, aviso e iconos SVG
src/estilos/            base.css, menu.css y panel.css
```

## Cómo funciona

- **Edificio por código:** `src/escena/edificio.js` lee `src/datos/edificio.js` y crea los pisos, las ventanas, las losas y los parasoles como mallas instanciadas, una sola llamada de dibujo por tipo. El tramo de vidrio de cada extremo pertenece al piso de su altura, así que al resaltar un piso se ilumina en toda la torre. Los lobbies, las azoteas, los puentes y las plazas son mallas normales que se marcan como zonas. Escala: 1 unidad ≈ 4,5 m.
- **Ciudad:** `src/escena/ciudad.js` reparte las manzanas en una cuadrícula de `src/datos/ciudad.js` y descarta las que se salen del disco. Algunas manzanas quedan como parques con árboles. Las ventanas de los edificios vecinos se pintan en el shader según la posición en el mundo, así que no hacen falta texturas y todos los edificios se dibujan en una sola llamada.
- **Metro:** el tren cruza el viaducto, sale del disco y vuelve tras una espera. El ciclo se calcula con el tiempo, así que no guarda estado.
- **Identificadores:** cada elemento clicable tiene un id estable, por ejemplo `torre-norte/piso-12`, `torre-sur/piso-5/ventana-3`, `zona/puente-alto` o `zona/plaza-central`.
- **Selección:** `seleccion.js` lanza un rayo por fotograma solo cuando el cursor está sobre la escena y no se está arrastrando. Un clic cuenta solo si el puntero se movió menos de 5 px; si se movió más, fue un giro.
- **Acciones:** `ejecutarAccion` de `acciones.js` recibe el elemento tocado y las herramientas de la interfaz (`abrirPanel`, `mostrarAviso`).
- **Rendimiento:** usa mallas instanciadas para ventanas, carros, árboles, nubes y pájaros; una sola luz con sombras que cubre el disco; `pixelRatio` de 2 como máximo; y pausa el bucle con la pestaña oculta. En desarrollo, `window.escenaDesarrollo.renderer.info` muestra las llamadas de dibujo.

## Cambios frecuentes

- **Pisos, tamaño de las torres o puentes:** solo cambia `src/datos/edificio.js` (`pisos`, `largo`, `ancho`, `ventanasLargo`, `volumenVidrio` y `puentes`).
- **Lo que hace un clic:** solo cambia `src/interaccion/acciones.js`. Hay una función por tipo: `piso`, `ventana` y `zona`.
- **Botones del menú:** cambia `src/datos/menu.js`. Si necesitas un icono nuevo, agrégalo en `src/interfaz/iconos.js`.
- **Ciudad, avenida o metro:** cambia `src/datos/ciudad.js` (manzanas, proporción de parques, alturas, carriles y velocidad del tren).
- **Colores:** solo cambia `src/datos/tema.js`.
