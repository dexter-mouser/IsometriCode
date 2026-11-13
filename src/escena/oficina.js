import * as THREE from 'three';
import { coloresEscena } from '../datos/tema.js';
import { crearAleatorio } from './utilidades.js';

const colores = coloresEscena.oficina;
const coloresControl = coloresEscena.control;
const ANCHO_SALA = 12;
const FONDO_SALA = 10;
const ALTO_SALA = 3.2;
const POSICION_CAMARA = new THREE.Vector3(0, 1.55, 1.6);
const PUNTO_MIRA = new THREE.Vector3(0, 1.1, -5);
const AMPLITUD_BALANCEO = 0.04;
const INTENSIDAD_LUZ = 2.2;
const INTENSIDAD_LUZ_CONTROL = 0.9;

// Interiores vistos a través de una ventana: varios diseños de oficina y la sala de control.
// Escena y cámara propias; mostrarDiseno elige cuál se ve.
export function crearOficina() {
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 60);
  const luces = agregarLuces(escena);
  const sala = agregarSala(escena);
  const personas = [];

  const disenos = {
    abierta: crearAbierta(personas),
    juntas: crearJuntas(personas),
    privada: crearPrivada(personas),
    descanso: crearDescanso(personas),
    control: crearControl(personas),
  };
  for (const grupo of Object.values(disenos)) escena.add(grupo);
  agregarMarcoVentana(escena);

  // Muestra un diseño; la semilla (id del piso o la ventana) varía colores de muebles,
  // pared de acento, piso y qué personas están presentes
  const mostrarDiseno = (nombre, semilla = '') => {
    const diseno = disenos[nombre] ? nombre : 'abierta';
    for (const [clave, grupo] of Object.entries(disenos)) grupo.visible = clave === diseno;
    const esControl = diseno === 'control';
    const aleatorio = crearAleatorio(numeroDeSemilla(semilla));
    const elegir = (lista) => lista[Math.floor(aleatorio() * lista.length)];
    for (const [clave, materialVariable] of Object.entries(materialesVariables)) materialVariable.color.set(elegir(colores.variantes[clave]));
    escena.background = new THREE.Color(esControl ? coloresControl.fondo : colores.pared);
    sala.pared.color.set(esControl ? coloresControl.pared : colores.pared);
    sala.paredFondo.color.set(esControl ? coloresControl.pared : elegir(colores.variantes.acento));
    sala.piso.color.set(esControl ? colores.pisos.control : elegir(colores.variantes.piso));
    for (const persona of disenos[diseno].userData.personas ?? []) persona.visible = aleatorio() < 0.8;
    sala.lamparas.visible = !esControl;
    luces.ambiente.intensity = esControl ? INTENSIDAD_LUZ_CONTROL : INTENSIDAD_LUZ;
  };
  mostrarDiseno('abierta');

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
    personas.forEach((persona, indice) => {
      const giroCabeza = Math.sin(tiempo * 0.8 + indice * 2) * 0.25;
      for (const parte of persona.userData.cabeza) parte.rotation.y = giroCabeza;
      persona.position.y = Math.abs(Math.sin(tiempo * 1.2 + indice)) * 0.015;
    });
  };

  // Tarde: la luz que entra por la ventana se vuelve cálida
  const colorDia = new THREE.Color('#fff4e2');
  const colorTarde = new THREE.Color(coloresEscena.ambientes.tarde.sol);
  const establecerTarde = (valor) => {
    luces.ventanal.color.copy(colorDia).lerp(colorTarde, valor);
  };

  return { escena, camara, actualizar, mostrarDiseno, establecerTarde };
}

// Materiales mates tipo arcilla (compartidos por color) y pantallas que brillan.
// Los colores 'var:...' usan un material cuyo color cambia en cada oficina.
const materialesVariables = {
  silla: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
  sofa: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
  madera: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
};
const materiales = new Map();
function material(color) {
  if (color.startsWith('var:')) return materialesVariables[color.slice(4)];
  if (!materiales.has(color)) materiales.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  return materiales.get(color);
}

function caja(escala, posicion, color, giro = 0) {
  const malla = new THREE.Mesh(new THREE.BoxGeometry(...escala), material(color));
  malla.position.set(...posicion);
  malla.rotation.y = giro;
  return malla;
}

function pantalla(escala, posicion, color) {
  const malla = new THREE.Mesh(new THREE.BoxGeometry(...escala), new THREE.MeshBasicMaterial({ color }));
  malla.position.set(...posicion);
  return malla;
}

