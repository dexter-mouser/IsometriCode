import * as THREE from 'three';

const ELEVACION = THREE.MathUtils.degToRad(35);
const AZIMUT_INICIAL = THREE.MathUtils.degToRad(45);
const DISTANCIA = 120;
const ALTO_VISTA = 62;
const OBJETIVO = new THREE.Vector3(0, 11, 0);
const ZOOM_MINIMO = 0.8;
const ZOOM_MAXIMO = 1.6;
const SENSIBILIDAD_GIRO = 0.006;
const FRICCION_INERCIA = 0.9;
const SUAVIZADO_ZOOM = 10;
const DURACION_REINICIO = 0.8;

// Cámara ortográfica isométrica que solo gira en horizontal y hace zoom corto
export function crearCamara(elementoEventos) {
  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  const estado = {
    azimut: AZIMUT_INICIAL,
    velocidad: 0,
    zoomObjetivo: 1,
    arrastrando: false,
    ultimoX: 0,
    reinicio: null,
  };

  ajustarProporcion(camara);
  colocarCamara(camara, estado.azimut);
  escucharEventos(elementoEventos, camara, estado);

  const actualizar = (delta) => actualizarCamara(camara, estado, delta);
  const reiniciar = () => {
    const vueltas = Math.round((estado.azimut - AZIMUT_INICIAL) / (Math.PI * 2));
    estado.reinicio = { desde: estado.azimut, hasta: AZIMUT_INICIAL + vueltas * Math.PI * 2, zoomDesde: camara.zoom, t: 0 };
    estado.velocidad = 0;
  };

  return { camara, actualizar, reiniciar };
}

function ajustarProporcion(camara) {
  const proporcion = window.innerWidth / window.innerHeight;
  camara.top = ALTO_VISTA / 2;
  camara.bottom = -ALTO_VISTA / 2;
  camara.left = (-ALTO_VISTA * proporcion) / 2;
  camara.right = (ALTO_VISTA * proporcion) / 2;
  camara.updateProjectionMatrix();
}

function colocarCamara(camara, azimut) {
  const horizontal = Math.cos(ELEVACION) * DISTANCIA;
  camara.position.set(
    OBJETIVO.x + Math.sin(azimut) * horizontal,
    OBJETIVO.y + Math.sin(ELEVACION) * DISTANCIA,
    OBJETIVO.z + Math.cos(azimut) * horizontal,
  );
  camara.lookAt(OBJETIVO);
}

// Arrastre para girar, rueda para zoom
function escucharEventos(elemento, camara, estado) {
  elemento.addEventListener('pointerdown', (evento) => {
    if (evento.button !== 0) return;
    estado.arrastrando = true;
    estado.ultimoX = evento.clientX;
    estado.velocidad = 0;
    estado.reinicio = null;
    elemento.setPointerCapture(evento.pointerId);
  });

  elemento.addEventListener('pointermove', (evento) => {
    if (!estado.arrastrando) return;
    const giro = (evento.clientX - estado.ultimoX) * SENSIBILIDAD_GIRO;
    estado.ultimoX = evento.clientX;
    estado.azimut -= giro;
    estado.velocidad = -giro;
  });

  const soltar = () => { estado.arrastrando = false; };
  elemento.addEventListener('pointerup', soltar);
  elemento.addEventListener('pointercancel', soltar);

  elemento.addEventListener('wheel', (evento) => {
    evento.preventDefault();
    const factor = Math.exp(-evento.deltaY * 0.0012);
    estado.zoomObjetivo = THREE.MathUtils.clamp(estado.zoomObjetivo * factor, ZOOM_MINIMO, ZOOM_MAXIMO);
    estado.reinicio = null;
  }, { passive: false });

  window.addEventListener('resize', () => ajustarProporcion(camara));
}

function actualizarCamara(camara, estado, delta) {
  if (estado.reinicio) {
    animarReinicio(camara, estado, delta);
  } else if (!estado.arrastrando && Math.abs(estado.velocidad) > 0.00001) {
    estado.azimut += estado.velocidad;
    estado.velocidad *= Math.pow(FRICCION_INERCIA, delta * 60);
  }

  const zoomNuevo = THREE.MathUtils.damp(camara.zoom, estado.zoomObjetivo, SUAVIZADO_ZOOM, delta);
  if (Math.abs(zoomNuevo - camara.zoom) > 0.0001) {
    camara.zoom = zoomNuevo;
    camara.updateProjectionMatrix();
  }
  colocarCamara(camara, estado.azimut);
}

function animarReinicio(camara, estado, delta) {
  const reinicio = estado.reinicio;
  reinicio.t = Math.min(reinicio.t + delta / DURACION_REINICIO, 1);
  const curva = 1 - Math.pow(1 - reinicio.t, 3);
  estado.azimut = THREE.MathUtils.lerp(reinicio.desde, reinicio.hasta, curva);
  estado.zoomObjetivo = THREE.MathUtils.lerp(reinicio.zoomDesde, 1, curva);
  if (reinicio.t === 1) estado.reinicio = null;
}
