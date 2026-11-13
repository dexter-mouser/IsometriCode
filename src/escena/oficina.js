import * as THREE from 'three';
import { coloresEscena } from '../datos/tema.js';

const colores = coloresEscena.oficina;
const ANCHO_SALA = 12;
const FONDO_SALA = 10;
const ALTO_SALA = 3.2;
const POSICION_CAMARA = new THREE.Vector3(0, 1.55, 1.6);
const PUNTO_MIRA = new THREE.Vector3(0, 1.1, -5);
const AMPLITUD_BALANCEO = 0.04;

// Oficina genérica low-poly vista desde fuera de la ventana; escena y cámara propias
export function crearOficina() {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(colores.pared);
  const camara = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 60);
  camara.position.copy(POSICION_CAMARA);
  camara.lookAt(PUNTO_MIRA);

  agregarLuces(escena);
  agregarSala(escena);
  agregarPuestos(escena);
  agregarPlantas(escena);
  const animarPersonas = agregarPersonas(escena);
  agregarMarcoVentana(escena);

  window.addEventListener('resize', () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
  });

  // Balanceo leve de la cámara y movimiento de las personas
  const actualizar = (_delta, tiempo) => {
    camara.position.set(
      POSICION_CAMARA.x + Math.sin(tiempo * 0.4) * AMPLITUD_BALANCEO * 4,
      POSICION_CAMARA.y + Math.sin(tiempo * 0.6) * AMPLITUD_BALANCEO,
      POSICION_CAMARA.z,
    );
    camara.lookAt(PUNTO_MIRA);
    animarPersonas(tiempo);
  };

  return { escena, camara, actualizar };
}

// Material mate tipo arcilla
const materiales = new Map();
function material(color) {
  if (!materiales.has(color)) materiales.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  return materiales.get(color);
}

function caja(escala, posicion, color) {
  const malla = new THREE.Mesh(new THREE.BoxGeometry(...escala), material(color));
  malla.position.set(...posicion);
  return malla;
}

function agregarLuces(escena) {
  escena.add(new THREE.HemisphereLight('#ffffff', '#c8b89c', 2.2));
  const ventanal = new THREE.DirectionalLight('#fff4e2', 1.6);
  ventanal.position.set(3, 4, 6);
  escena.add(ventanal);
}

// Piso, paredes, techo y lámparas de panel
function agregarSala(escena) {
  escena.add(
    caja([ANCHO_SALA, 0.1, FONDO_SALA], [0, -0.05, -FONDO_SALA / 2], colores.piso),
    caja([ANCHO_SALA, 0.1, FONDO_SALA], [0, ALTO_SALA, -FONDO_SALA / 2], colores.techo),
    caja([ANCHO_SALA, ALTO_SALA, 0.1], [0, ALTO_SALA / 2, -FONDO_SALA], colores.pared),
    caja([0.1, ALTO_SALA, FONDO_SALA], [-ANCHO_SALA / 2, ALTO_SALA / 2, -FONDO_SALA / 2], colores.pared),
    caja([0.1, ALTO_SALA, FONDO_SALA], [ANCHO_SALA / 2, ALTO_SALA / 2, -FONDO_SALA / 2], colores.pared),
  );

  const lampara = new THREE.MeshBasicMaterial({ color: colores.lampara });
  for (const x of [-3, 0, 3]) {
    for (const z of [-2.5, -6]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.6), lampara);
      panel.position.set(x, ALTO_SALA - 0.07, z);
      escena.add(panel);
    }
  }

  // Cuadro y pizarra en la pared del fondo
  escena.add(
    caja([2.4, 1.2, 0.05], [-2.5, 1.7, -FONDO_SALA + 0.08], '#ffffff'),
    caja([1.2, 0.8, 0.05], [2.8, 1.8, -FONDO_SALA + 0.08], coloresEscena.vidrioVerde),
  );
}

// Escritorio con monitor y silla
function crearPuesto(x, z, giro) {
  const puesto = new THREE.Group();
  puesto.add(
    caja([1.5, 0.05, 0.75], [0, 0.74, 0], colores.escritorio),
    caja([0.05, 0.72, 0.65], [-0.68, 0.36, 0], colores.patas),
    caja([0.05, 0.72, 0.65], [0.68, 0.36, 0], colores.patas),
    caja([0.55, 0.34, 0.04], [0, 1.0, -0.22], colores.monitor),
    caja([0.5, 0.29, 0.01], [0, 1.0, -0.198], colores.pantalla),
    caja([0.06, 0.18, 0.06], [0, 0.83, -0.24], colores.monitor),
    caja([0.42, 0.02, 0.14], [0, 0.775, 0.05], '#d7d9dc'),
    caja([0.48, 0.08, 0.45], [0, 0.46, 0.55], colores.silla),
    caja([0.48, 0.5, 0.06], [0, 0.75, 0.8], colores.silla),
    caja([0.06, 0.42, 0.06], [0, 0.21, 0.55], colores.patas),
  );
  puesto.position.set(x, 0, z);
  puesto.rotation.y = giro;
  return puesto;
}