function agregarLuces(escena) {
  const ambiente = new THREE.HemisphereLight('#ffffff', '#c8b89c', INTENSIDAD_LUZ);
  const ventanal = new THREE.DirectionalLight('#fff4e2', 1.6);
  ventanal.position.set(3, 4, 6);
  escena.add(ambiente, ventanal);
  return { ambiente, ventanal };
}

// Piso, paredes, techo y lámparas; paredes y piso con material propio para cambiar de color
function agregarSala(escena) {
  const pared = new THREE.MeshStandardMaterial({ color: colores.pared, roughness: 0.9 });
  const paredFondo = new THREE.MeshStandardMaterial({ color: colores.pared, roughness: 0.9 });
  const piso = new THREE.MeshStandardMaterial({ color: colores.piso, roughness: 0.9 });
  const muro = (escala, posicion) => {
    const malla = new THREE.Mesh(new THREE.BoxGeometry(...escala), pared);
    malla.position.set(...posicion);
    return malla;
  };
  const suelo = new THREE.Mesh(new THREE.BoxGeometry(ANCHO_SALA, 0.1, FONDO_SALA), piso);
  const muroFondo = new THREE.Mesh(new THREE.BoxGeometry(ANCHO_SALA, ALTO_SALA, 0.1), paredFondo);
  muroFondo.position.set(0, ALTO_SALA / 2, -FONDO_SALA);
  suelo.position.set(0, -0.05, -FONDO_SALA / 2);

  escena.add(
    suelo,
    caja([ANCHO_SALA, 0.1, FONDO_SALA], [0, ALTO_SALA, -FONDO_SALA / 2], colores.techo),
    muroFondo,
    muro([0.1, ALTO_SALA, FONDO_SALA], [-ANCHO_SALA / 2, ALTO_SALA / 2, -FONDO_SALA / 2]),
    muro([0.1, ALTO_SALA, FONDO_SALA], [ANCHO_SALA / 2, ALTO_SALA / 2, -FONDO_SALA / 2]),
  );

  const lamparas = new THREE.Group();
  const luzPanel = new THREE.MeshBasicMaterial({ color: colores.lampara });
  for (const x of [-3, 0, 3]) {
    for (const z of [-2.5, -6]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.6), luzPanel);
      panel.position.set(x, ALTO_SALA - 0.07, z);
      lamparas.add(panel);
    }
  }
  escena.add(lamparas);
  return { pared, paredFondo, piso, lamparas };
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

// Persona estilo arcilla: piernas, torso y brazos en cápsula, cabeza esférica y cabello
function crearPersona({ cabello, camisa, pantalon, sentada }) {
  const persona = new THREE.Group();
  const alturaCadera = sentada ? 0.5 : 0.85;

  for (const lado of [-1, 1]) {
    const pierna = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, sentada ? 0.3 : 0.66, 4, 8), material(pantalon));
    const zapato = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), material(colores.zapato));
    zapato.scale.set(1, 0.6, 1.5);
    if (sentada) {
      pierna.rotation.x = Math.PI / 2;
      pierna.position.set(lado * 0.09, alturaCadera, -0.22);
      zapato.position.set(lado * 0.09, 0.05, -0.42);
    } else {
      pierna.position.set(lado * 0.09, 0.44, 0);
      zapato.position.set(lado * 0.09, 0.05, -0.04);
    }
    persona.add(pierna, zapato);
  }

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.36, 4, 10), material(camisa));
  torso.position.y = alturaCadera + 0.36;
  for (const lado of [-1, 1]) {
    const brazo = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), material(camisa));
    brazo.position.set(lado * 0.25, alturaCadera + 0.36, sentada ? -0.08 : 0);
    brazo.rotation.set(sentada ? -0.7 : 0, 0, lado * 0.12);
    persona.add(brazo);
  }
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), material(colores.piel));
  cabeza.position.y = alturaCadera + 0.85;
  const pelo = new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), material(cabello));
  pelo.position.y = cabeza.position.y + 0.02;
  pelo.rotation.x = 0.25;

  persona.add(torso, cabeza, pelo);
  persona.userData.cabeza = [cabeza, pelo];
  return persona;
}

