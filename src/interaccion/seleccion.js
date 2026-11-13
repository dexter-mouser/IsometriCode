import * as THREE from 'three';

const UMBRAL_CLIC_PX = 5;
const NIVEL_NORMAL = 0;
const NIVEL_HOVER = 1;
const NIVEL_SELECCION = 2;

// Resaltado al pasar el cursor y selección al hacer clic (un raycast por fotograma)
export function crearSeleccion({ lienzo, camara, clicables, alPasar, alSeleccionar, alDeseleccionar }) {
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  const estado = {
    dentro: false,
    presionado: false,
    inicio: { x: 0, y: 0 },
    cliente: { x: 0, y: 0 },
    hover: null,
    seleccion: null,
    pausada: false,
  };

  const pintar = (objetivo) => {
    if (!objetivo) return;
    const nivel = objetivo.elemento.id === estado.seleccion?.elemento.id
      ? NIVEL_SELECCION
      : objetivo.elemento.id === estado.hover?.elemento.id ? NIVEL_HOVER : NIVEL_NORMAL;
    objetivo.resaltar(objetivo.indice, nivel);
  };

  const cambiarHover = (nuevo) => {
    if (nuevo?.elemento.id === estado.hover?.elemento.id) return;
    const anterior = estado.hover;
    estado.hover = nuevo;
    pintar(anterior);
    pintar(nuevo);
    lienzo.style.cursor = nuevo ? 'pointer' : '';
  };

  const buscarObjetivo = () => {
    puntero.set((estado.cliente.x / window.innerWidth) * 2 - 1, -(estado.cliente.y / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(puntero, camara);
    const [impacto] = raycaster.intersectObjects(clicables, false);
    return impacto ? objetivoDesdeImpacto(impacto) : null;
  };

  escucharPuntero(lienzo, estado, () => {
    if (estado.pausada) return;
    const objetivo = estado.hover;
    const anterior = estado.seleccion;
    estado.seleccion = objetivo;
    pintar(anterior);
    pintar(objetivo);
    if (objetivo) alSeleccionar(objetivo.elemento);
    else alDeseleccionar();
  }, () => cambiarHover(null));

  // Durante un viaje o en la oficina no se resalta ni se selecciona nada
  const pausar = (valor) => {
    estado.pausada = valor;
    if (valor) {
      cambiarHover(null);
      alPasar(null, estado.cliente);
    }
  };

  // Se llama en cada fotograma
  const actualizar = () => {
    if (estado.pausada || !estado.dentro || estado.presionado) return;
    cambiarHover(buscarObjetivo());
    alPasar(estado.hover?.elemento ?? null, estado.cliente);
  };

  const limpiarSeleccion = () => {
    const anterior = estado.seleccion;
    estado.seleccion = null;
    pintar(anterior);
  };

  return { actualizar, pausar, limpiarSeleccion, hayElementoBajoCursor: () => Boolean(estado.hover) };
}

// Traduce el impacto del rayo al elemento de datos y su función de resaltado
function objetivoDesdeImpacto({ object: objeto, instanceId }) {
  const { elementos, elemento, resaltar } = objeto.userData;
  if (elementos) return { elemento: elementos[instanceId], indice: instanceId, resaltar };
  return { elemento, indice: 0, resaltar };
}

// Distingue clic de arrastre: un clic mueve el puntero menos de UMBRAL_CLIC_PX
function escucharPuntero(lienzo, estado, alHacerClic, alSalir) {
  lienzo.addEventListener('pointermove', (evento) => {
    estado.dentro = true;
    estado.cliente = { x: evento.clientX, y: evento.clientY };
  });
  lienzo.addEventListener('pointerleave', () => {
    estado.dentro = false;
    alSalir();
  });
  lienzo.addEventListener('pointerdown', (evento) => {
    if (evento.button !== 0) return;
    estado.presionado = true;
    estado.inicio = { x: evento.clientX, y: evento.clientY };
  });
  lienzo.addEventListener('pointerup', (evento) => {
    if (!estado.presionado) return;
    estado.presionado = false;
    const distancia = Math.hypot(evento.clientX - estado.inicio.x, evento.clientY - estado.inicio.y);
    if (distancia < UMBRAL_CLIC_PX) alHacerClic();
  });
}