// Dos filas de puestos enfrentados
function agregarPuestos(escena) {
  for (const x of [-3.4, -1.7, 1.7, 3.4]) {
    escena.add(crearPuesto(x, -3.4, 0), crearPuesto(x, -5.2, Math.PI));
  }
}

function crearPlanta(x, z, tamano) {
  const planta = new THREE.Group();
  const hojas = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 * tamano, 0), new THREE.MeshStandardMaterial({ color: colores.hojas, roughness: 0.9, flatShading: true }));
  hojas.position.y = 0.75 * tamano;
  hojas.scale.y = 1.3;
  planta.add(caja([0.4 * tamano, 0.45 * tamano, 0.4 * tamano], [0, 0.22 * tamano, 0], colores.maceta), hojas);
  planta.position.set(x, 0, z);
  return planta;
}

function agregarPlantas(escena) {
  escena.add(crearPlanta(-5.3, -8.8, 1.4), crearPlanta(5.3, -8.8, 1.2), crearPlanta(0, -7.6, 1), crearPlanta(-5.3, -1.2, 1.1));
}

// Persona estilo arcilla: cuerpo en cápsula, cabeza esférica y cabello redondeado
function crearPersona({ cabello, camisa, pantalon, sentada }) {
  const persona = new THREE.Group();
  const alturaCadera = sentada ? 0.5 : 0.85;
  const piernas = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, sentada ? 0.3 : 0.6, 4, 8), material(pantalon));
  if (sentada) {
    piernas.rotation.x = Math.PI / 2;
    piernas.position.set(0, alturaCadera, -0.2);
  } else {
    piernas.position.y = alturaCadera / 2 + 0.05;
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 4, 10), material(camisa));
  torso.position.y = alturaCadera + 0.38;
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), material(colores.piel));
  cabeza.position.y = alturaCadera + 0.85;
  const pelo = new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), material(cabello));
  pelo.position.y = cabeza.position.y + 0.02;
  pelo.rotation.x = 0.25;

  persona.add(piernas, torso, cabeza, pelo);
  persona.userData.cabeza = [cabeza, pelo];
  return persona;
}

function agregarPersonas(escena) {
  const personas = [
    { x: -1.7, z: -2.8, giro: Math.PI, sentada: true },
    { x: 3.4, z: -5.8, giro: 0, sentada: true },
    { x: 0.4, z: -2.2, giro: -0.6, sentada: false },
  ].map((datos, indice) => {
    const persona = crearPersona({
      cabello: colores.cabello[indice % colores.cabello.length],
      camisa: colores.camisa[indice % colores.camisa.length],
      pantalon: colores.pantalon[indice % colores.pantalon.length],
      sentada: datos.sentada,
    });
    persona.position.set(datos.x, 0, datos.z);
    persona.rotation.y = datos.giro;
    escena.add(persona);
    return persona;
  });

  return (tiempo) => {
    personas.forEach((persona, indice) => {
      const giroCabeza = Math.sin(tiempo * 0.8 + indice * 2) * 0.25;
      for (const parte of persona.userData.cabeza) parte.rotation.y = giroCabeza;
      persona.position.y = Math.abs(Math.sin(tiempo * 1.2 + indice)) * 0.015;
    });
  };
}

// Fachada con el hueco de la ventana, marco y vidrio en primer plano:
// la oficina se ve "a través" de la ventana tocada
function agregarMarcoVentana(escena) {
  const zFachada = 0.65;
  const ancho = 1.15;
  const alto = 0.78;
  const centro = new THREE.Vector3(0, 1.45, zFachada);
  const grosor = 0.05;
  const muro = 6;

  escena.add(
    caja([muro, muro, grosor], [centro.x - ancho / 2 - muro / 2, centro.y, zFachada], coloresEscena.fachada),
    caja([muro, muro, grosor], [centro.x + ancho / 2 + muro / 2, centro.y, zFachada], coloresEscena.fachada),
    caja([ancho, muro, grosor], [centro.x, centro.y + alto / 2 + muro / 2, zFachada], coloresEscena.fachada),
    caja([ancho, muro, grosor], [centro.x, centro.y - alto / 2 - muro / 2, zFachada], coloresEscena.fachada),
    caja([0.03, alto, 0.06], [centro.x - ancho / 2, centro.y, zFachada - 0.02], colores.marco),
    caja([0.03, alto, 0.06], [centro.x + ancho / 2, centro.y, zFachada - 0.02], colores.marco),
    caja([ancho, 0.03, 0.06], [centro.x, centro.y + alto / 2, zFachada - 0.02], colores.marco),
    caja([ancho + 0.08, 0.04, 0.12], [centro.x, centro.y - alto / 2, zFachada - 0.03], colores.marco),
  );

  const vidrio = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, alto),
    new THREE.MeshBasicMaterial({ color: colores.vidrio, transparent: true, opacity: 0.12, depthWrite: false }),
  );
  vidrio.position.set(centro.x, centro.y, zFachada - 0.04);
  escena.add(vidrio);
}
