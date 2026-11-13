const DURACION_FUNDIDO_MS = 220;

const esperar = (milisegundos) => new Promise((resolver) => setTimeout(resolver, milisegundos));

// Cambia entre la vista de la ciudad y la oficina: viaje de cámara + fundido corto
export function crearVistas({ ciudad, oficina, controlCamara, seleccion }) {
  const fundido = document.getElementById('fundido');
  let vistaActual = 'ciudad';
  let enTransicion = false;

  const fundir = async (cambio) => {
    fundido.classList.add('fundido--visible');
    await esperar(DURACION_FUNDIDO_MS);
    cambio();
    fundido.classList.remove('fundido--visible');
  };

  // Viaja a la ventana y muestra la oficina; alLlegar abre el menú
  const entrarOficina = (elemento, alLlegar) => {
    if (enTransicion || vistaActual !== 'ciudad' || !elemento.posicion) return;
    enTransicion = true;
    seleccion.pausar(true);
    controlCamara.viajarA(elemento.posicion, elemento.normal, () => fundir(() => {
      vistaActual = 'oficina';
      enTransicion = false;
      alLlegar();
    }));
  };

  // Vuelve a la ciudad y aleja la cámara a la vista anterior
  const salirOficina = () => {
    if (enTransicion || vistaActual !== 'oficina') return;
    enTransicion = true;
    fundir(() => {
      vistaActual = 'ciudad';
      controlCamara.volver(() => {
        enTransicion = false;
        seleccion.pausar(false);
      });
    });
  };

  return {
    entrarOficina,
    salirOficina,
    estaEnOficina: () => vistaActual === 'oficina',
    obtenerVista: () => (vistaActual === 'oficina' ? oficina : ciudad),
  };
}
