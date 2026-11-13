// Navegación con teclado, solo sobre el edificio (la ciudad es decorativa):
// fuera de la planta, ↑/↓ recorren los pisos y ←/→ cambian de torre;
// en la planta de un piso, ←/→ recorren las oficinas y ↑/↓ cambian de lado del pasillo.
// Enter entra al elemento resaltado; Esc (en el panel) vuelve.
const ELEMENTOS_INTERACTIVOS = 'button, input, select, textarea, a, [contenteditable]';

export function crearTeclado({ seleccion, vistas, mallaPisos, torres, mostrarAviso }) {
  const foco = { torre: 0, piso: 1, oficina: 0 };

  const objetivoPiso = () => {
    const id = `${torres[foco.torre].id}/piso-${foco.piso}`;
    const indice = mallaPisos.userData.elementos.findIndex((elemento) => elemento.id === id);
    return { elemento: mallaPisos.userData.elementos[indice], indice, resaltar: mallaPisos.userData.resaltar };
  };

  const objetivoOficina = () => {
    const oficinas = seleccion.obtenerClicables();
    const malla = oficinas[((foco.oficina % oficinas.length) + oficinas.length) % oficinas.length];
    return { elemento: malla.userData.elemento, indice: 0, resaltar: malla.userData.resaltar };
  };

  // Mueve el foco según la tecla; devuelve false si la tecla no es de navegación
  const mover = (tecla, enPlanta) => {
    const torre = torres[foco.torre];
    const oficinasPorLado = seleccion.obtenerClicables().length / 2;
    const pasos = {
      ArrowUp: () => (enPlanta ? (foco.oficina += oficinasPorLado) : (foco.piso = Math.min(foco.piso + 1, torre.pisos))),
      ArrowDown: () => (enPlanta ? (foco.oficina -= oficinasPorLado) : (foco.piso = Math.max(foco.piso - 1, 1))),
      ArrowRight: () => (enPlanta ? foco.oficina++ : (foco.torre = (foco.torre + 1) % torres.length)),
      ArrowLeft: () => (enPlanta ? foco.oficina-- : (foco.torre = (foco.torre + torres.length - 1) % torres.length)),
    };
    if (!pasos[tecla]) return false;
    pasos[tecla]();
    foco.piso = Math.min(foco.piso, torres[foco.torre].pisos);
    return true;
  };

  document.addEventListener('keydown', (evento) => {
    if (evento.target.closest?.(ELEMENTOS_INTERACTIVOS) || vistas.estaEnTransicion()) return;
    const nivel = vistas.nivelActual();
    if (nivel === 'oficina') return;
    const enPlanta = nivel === 'piso';

    if (evento.key === 'Enter') {
      evento.preventDefault();
      const objetivo = enPlanta ? objetivoOficina() : objetivoPiso();
      if (enPlanta) foco.oficina = 0;
      seleccion.seleccionar(objetivo);
      return;
    }
    if (!mover(evento.key, enPlanta)) return;
    evento.preventDefault();
    const objetivo = enPlanta ? objetivoOficina() : objetivoPiso();
    seleccion.enfocar(objetivo);
    mostrarAviso(objetivo.elemento.nombre);
  });
}
