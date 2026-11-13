// Iconos de trazo (viewBox 0 0 24 24): cada uno es una lista de trazados SVG
export const iconos = {
  capas: ['M12 3l9 5-9 5-9-5 9-5z', 'M3 13l9 5 9-5', 'M3 17l9 5 9-5'],
  edificio: ['M5 21V4h9v17', 'M14 9h5v12', 'M3 21h18', 'M8 8h3M8 12h3M8 16h3'],
  personas: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M16 4.5a3.5 3.5 0 0 1 0 6.5', 'M18 14c2 .8 3 2.8 3 6'],
  calendario: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v5M16 3v5'],
  grafica: ['M4 20V4', 'M4 20h16', 'M8 16v-4M12 16V8M16 16v-6'],
  ajustes: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19 12h2M3 12h2M12 3v2M12 19v2M17 7l1.4-1.4M5.6 18.4L7 17M17 17l1.4 1.4M5.6 5.6L7 7'],
};

const ESPACIO_SVG = 'http://www.w3.org/2000/svg';

// Crea el nodo <svg> de un icono sin usar innerHTML
export function crearIcono(nombre) {
  const svg = document.createElementNS(ESPACIO_SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const trazado of iconos[nombre] ?? []) {
    const ruta = document.createElementNS(ESPACIO_SVG, 'path');
    ruta.setAttribute('d', trazado);
    svg.append(ruta);
  }
  return svg;
}