// Agrega personas a un grupo: [x, z, giro, sentada]
function agregarPersonas(grupo, personas, lista) {
  lista.forEach(([x, z, giro, sentada], indice) => {
    const persona = crearPersona({
      cabello: colores.cabello[(indice + personas.length) % colores.cabello.length],
      camisa: colores.camisa[(indice + personas.length) % colores.camisa.length],
      pantalon: colores.pantalon[(indice + personas.length) % colores.pantalon.length],
      sentada,
    });
    persona.position.set(x, 0, z);
    persona.rotation.y = giro;
    grupo.add(persona);
    personas.push(persona);
    grupo.userData.personas = [...(grupo.userData.personas ?? []), persona];
  });
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
    caja([0.48, 0.08, 0.45], [0, 0.46, 0.55], 'var:silla'),
    caja([0.48, 0.5, 0.06], [0, 0.75, 0.8], 'var:silla'),
    caja([0.06, 0.42, 0.06], [0, 0.21, 0.55], colores.patas),
  );
  puesto.position.set(x, 0, z);
  puesto.rotation.y = giro;
  return puesto;
}

// Open space: dos filas de puestos enfrentados
function crearAbierta(personas) {
  const grupo = new THREE.Group();
  for (const x of [-3.4, -1.7, 1.7, 3.4]) grupo.add(crearPuesto(x, -3.4, 0), crearPuesto(x, -5.2, Math.PI));
  grupo.add(
    caja([2.4, 1.2, 0.05], [-2.5, 1.7, -FONDO_SALA + 0.08], '#ffffff'),
    caja([1.2, 0.8, 0.05], [2.8, 1.8, -FONDO_SALA + 0.08], coloresEscena.vidrioVerde),
    crearPlanta(-5.3, -8.8, 1.4), crearPlanta(5.3, -8.8, 1.2), crearPlanta(0, -7.6, 1), crearPlanta(-5.3, -1.2, 1.1),
  );
  agregarPersonas(grupo, personas, [[-1.7, -2.8, Math.PI, true], [3.4, -5.8, 0, true], [0.4, -2.2, -0.6, false]]);
  return grupo;
}

// Sala de juntas: mesa larga, sillas, gran pantalla en la pared del fondo
function crearJuntas(personas) {
  const grupo = new THREE.Group();
  grupo.add(
    caja([5.2, 0.08, 1.7], [0, 0.74, -5.2], 'var:madera'),
    caja([0.3, 0.7, 1], [-1.8, 0.35, -5.2], colores.patas),
    caja([0.3, 0.7, 1], [1.8, 0.35, -5.2], colores.patas),
    caja([3.4, 1.9, 0.08], [0, 1.65, -FONDO_SALA + 0.1], colores.monitor),
    pantalla([3.2, 1.75, 0.02], [0, 1.65, -FONDO_SALA + 0.15], colores.pantallaJuntas),
    caja([1.6, 1.1, 0.04], [4.4, 1.6, -FONDO_SALA + 0.08], '#ffffff'),
    crearPlanta(-5.3, -8.8, 1.5), crearPlanta(5.3, -1.5, 1.2),
  );
  for (const x of [-2, -1, 0, 1, 2]) {
    for (const lado of [-1, 1]) {
      grupo.add(caja([0.5, 0.5, 0.06], [x, 0.75, -5.2 + lado * 1.25], 'var:silla'), caja([0.48, 0.08, 0.45], [x, 0.46, -5.2 + lado * 1.05], 'var:silla'));
    }
  }
  agregarPersonas(grupo, personas, [[-1, -4.15, Math.PI, true], [1, -4.15, Math.PI, true], [0, -6.25, 0, true], [2, -6.25, 0, true], [-3, -3.2, -0.4, false]]);
  return grupo;
}

// Oficina privada: escritorio ejecutivo, biblioteca, sofá y mesa de centro
function crearPrivada(personas) {
  const grupo = new THREE.Group();
  grupo.add(
    caja([2.4, 0.08, 1], [1.2, 0.76, -6], 'var:madera'),
    caja([2.3, 0.7, 0.9], [1.2, 0.36, -6.05], colores.estante),
    caja([0.6, 0.38, 0.04], [1.2, 1.02, -6.35], colores.monitor),
    caja([0.55, 0.9, 0.55], [1.2, 0.5, -7], 'var:silla'),
    caja([4.6, 2.2, 0.45], [-1.8, 1.1, -FONDO_SALA + 0.3], colores.estante),
    caja([2.4, 0.03, 1.8], [-3.2, 0.015, -3.4], 'var:sofa'),
    caja([2.2, 0.45, 0.8], [-3.6, 0.3, -4.4], 'var:sofa'),
    caja([2.2, 0.55, 0.2], [-3.6, 0.55, -4.75], 'var:sofa'),
    caja([1, 0.35, 0.6], [-3.6, 0.2, -3.2], 'var:madera'),
    crearPlanta(5.2, -8.8, 1.5), crearPlanta(-5.3, -1.6, 1.2),
  );
  // Libros de colores en la biblioteca
  for (let fila = 0; fila < 3; fila++) {
    for (let libro = 0; libro < 9; libro++) {
      const color = colores.camisa[(fila + libro) % colores.camisa.length];
      grupo.add(caja([0.18, 0.4, 0.3], [-3.8 + libro * 0.48, 0.55 + fila * 0.65, -FONDO_SALA + 0.55], color));
    }
  }
  agregarPersonas(grupo, personas, [[1.2, -6.9, Math.PI, true]]);
  return grupo;
}

