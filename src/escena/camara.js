import * as THREE from 'three';

const ELEVACION = THREE.MathUtils.degToRad(35);
const AZIMUT_INICIAL = THREE.MathUtils.degToRad(45);
const DISTANCIA = 160;
const ALTO_VISTA = 136;
const OBJETIVO_INICIAL = new THREE.Vector3(0, -5, 0);
const ZOOM_MINIMO = 0.8;
const ZOOM_MAXIMO = 1.6;
const ZOOM_VENTANA = 90;
const SENSIBILIDAD_GIRO = 0.006;
const FRICCION_INERCIA = 0.9;
const SUAVIZADO_ZOOM = 10;
const DURACION_REINICIO = 0.8;
const DURACION_VIAJE = 1.2;

// Cámara ortográfica isométrica: gira en horizontal, zoom corto y viaje animado a una ventana
export function crearCamara(elementoEventos) {
  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 500);
  const estado = {
    azimut: AZIMUT_INICIAL,
    objetivo: OBJETIVO_INICIAL.clone(),
    velocidad: 0,
    zoomObjetivo: 1,
    arrastrando: false,
    ultimoX: 0,
    animacion: null,
    bloqueada: false,
    vistaGuardada: null,
  };

  ajustarProporcion(camara);
  colocarCamara(camara, estado);
  escucharEventos(elementoEventos, camara, estado);

  // Anima azimut, objetivo y zoom hacia un destino
  const animarHacia = (destino, duracion, alTerminar) => {
    const vueltas = Math.round((estado.azimut - destino.azimut) / (Math.PI * 2));
    estado.velocidad = 0;
    estado.animacion = {
      desde: { azimut: estado.azimut, objetivo: estado.objetivo.clone(), zoom: camara.zoom },
      hasta: { ...destino, azimut: destino.azimut + vueltas * Math.PI * 2 },
      duracion,
      t: 0,
      alTerminar,
    };
  };

  const reiniciar = () => {
    if (estado.bloqueada) return;
    animarHacia({ azimut: AZIMUT_INICIAL, objetivo: OBJETIVO_INICIAL, zoom: 1 }, DURACION_REINICIO);
  };

  // Gira de frente a la fachada (normal en x/z) y acerca hasta llenar la pantalla con la ventana
  const viajarA = (posicion, normal, alTerminar) => {
    estado.vistaGuardada = { azimut: estado.azimut, objetivo: estado.objetivo.clone(), zoom: camara.zoom };
    estado.bloqueada = true;
    const azimut = Math.atan2(normal[0], normal[1]);
    animarHacia({ azimut, objetivo: new THREE.Vector3(...posicion), zoom: ZOOM_VENTANA }, DURACION_VIAJE, alTerminar);
  };

  const volver = (alTerminar) => {
    const vista = estado.vistaGuardada ?? { azimut: AZIMUT_INICIAL, objetivo: OBJETIVO_INICIAL, zoom: 1 };
    animarHacia(vista, DURACION_VIAJE, () => {
      estado.bloqueada = false;
      alTerminar?.();
    });
  };

  const actualizar = (delta) => actualizarCamara(camara, estado, delta);
  return { camara, actualizar, reiniciar, viajarA, volver };
}

function ajustarProporcion(camara) {
  const proporcion = window.innerWidth / window.innerHeight;
  camara.top = ALTO_VISTA / 2;
  camara.bottom = -ALTO_VISTA / 2;
  camara.left = (-ALTO_VISTA * proporcion) / 2;
  camara.right = (ALTO_VISTA * proporcion) / 2;
  camara.updateProjectionMatrix();
}

function colocarCamara(camara, { azimut, objetivo }) {
  const horizontal = Math.cos(ELEVACION) * DISTANCIA;
  camara.position.set(
    objetivo.x + Math.sin(azimut) * horizontal,
    objetivo.y + Math.sin(ELEVACION) * DISTANCIA,
    objetivo.z + Math.cos(azimut) * horizontal,
  );
  camara.lookAt(objetivo);
}

// Arrastre para girar, rueda para zoom (desactivados durante un viaje o en la oficina)
function escucharEventos(elemento, camara, estado) {
  elemento.addEventListener('pointerdown', (evento) => {
    if (evento.button !== 0 || estado.bloqueada) return;
    estado.arrastrando = true;
    estado.ultimoX = evento.clientX;
    estado.velocidad = 0;
    estado.animacion = null;
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
    if (estado.bloqueada) return;
    const factor = Math.exp(-evento.deltaY * 0.0012);
    estado.zoomObjetivo = THREE.MathUtils.clamp(estado.zoomObjetivo * factor, ZOOM_MINIMO, ZOOM_MAXIMO);
    estado.animacion = null;
  }, { passive: false });

  window.addEventListener('resize', () => ajustarProporcion(camara));
}

function actualizarCamara(camara, estado, delta) {
  if (estado.animacion) {
    animar(camara, estado, delta);
  } else if (!estado.bloqueada) {
    if (!estado.arrastrando && Math.abs(estado.velocidad) > 0.00001) {
      estado.azimut += estado.velocidad;
      estado.velocidad *= Math.pow(FRICCION_INERCIA, delta * 60);
    }
    const zoomNuevo = THREE.MathUtils.damp(camara.zoom, estado.zoomObjetivo, SUAVIZADO_ZOOM, delta);
    if (Math.abs(zoomNuevo - camara.zoom) > 0.0001) {
      camara.zoom = zoomNuevo;
      camara.updateProjectionMatrix();
    }
  }
  colocarCamara(camara, estado);
}

// Interpolación con entrada y salida suaves; el zoom se interpola en escala logarítmica
function animar(camara, estado, delta) {
  const animacion = estado.animacion;
  animacion.t = Math.min(animacion.t + delta / animacion.duracion, 1);
  const curva = animacion.t < 0.5 ? 4 * animacion.t ** 3 : 1 - Math.pow(-2 * animacion.t + 2, 3) / 2;

  estado.azimut = THREE.MathUtils.lerp(animacion.desde.azimut, animacion.hasta.azimut, curva);
  estado.objetivo.lerpVectors(animacion.desde.objetivo, animacion.hasta.objetivo, curva);
  camara.zoom = Math.exp(THREE.MathUtils.lerp(Math.log(animacion.desde.zoom), Math.log(animacion.hasta.zoom), curva));
  camara.updateProjectionMatrix();

  if (animacion.t === 1) {
    estado.animacion = null;
    animacion.alTerminar?.();
    if (!estado.bloqueada) estado.zoomObjetivo = camara.zoom;
  }
}
