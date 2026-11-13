import * as THREE from 'three';
import { MITAD_TERRENO } from '../datos/ciudad.js';

const ELEVACION = THREE.MathUtils.degToRad(35);
const AZIMUT_INICIAL = THREE.MathUtils.degToRad(45);
const DISTANCIA = 160;
const ALTO_VISTA = 114;
const OBJETIVO_INICIAL = new THREE.Vector3(0, -3, 0);
export const ZOOM_MINIMO = 0.8;
export const ZOOM_MAXIMO = 4;
export const ZOOM_PREDETERMINADO = 1;
const SENSIBILIDAD_GIRO = 0.006;
const FRICCION_INERCIA = 0.9;
const SUAVIZADO_ZOOM = 10;
const PASO_RUEDA = 0.0015;
const DURACION_REINICIO = 0.8;
const DURACION_VIAJE = 1.2;
const BOTON_IZQUIERDO = 0;
const BOTON_CENTRAL = 1;
const BOTON_DERECHO = 2;

const sueloPlano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const rayo = new THREE.Raycaster();

// Cámara ortográfica isométrica: gira con clic izquierdo, desplaza con clic derecho,
// zoom hacia el cursor y viajes animados a un punto del edificio
export function crearCamara(elementoEventos) {
  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 500);
  const estado = {
    azimut: AZIMUT_INICIAL,
    objetivo: OBJETIVO_INICIAL.clone(),
    velocidad: 0,
    zoomObjetivo: ZOOM_PREDETERMINADO,
    ancla: new THREE.Vector2(0, 0),
    arrastre: null,
    animacion: null,
    bloqueada: false,
    vistasGuardadas: [],
    alCambiarZoom: [],
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
    animarHacia({ azimut: AZIMUT_INICIAL, objetivo: OBJETIVO_INICIAL, zoom: ZOOM_PREDETERMINADO }, DURACION_REINICIO);
  };

  // Viaja a un punto; con normal gira de frente a esa dirección. Guarda la vista para volver.
  const viajarA = ({ posicion, normal, zoom, bloquear = true }, alTerminar) => {
    estado.vistasGuardadas.push({ azimut: estado.azimut, objetivo: estado.objetivo.clone(), zoom: camara.zoom, bloqueada: estado.bloqueada });
    estado.bloqueada = bloquear;
    const azimut = normal ? Math.atan2(normal[0], normal[1]) : estado.azimut;
    animarHacia({ azimut, objetivo: new THREE.Vector3(...posicion), zoom }, DURACION_VIAJE, alTerminar);
  };

  // Regresa a la vista guardada en el último viaje
  const volver = (alTerminar) => {
    const vista = estado.vistasGuardadas.pop() ?? { azimut: AZIMUT_INICIAL, objetivo: OBJETIVO_INICIAL, zoom: ZOOM_PREDETERMINADO, bloqueada: false };
    estado.bloqueada = true;
    animarHacia(vista, DURACION_VIAJE, () => {
      estado.bloqueada = vista.bloqueada;
      estado.zoomObjetivo = camara.zoom;
      alTerminar?.();
    });
  };

  // Zoom desde la barra o los botones (hacia el centro de la pantalla)
  const establecerZoom = (valor) => {
    if (estado.bloqueada) return;
    estado.ancla.set(0, 0);
    estado.zoomObjetivo = THREE.MathUtils.clamp(valor, ZOOM_MINIMO, ZOOM_MAXIMO);
    estado.animacion = null;
  };

  const alCambiarZoom = (funcion) => estado.alCambiarZoom.push(funcion);
  const actualizar = (delta) => actualizarCamara(camara, estado, delta);
  return { camara, actualizar, reiniciar, viajarA, volver, establecerZoom, alCambiarZoom, estaBloqueada: () => estado.bloqueada };
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
  camara.updateMatrixWorld();
}

// Punto del suelo (y = 0) bajo una posición de pantalla en coordenadas normalizadas
function puntoEnSuelo(camara, ndc) {
  rayo.setFromCamera(ndc, camara);
  return rayo.ray.intersectPlane(sueloPlano, new THREE.Vector3());
}

const aNormalizadas = (evento) => new THREE.Vector2(
  (evento.clientX / window.innerWidth) * 2 - 1,
  -(evento.clientY / window.innerHeight) * 2 + 1,
);

