const DESPLAZAMIENTO_PX = 16;

// Etiqueta flotante junto al cursor con el nombre del elemento
export function crearEtiqueta() {
  const etiqueta = document.getElementById('etiqueta');
  let textoActual = '';

  return (elemento, posicion) => {
    if (!elemento) {
      etiqueta.classList.remove('etiqueta--visible');
      textoActual = '';
      return;
    }
    if (elemento.nombre !== textoActual) {
      etiqueta.textContent = elemento.nombre;
      textoActual = elemento.nombre;
    }
    etiqueta.style.translate = `${posicion.x + DESPLAZAMIENTO_PX}px ${posicion.y + DESPLAZAMIENTO_PX}px`;
    etiqueta.classList.add('etiqueta--visible');
  };
}
