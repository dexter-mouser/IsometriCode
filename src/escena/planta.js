import * as THREE from 'three';
import { disenosOficina, ordenDisenos, plantaPiso } from '../datos/oficinas.js';
import { coloresEscena } from '../datos/tema.js';
import { crearAleatorio, entre, pintarGeometria, unirGeometrias } from './utilidades.js';

const colores = coloresEscena.oficina;
const NIVEL_HOVER = 1;
const NIVEL_SELECCION = 2;
const colorResaltado = new THREE.Color(coloresEscena.resaltado);

// Escala de los muebles (1 unidad ≈ 4,5 m)
const ALTO_MESA = 0.17;
const ALTO_PERSONA = 0.38;

// Construye la planta de un piso: oficinas clicables a ambos lados de un pasillo
export function crearPlanta(torre, numeroPiso, yPiso) {
  const grupo = new THREE.Group();
  grupo.position.y = yPiso;
  const aleatorio = crearAleatorio(numeroPiso * 97 + torre.x * 13);

  const { inicio, fin } = tramoUtil(torre);
  const largoOficina = (fin - inicio) / plantaPiso.oficinasPorLado;
  const fondoOficina = (torre.ancho - 0.2 - plantaPiso.anchoPasillo) / 2;
  const clicables = [];
  // Paleta de muebles propia de este piso
  const elegir = (lista) => lista[Math.floor(aleatorio() * lista.length)];
  const paleta = { silla: elegir(colores.variantes.silla), sofa: elegir(colores.variantes.sofa), madera: elegir(colores.variantes.madera) };

  // Pasillo y recepción junto al volumen de vidrio
  grupo.add(crearMallaSimple([
    caja([fin - inicio, 0.03, plantaPiso.anchoPasillo], [(inicio + fin) / 2, 0.015, 0], colores.pasillo),
    ...crearRecepcion(torre),
  ]));

  let numero = 0;
  for (const lado of [1, -1]) {
    for (let indice = 0; indice < plantaPiso.oficinasPorLado; indice++) {
      numero++;
      const diseno = ordenDisenos[(numeroPiso + numero) % ordenDisenos.length];
      const centro = [inicio + (indice + 0.5) * largoOficina, lado * (plantaPiso.anchoPasillo / 2 + fondoOficina / 2)];
      const elemento = {
        id: `${torre.id}/piso-${numeroPiso}/oficina-${numero}`,
        tipo: 'oficina',
        nombre: `${torre.nombre} · Piso ${numeroPiso} · ${disenosOficina[diseno].nombre} ${numero}`,
        diseno,
      };
      const malla = crearOficinaPlanta({ diseno, largo: largoOficina, fondo: fondoOficina, lado, aleatorio, paleta });
      malla.position.set(centro[0], 0, centro[1]);
      registrarClicable(malla, elemento);
      grupo.add(malla);
      clicables.push(malla);
    }
  }

  const liberar = () => grupo.traverse((objeto) => {
    if (objeto.isMesh) {
      objeto.geometry.dispose();
      objeto.material.dispose();
    }
  });
  return { grupo, clicables, liberar };
}

// Tramo en x ocupado por oficinas (sin el extremo del volumen de vidrio)
function tramoUtil(torre) {
  const extremo = torre.volumenVidrio.extremo;
  const inicio = torre.x - torre.largo / 2 + (extremo < 0 ? plantaPiso.largoRecepcion : 0.1);
  const fin = torre.x + torre.largo / 2 - (extremo > 0 ? plantaPiso.largoRecepcion : 0.1);
  return { inicio, fin };
}

function crearRecepcion(torre) {
  const extremo = torre.volumenVidrio.extremo;
  const x = torre.x + extremo * (torre.largo / 2 - plantaPiso.largoRecepcion / 2);
  return [
    caja([plantaPiso.largoRecepcion, 0.03, torre.ancho - 0.2], [x, 0.015, 0], colores.pasillo),
    caja([0.3, ALTO_MESA, 1.6], [x, ALTO_MESA / 2, 0], colores.escritorio),
    ...persona([x - extremo * 0.35, 0, 0.4], colores.camisa[0], colores.cabello[0]),
  ];
}

