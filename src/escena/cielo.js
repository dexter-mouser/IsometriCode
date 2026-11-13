import * as THREE from 'three';
import { coloresEscena } from '../datos/tema.js';
import { crearAleatorio, entre } from './utilidades.js';

const CANTIDAD_NUBES = 7;
const OPACIDAD_NUBES = 0.88;
const ZOOM_SIN_NUBES = 2.2;
const BOLAS_POR_NUBE = 5;
const LIMITE_NUBES = 58;
const BANDADAS = [
  { pajaros: 7, radio: 28, altura: 20, velocidadAngular: 0.13, fase: 0 },
  { pajaros: 5, radio: 36, altura: 24, velocidadAngular: -0.1, fase: Math.PI },
];
const SEPARACION_LATERAL = 1.3;
const SEPARACION_TRASERA = 1.1;
const FRECUENCIA_ALETEO = 9;

// Nubes que se desplazan y bandadas de pájaros
// obtenerZoom: las nubes se desvanecen al acercarse para no tapar el edificio
export function crearCielo(escena, obtenerZoom) {
  const animarNubes = agregarNubes(escena);
  const animarPajaros = agregarPajaros(escena);
  return (delta, tiempo) => {
    animarNubes(delta, obtenerZoom());
    animarPajaros(tiempo);
  };
}

function agregarNubes(escena) {
  const aleatorio = crearAleatorio(11);
  const nubes = Array.from({ length: CANTIDAD_NUBES }, () => ({
    x: entre(aleatorio, -LIMITE_NUBES, LIMITE_NUBES),
    y: entre(aleatorio, 26, 32),
    z: entre(aleatorio, -38, 38),
    velocidad: entre(aleatorio, 0.8, 1.8),
    bolas: Array.from({ length: BOLAS_POR_NUBE }, (_, indice) => ({
      dx: (indice - 2) * entre(aleatorio, 1.4, 2),
      dy: entre(aleatorio, -0.3, 0.6),
      dz: entre(aleatorio, -1.2, 1.2),
      tamano: entre(aleatorio, 1.6, 2.8) * (indice === 2 ? 1.3 : 1),
    })),
  }));

  const geometria = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshLambertMaterial({ color: coloresEscena.nube, flatShading: true, transparent: true, opacity: OPACIDAD_NUBES });
  const malla = new THREE.InstancedMesh(geometria, material, CANTIDAD_NUBES * BOLAS_POR_NUBE);
  malla.frustumCulled = false;
  malla.castShadow = true;
  escena.add(malla);

  const auxiliar = new THREE.Object3D();
  return (delta, zoom) => {
    material.opacity = THREE.MathUtils.clamp(OPACIDAD_NUBES * (ZOOM_SIN_NUBES - zoom) / (ZOOM_SIN_NUBES - 1), 0, OPACIDAD_NUBES);
    malla.visible = material.opacity > 0.02;
    let indice = 0;
    for (const nube of nubes) {
      nube.x += nube.velocidad * delta;
      if (nube.x > LIMITE_NUBES) nube.x = -LIMITE_NUBES;
      for (const bola of nube.bolas) {
        auxiliar.position.set(nube.x + bola.dx, nube.y + bola.dy, nube.z + bola.dz);
        auxiliar.scale.set(bola.tamano, bola.tamano * 0.7, bola.tamano);
        auxiliar.updateMatrix();
        malla.setMatrixAt(indice++, auxiliar.matrix);
      }
    }
    malla.instanceMatrix.needsUpdate = true;
  };
}

// Ala triangular; el cuerpo apunta a +z
function crearGeometriaAla(lado) {
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0.35,
    0, 0, -0.2,
    0.95 * lado, 0, -0.1,
  ], 3));
  geometria.computeVertexNormals();
  return geometria;
}

// Posiciones en formación V de cada pájaro dentro de su bandada
function crearPajaros() {
  const pajaros = [];
  BANDADAS.forEach((bandada, numeroBandada) => {
    for (let indice = 0; indice < bandada.pajaros; indice++) {
      const fila = Math.ceil(indice / 2);
      const lado = indice % 2 === 0 ? 1 : -1;
      pajaros.push({
        bandada,
        lateral: lado * fila * SEPARACION_LATERAL,
        trasero: -fila * SEPARACION_TRASERA,
        faseAleteo: indice * 0.9 + numeroBandada,
      });
    }
  });
  return pajaros;
}

function agregarPajaros(escena) {
  const pajaros = crearPajaros();
  const material = new THREE.MeshLambertMaterial({ color: coloresEscena.pajaro, side: THREE.DoubleSide });
  const alasDerechas = new THREE.InstancedMesh(crearGeometriaAla(1), material, pajaros.length);
  const alasIzquierdas = new THREE.InstancedMesh(crearGeometriaAla(-1), material, pajaros.length);
  for (const alas of [alasDerechas, alasIzquierdas]) {
    alas.frustumCulled = false;
    escena.add(alas);
  }

  const auxiliar = new THREE.Object3D();
  auxiliar.rotation.order = 'YXZ';

  return (tiempo) => {
    pajaros.forEach((pajaro, indice) => {
      const { radio, altura, velocidadAngular, fase } = pajaro.bandada;
      const angulo = fase + tiempo * velocidadAngular;
      const sentido = Math.sign(velocidadAngular);
      const rumbo = Math.atan2(-Math.sin(angulo) * sentido, Math.cos(angulo) * sentido);
      const avanceX = Math.sin(rumbo);
      const avanceZ = Math.cos(rumbo);

      const x = Math.cos(angulo) * radio + avanceX * pajaro.trasero + avanceZ * pajaro.lateral;
      const z = Math.sin(angulo) * radio + avanceZ * pajaro.trasero - avanceX * pajaro.lateral;
      const y = altura + Math.sin(tiempo * 1.3 + pajaro.faseAleteo) * 0.4;
      const aleteo = Math.sin(tiempo * FRECUENCIA_ALETEO + pajaro.faseAleteo) * 0.6;

      auxiliar.position.set(x, y, z);
      auxiliar.rotation.set(0, rumbo, aleteo);
      auxiliar.updateMatrix();
      alasDerechas.setMatrixAt(indice, auxiliar.matrix);
      auxiliar.rotation.set(0, rumbo, -aleteo);
      auxiliar.updateMatrix();
      alasIzquierdas.setMatrixAt(indice, auxiliar.matrix);
    });
    alasDerechas.instanceMatrix.needsUpdate = true;
    alasIzquierdas.instanceMatrix.needsUpdate = true;
  };
}