// Zona de descanso: cocineta, sofás, puffs y mesa de ping-pong
function crearDescanso(personas) {
  const grupo = new THREE.Group();
  grupo.add(
    caja([5, 0.95, 0.7], [-2.5, 0.48, -FONDO_SALA + 0.4], colores.cocina),
    caja([5, 0.06, 0.75], [-2.5, 0.98, -FONDO_SALA + 0.4], 'var:madera'),
    caja([0.8, 2, 0.7], [0.6, 1, -FONDO_SALA + 0.4], '#e6e8ea'),
    caja([2.6, 0.45, 0.9], [2.6, 0.3, -3.2], 'var:sofa'),
    caja([2.6, 0.5, 0.2], [2.6, 0.55, -2.8], 'var:sofa'),
    caja([1.2, 0.35, 0.7], [2.6, 0.2, -4.3], 'var:madera'),
    caja([2.7, 0.08, 1.5], [-2.2, 0.76, -4.6], '#2f7a58'),
    caja([0.03, 0.15, 1.5], [-2.2, 0.86, -4.6], '#ffffff'),
    caja([2.4, 0.7, 1.2], [-2.2, 0.36, -4.6], colores.patas),
    crearPlanta(5.3, -8.8, 1.6), crearPlanta(-5.3, -2, 1.4), crearPlanta(4.8, -6.5, 1),
  );
  for (const [x, z, color] of [[4.4, -5, colores.camisa[0]], [3.4, -5.6, colores.camisa[1]]]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), material(color));
    puff.scale.y = 0.6;
    puff.position.set(x, 0.25, z);
    grupo.add(puff);
  }
  agregarPersonas(grupo, personas, [[-3.2, -8.6, Math.PI, false], [2.2, -3.1, Math.PI, true], [-2.2, -3.4, Math.PI, false]]);
  return grupo;
}

// Sala de control: muro de pantallas, consolas en dos filas y operadores
function crearControl(personas) {
  const grupo = new THREE.Group();
  const filas = 3;
  const columnas = 6;
  for (let fila = 0; fila < filas; fila++) {
    for (let columna = 0; columna < columnas; columna++) {
      const color = coloresControl.pantallas[(fila * 2 + columna) % coloresControl.pantallas.length];
      grupo.add(
        caja([1.5, 0.82, 0.06], [-3.9 + columna * 1.56, 0.85 + fila * 0.86, -FONDO_SALA + 0.12], coloresControl.consola),
        pantalla([1.4, 0.74, 0.02], [-3.9 + columna * 1.56, 0.85 + fila * 0.86, -FONDO_SALA + 0.16], color),
      );
    }
  }
  for (const [z, ancho] of [[-6.2, 7], [-3.8, 5.4]]) {
    grupo.add(caja([ancho, 0.8, 0.8], [0, 0.4, z], coloresControl.consola));
    for (let indice = 0; indice < Math.floor(ancho / 1.1); indice++) {
      const x = -ancho / 2 + 0.55 + indice * 1.1;
      grupo.add(
        caja([0.6, 0.38, 0.05], [x, 1.02, z - 0.25], colores.monitor),
        pantalla([0.55, 0.33, 0.01], [x, 1.02, z - 0.22], coloresControl.pantallas[indice % coloresControl.pantallas.length]),
      );
    }
  }
  agregarPersonas(grupo, personas, [[-1.6, -5.5, Math.PI, true], [1.1, -5.5, Math.PI, true], [-0.6, -3.1, Math.PI, true], [2.6, -2.4, -0.5, false]]);
  return grupo;
}

// Fachada con el hueco de la ventana, marco y vidrio en primer plano:
// el interior se ve "a través" de la ventana tocada
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

// Número estable a partir de un texto
function numeroDeSemilla(texto) {
  let hash = 7;
  for (const caracter of String(texto)) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
  return hash;
}