// Caja con color por vértice
function caja(escala, posicion, color) {
  return pintarGeometria(new THREE.BoxGeometry(...escala).translate(...posicion), color);
}

function crearMallaSimple(piezas) {
  return new THREE.Mesh(unirGeometrias(piezas), new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true }));
}

// Persona simple: cuerpo y cabeza
function persona([x, y, z], colorCuerpo, colorCabello) {
  const cuerpo = pintarGeometria(new THREE.CylinderGeometry(0.045, 0.055, ALTO_PERSONA * 0.7, 6).translate(x, y + ALTO_PERSONA * 0.35, z), colorCuerpo);
  const cabeza = pintarGeometria(new THREE.SphereGeometry(0.05, 8, 6).translate(x, y + ALTO_PERSONA * 0.82, z), colores.piel);
  const cabello = pintarGeometria(new THREE.SphereGeometry(0.053, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, y + ALTO_PERSONA * 0.84, z), colorCabello);
  return [cuerpo, cabeza, cabello];
}

function planta([x, z], tamano = 1) {
  return [
    caja([0.1 * tamano, 0.1 * tamano, 0.1 * tamano], [x, 0.05 * tamano, z], colores.maceta),
    pintarGeometria(new THREE.IcosahedronGeometry(0.11 * tamano, 0).translate(x, 0.18 * tamano, z), colores.hojas),
  ];
}

// Muros bajos: laterales completos y frente al pasillo con puerta
function muros(largo, fondo, lado) {
  const alto = plantaPiso.alturaMuro;
  const grosor = 0.04;
  const zPasillo = -lado * (fondo / 2);
  const tramoPuerta = (largo - 0.6) / 2;
  return [
    caja([grosor, alto, fondo], [-largo / 2, alto / 2, 0], colores.muroPlanta),
    caja([grosor, alto, fondo], [largo / 2, alto / 2, 0], colores.muroPlanta),
    caja([tramoPuerta, alto, grosor], [-largo / 2 + tramoPuerta / 2, alto / 2, zPasillo], colores.muroPlanta),
    caja([tramoPuerta, alto, grosor], [largo / 2 - tramoPuerta / 2, alto / 2, zPasillo], colores.muroPlanta),
  ];
}

// Una oficina de la planta según su diseño, unida en una sola malla
function crearOficinaPlanta({ diseno, largo, fondo, lado, aleatorio, paleta }) {
  const piezas = [
    caja([largo - 0.06, 0.04, fondo - 0.06], [0, 0.02, 0], colores.pisos[diseno]),
    ...muros(largo, fondo, lado),
    ...MUEBLES[diseno]({ largo, fondo, lado, aleatorio, paleta }),
  ];
  return new THREE.Mesh(unirGeometrias(piezas), new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true }));
}

const colorAleatorio = (aleatorio, lista) => lista[Math.floor(aleatorio() * lista.length)];