// Mantiene el objetivo dentro del bloque de tierra
function limitarObjetivo(objetivo) {
  const limite = MITAD_TERRENO - 2;
  objetivo.x = THREE.MathUtils.clamp(objetivo.x, -limite, limite);
  objetivo.z = THREE.MathUtils.clamp(objetivo.z, -limite, limite);
}

// Desplaza el objetivo para que el punto del suelo bajo "desde" quede bajo "hasta"
function desplazarEntre(camara, estado, desde, hasta) {
  const puntoDesde = puntoEnSuelo(camara, desde);
  const puntoHasta = puntoEnSuelo(camara, hasta);
  if (!puntoDesde || !puntoHasta) return;
  estado.objetivo.add(puntoDesde.sub(puntoHasta));
  limitarObjetivo(estado.objetivo);
  colocarCamara(camara, estado);
}

// Clic izquierdo gira, clic derecho o central desplaza, rueda acerca hacia el cursor
function escucharEventos(elemento, camara, estado) {
  elemento.addEventListener('contextmenu', (evento) => evento.preventDefault());

  elemento.addEventListener('pointerdown', (evento) => {
    if (estado.bloqueada) return;
    const esGiro = evento.button === BOTON_IZQUIERDO;
    const esDesplazamiento = evento.button === BOTON_DERECHO || evento.button === BOTON_CENTRAL;
    if (!esGiro && !esDesplazamiento) return;
    estado.arrastre = { tipo: esGiro ? 'giro' : 'desplazamiento', x: evento.clientX, ndc: aNormalizadas(evento) };
    estado.velocidad = 0;
    estado.animacion = null;
    elemento.setPointerCapture(evento.pointerId);
  });

  elemento.addEventListener('pointermove', (evento) => {
    const arrastre = estado.arrastre;
    if (!arrastre) return;
    if (arrastre.tipo === 'giro') {
      const giro = (evento.clientX - arrastre.x) * SENSIBILIDAD_GIRO;
      arrastre.x = evento.clientX;
      estado.azimut -= giro;
      estado.velocidad = -giro;
    } else {
      const actual = aNormalizadas(evento);
      desplazarEntre(camara, estado, arrastre.ndc, actual);
      arrastre.ndc = actual;
    }
  });

  const soltar = () => { estado.arrastre = null; };
  elemento.addEventListener('pointerup', soltar);
  elemento.addEventListener('pointercancel', soltar);

  elemento.addEventListener('wheel', (evento) => {
    evento.preventDefault();
    if (estado.bloqueada) return;
    estado.ancla.copy(aNormalizadas(evento));
    const factor = Math.exp(-evento.deltaY * PASO_RUEDA);
    estado.zoomObjetivo = THREE.MathUtils.clamp(estado.zoomObjetivo * factor, ZOOM_MINIMO, ZOOM_MAXIMO);
    estado.animacion = null;
  }, { passive: false });

  window.addEventListener('resize', () => ajustarProporcion(camara));
}

// Cambia el zoom manteniendo fijo el punto del suelo bajo el ancla
function aplicarZoom(camara, estado, zoomNuevo) {
  const antes = puntoEnSuelo(camara, estado.ancla);
  camara.zoom = zoomNuevo;
  camara.updateProjectionMatrix();
  const despues = puntoEnSuelo(camara, estado.ancla);
  if (antes && despues) {
    estado.objetivo.add(antes.sub(despues));
    limitarObjetivo(estado.objetivo);
  }
}

function actualizarCamara(camara, estado, delta) {
  const zoomAnterior = camara.zoom;
  if (estado.animacion) {
    animar(camara, estado, delta);
  } else if (!estado.bloqueada) {
    if (estado.arrastre?.tipo !== 'giro' && Math.abs(estado.velocidad) > 0.00001) {
      estado.azimut += estado.velocidad;
      estado.velocidad *= Math.pow(FRICCION_INERCIA, delta * 60);
    }
    const zoomNuevo = THREE.MathUtils.damp(camara.zoom, estado.zoomObjetivo, SUAVIZADO_ZOOM, delta);
    if (Math.abs(zoomNuevo - camara.zoom) > 0.0001) aplicarZoom(camara, estado, zoomNuevo);
  }
  colocarCamara(camara, estado);
  if (Math.abs(camara.zoom - zoomAnterior) > 0.0001) {
    for (const funcion of estado.alCambiarZoom) funcion(camara.zoom);
  }
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
    estado.zoomObjetivo = camara.zoom;
    animacion.alTerminar?.();
  }
}
