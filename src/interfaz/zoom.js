import { ZOOM_MAXIMO, ZOOM_MINIMO, ZOOM_PREDETERMINADO } from '../escena/camara.js';

const POSICION_MEDIA = 50;
const PASO_BOTON = 10;

// Barra de zoom: la mitad es el zoom predeterminado; escala logarítmica a cada lado
export function crearControlZoom({ alCambiar }) {
  const barra = document.getElementById('zoom-barra');
  const menos = document.getElementById('zoom-menos');
  const mas = document.getElementById('zoom-mas');

  const aplicarPosicion = (posicion) => {
    barra.value = String(Math.min(Math.max(posicion, 0), 100));
    alCambiar(zoomDesdePosicion(Number(barra.value)));
  };

  barra.addEventListener('input', () => aplicarPosicion(Number(barra.value)));
  menos.addEventListener('click', () => aplicarPosicion(Number(barra.value) - PASO_BOTON));
  mas.addEventListener('click', () => aplicarPosicion(Number(barra.value) + PASO_BOTON));
  barra.addEventListener('dblclick', () => aplicarPosicion(POSICION_MEDIA));

  // Refleja en la barra el zoom actual (rueda, viajes)
  const mostrarZoom = (zoom) => {
    barra.value = String(Math.round(posicionDesdeZoom(zoom)));
  };

  const habilitar = (estaHabilitado) => {
    for (const control of [barra, menos, mas]) control.disabled = !estaHabilitado;
  };

  return { mostrarZoom, habilitar };
}

function zoomDesdePosicion(posicion) {
  if (posicion <= POSICION_MEDIA) {
    const t = posicion / POSICION_MEDIA;
    return Math.exp(Math.log(ZOOM_MINIMO) + t * (Math.log(ZOOM_PREDETERMINADO) - Math.log(ZOOM_MINIMO)));
  }
  const t = (posicion - POSICION_MEDIA) / POSICION_MEDIA;
  return Math.exp(Math.log(ZOOM_PREDETERMINADO) + t * (Math.log(ZOOM_MAXIMO) - Math.log(ZOOM_PREDETERMINADO)));
}

function posicionDesdeZoom(zoom) {
  const limitado = Math.min(Math.max(zoom, ZOOM_MINIMO), ZOOM_MAXIMO);
  if (limitado <= ZOOM_PREDETERMINADO) {
    return (POSICION_MEDIA * (Math.log(limitado) - Math.log(ZOOM_MINIMO))) / (Math.log(ZOOM_PREDETERMINADO) - Math.log(ZOOM_MINIMO));
  }
  return POSICION_MEDIA + (POSICION_MEDIA * (Math.log(limitado) - Math.log(ZOOM_PREDETERMINADO))) / (Math.log(ZOOM_MAXIMO) - Math.log(ZOOM_PREDETERMINADO));
}
