import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MITAD_TERRENO, terreno } from '../datos/ciudad.js';
import { coloresEscena } from '../datos/tema.js';
import { crearAleatorio, entre, pintarGeometria } from './utilidades.js';

const LADO = MITAD_TERRENO * 2;
const ESPESOR_CESPED = 0.3;

// Bloque cuadrado de ciudad arrancado de la tierra: césped, capas de tierra,
// fondo de roca irregular y cables y raíces colgando
export function crearTerreno() {
  const grupo = new THREE.Group();
  const profundidadCapas = terreno.espesorCapas.reduce((suma, espesor) => suma + espesor, 0);

  grupo.add(crearCapas(), crearRoca(profundidadCapas), crearColgantes(profundidadCapas));
  return grupo;
}

// Césped arriba y capas de tierra apiladas (se ven en los costados)
function crearCapas() {
  const piezas = [pintarGeometria(new THREE.BoxGeometry(LADO, ESPESOR_CESPED, LADO).translate(0, -ESPESOR_CESPED / 2, 0), coloresEscena.cesped)];
  let y = -ESPESOR_CESPED;
  terreno.espesorCapas.forEach((espesor, indice) => {
    const geometria = new THREE.BoxGeometry(LADO, espesor, LADO).translate(0, y - espesor / 2, 0);
    piezas.push(pintarGeometria(geometria, coloresEscena.capasTierra[indice % coloresEscena.capasTierra.length]));
    y -= espesor;
  });

  const malla = new THREE.Mesh(mergeGeometries(piezas), new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true }));
  malla.receiveShadow = true;
  return malla;
}

// Fondo de roca: plano subdividido que baja más en el centro, con relieve aleatorio
function crearRoca(profundidadCapas) {
  const aleatorio = crearAleatorio(17);
  const divisiones = terreno.divisionesRoca;
  const geometria = new THREE.PlaneGeometry(LADO, LADO, divisiones, divisiones).rotateX(Math.PI / 2);
  const posiciones = geometria.attributes.position;
  const yTecho = -ESPESOR_CESPED - profundidadCapas;

  for (let indice = 0; indice < posiciones.count; indice++) {
    const x = posiciones.getX(indice);
    const z = posiciones.getZ(indice);
    const distanciaBorde = 1 - Math.max(Math.abs(x), Math.abs(z)) / MITAD_TERRENO;
    const esBorde = distanciaBorde < 0.001;
    const caida = esBorde ? 0 : Math.pow(distanciaBorde, 0.55) * terreno.profundidadRoca * entre(aleatorio, 0.7, 1.15);
    posiciones.setY(indice, yTecho - caida);
  }

  const noIndexada = geometria.toNonIndexed();
  noIndexada.computeVertexNormals();
  pintarPorProfundidad(noIndexada, yTecho);
  return new THREE.Mesh(noIndexada, new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
}

// Tierra arriba, roca abajo
function pintarPorProfundidad(geometria, yTecho) {
  const tierra = new THREE.Color(coloresEscena.capasTierra.at(-1));
  const roca = new THREE.Color(coloresEscena.roca);
  const color = new THREE.Color();
  const posiciones = geometria.attributes.position;
  const colores = new Float32Array(posiciones.count * 3);
  for (let indice = 0; indice < posiciones.count; indice++) {
    const mezcla = Math.min((yTecho - posiciones.getY(indice)) / (terreno.profundidadRoca * 0.5), 1);
    color.copy(tierra).lerp(roca, mezcla);
    colores.set([color.r, color.g, color.b], indice * 3);
  }
  geometria.setAttribute('color', new THREE.BufferAttribute(colores, 3));
}

// Punto aleatorio sobre uno de los cuatro costados
function puntoEnCostado(aleatorio, yMinimo, yMaximo) {
  const lado = Math.floor(aleatorio() * 4);
  const recorrido = entre(aleatorio, -MITAD_TERRENO + 4, MITAD_TERRENO - 4);
  const normal = [[1, 0], [-1, 0], [0, 1], [0, -1]][lado];
  const x = normal[0] !== 0 ? normal[0] * MITAD_TERRENO : recorrido;
  const z = normal[1] !== 0 ? normal[1] * MITAD_TERRENO : recorrido;
  return { inicio: new THREE.Vector3(x, entre(aleatorio, yMinimo, yMaximo), z), normal };
}

// Curva que sale del costado, se aleja un poco y cae colgando
function curvaColgante(aleatorio, { inicio, normal }, largo) {
  const salida = entre(aleatorio, 0.5, 2.5);
  const puntos = [
    inicio.clone().addScaledVector(new THREE.Vector3(normal[0], 0, normal[1]), -0.4),
    inicio,
    inicio.clone().add(new THREE.Vector3(normal[0] * salida, -largo * 0.35, normal[1] * salida)),
    inicio.clone().add(new THREE.Vector3(normal[0] * salida * 0.6 + entre(aleatorio, -1, 1), -largo, normal[1] * salida * 0.6 + entre(aleatorio, -1, 1))),
  ];
  return new THREE.CatmullRomCurve3(puntos);
}

// Cables del alumbrado y raíces en una sola malla con color por vértice
function crearColgantes(profundidadCapas) {
  const aleatorio = crearAleatorio(23);
  const piezas = [];
  const yFondoCapas = -ESPESOR_CESPED - profundidadCapas;

  for (let indice = 0; indice < terreno.cantidadCables; indice++) {
    const curva = curvaColgante(aleatorio, puntoEnCostado(aleatorio, -2.2, -0.6), entre(aleatorio, 9, 20));
    const radio = entre(aleatorio, 0.12, 0.26);
    const color = coloresEscena.cables[Math.floor(aleatorio() * coloresEscena.cables.length)];
    piezas.push(pintarGeometria(new THREE.TubeGeometry(curva, 18, radio, 5), color));
  }

  for (let indice = 0; indice < terreno.cantidadRaices; indice++) {
    const curva = curvaColgante(aleatorio, puntoEnCostado(aleatorio, yFondoCapas + 0.5, -1), entre(aleatorio, 2, 6));
    piezas.push(pintarGeometria(new THREE.TubeGeometry(curva, 10, entre(aleatorio, 0.06, 0.14), 4), coloresEscena.raiz));
  }

  // Tubos cortados que asoman de los costados
  for (let indice = 0; indice < 6; indice++) {
    const { inicio, normal } = puntoEnCostado(aleatorio, -2.5, -0.8);
    const tubo = new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8).rotateX(Math.PI / 2);
    tubo.lookAt(new THREE.Vector3(normal[0], 0, normal[1]));
    tubo.translate(inicio.x + normal[0] * 0.5, inicio.y, inicio.z + normal[1] * 0.5);
    piezas.push(pintarGeometria(tubo, coloresEscena.tubo));
  }

  return new THREE.Mesh(mergeGeometries(piezas), new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true }));
}