// Muebles de cada diseño en coordenadas locales de la oficina
const MUEBLES = {
  abierta: ({ largo, fondo, aleatorio, paleta }) => {
    const piezas = [];
    const columnas = Math.max(2, Math.floor((largo - 0.6) / 0.62));
    for (let columna = 0; columna < columnas; columna++) {
      for (const fila of [-1, 1]) {
        const x = -largo / 2 + 0.45 + columna * ((largo - 0.9) / Math.max(columnas - 1, 1));
        const z = fila * fondo * 0.18;
        piezas.push(
          caja([0.4, 0.03, 0.2], [x, ALTO_MESA, z], colores.escritorio),
          caja([0.13, 0.08, 0.015], [x, ALTO_MESA + 0.06, z - fila * 0.06], colores.monitor),
          caja([0.11, 0.1, 0.11], [x, 0.07, z + fila * 0.17], paleta.silla),
        );
        if (aleatorio() < 0.45) piezas.push(...persona([x, 0, z + fila * 0.2], colorAleatorio(aleatorio, colores.camisa), colorAleatorio(aleatorio, colores.cabello)));
      }
    }
    piezas.push(...planta([largo / 2 - 0.2, fondo / 2 - 0.2], 1.4));
    return piezas;
  },

  juntas: ({ largo, fondo, aleatorio, paleta }) => {
    const largoMesa = Math.min(largo * 0.6, 3);
    const piezas = [
      caja([largoMesa, 0.04, fondo * 0.3], [0, ALTO_MESA, 0], paleta.madera),
      caja([0.06, ALTO_MESA, fondo * 0.2], [0, ALTO_MESA / 2, 0], colores.patas),
      caja([0.9, 0.45, 0.03], [0, 0.4, -fondo / 2 + 0.06], colores.pantallaJuntas),
    ];
    const sillas = Math.floor(largoMesa / 0.35);
    for (let indice = 0; indice < sillas; indice++) {
      const x = -largoMesa / 2 + 0.2 + indice * ((largoMesa - 0.4) / Math.max(sillas - 1, 1));
      for (const fila of [-1, 1]) {
        const z = fila * (fondo * 0.15 + 0.12);
        piezas.push(caja([0.11, 0.1, 0.11], [x, 0.07, z], paleta.silla));
        if (aleatorio() < 0.5) piezas.push(...persona([x, 0, z], colorAleatorio(aleatorio, colores.camisa), colorAleatorio(aleatorio, colores.cabello)));
      }
    }
    piezas.push(...planta([largo / 2 - 0.25, fondo / 2 - 0.25], 1.3), ...planta([-largo / 2 + 0.25, fondo / 2 - 0.25], 1.3));
    return piezas;
  },

  privada: ({ largo, fondo, aleatorio, paleta }) => [
    caja([0.7, 0.04, 0.3], [-largo * 0.2, ALTO_MESA, -fondo * 0.15], paleta.madera),
    caja([0.14, 0.12, 0.14], [-largo * 0.2, 0.08, -fondo * 0.15 - 0.25], paleta.silla),
    caja([0.13, 0.08, 0.015], [-largo * 0.2, ALTO_MESA + 0.06, -fondo * 0.15 + 0.08], colores.monitor),
    caja([largo * 0.5, 0.42, 0.08], [0, 0.21, -fondo / 2 + 0.06], colores.estante),
    caja([0.8, 0.12, 0.25], [largo * 0.25, 0.08, fondo * 0.2], paleta.sofa),
    caja([0.8, 0.15, 0.06], [largo * 0.25, 0.14, fondo * 0.2 + 0.12], paleta.sofa),
    ...persona([-largo * 0.2, 0, -fondo * 0.15 - 0.27], colorAleatorio(aleatorio, colores.camisa), colorAleatorio(aleatorio, colores.cabello)),
    ...planta([largo / 2 - 0.25, -fondo / 2 + 0.25], 1.5),
  ],

  descanso: ({ largo, fondo, aleatorio, paleta }) => {
    const piezas = [
      caja([largo * 0.45, ALTO_MESA, 0.2], [-largo * 0.2, ALTO_MESA / 2, -fondo / 2 + 0.14], colores.cocina),
      caja([0.9, 0.12, 0.25], [largo * 0.15, 0.08, 0], paleta.sofa),
      caja([0.25, 0.12, 0.7], [largo * 0.15 + 0.55, 0.08, 0.22], paleta.sofa),
      caja([0.4, 0.06, 0.25], [largo * 0.15, 0.05, 0.4], paleta.madera),
    ];
    for (let indice = 0; indice < 3; indice++) {
      piezas.push(...persona([entre(aleatorio, -largo * 0.35, largo * 0.35), 0, entre(aleatorio, -fondo * 0.2, fondo * 0.3)], colorAleatorio(aleatorio, colores.camisa), colorAleatorio(aleatorio, colores.cabello)));
    }
    piezas.push(...planta([-largo / 2 + 0.25, fondo / 2 - 0.25], 1.6), ...planta([largo / 2 - 0.25, fondo / 2 - 0.25], 1.6));
    return piezas;
  },
};

// Resaltado de la oficina completa al pasar el cursor o seleccionarla
function registrarClicable(malla, elemento) {
  malla.userData.elemento = elemento;
  malla.userData.resaltar = (_indice, nivel) => {
    const intensidad = nivel === NIVEL_SELECCION ? 0.4 : nivel === NIVEL_HOVER ? 0.2 : 0;
    malla.material.emissive.copy(colorResaltado).multiplyScalar(intensidad);
  };
}
