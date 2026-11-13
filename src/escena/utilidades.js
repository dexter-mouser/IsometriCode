import * as THREE from 'three';

export const cajaUnidad = new THREE.BoxGeometry(1, 1, 1);

// InstancedMesh estático a partir de una lista { posicion, escala, giro?, color? }
export function crearInstancias(geometria, lista, color, { sombras = true, material } = {}) {
  const malla = new THREE.InstancedMesh(geometria, material ?? new THREE.MeshLambertMaterial({ color: '#ffffff' }), lista.length);
  const matriz = new THREE.Matrix4();
  const rotacion = new THREE.Quaternion();
  const ejeY = new THREE.Vector3(0, 1, 0);
  const colorBase = new THREE.Color(color);
  const colorInstancia = new THREE.Color();

  lista.forEach((caja, indice) => {
    rotacion.setFromAxisAngle(ejeY, caja.giro ?? 0);
    matriz.compose(new THREE.Vector3(...caja.posicion), rotacion, new THREE.Vector3(...caja.escala));
    malla.setMatrixAt(indice, matriz);
    malla.setColorAt(indice, caja.color ? colorInstancia.set(caja.color) : colorBase);
  });

  malla.castShadow = sombras;
  malla.receiveShadow = sombras;
  malla.computeBoundingSphere();
  return malla;
}

// Malla de una caja con material propio
export function crearCaja(escala, posicion, color, { sombras = true } = {}) {
  const malla = new THREE.Mesh(cajaUnidad, new THREE.MeshLambertMaterial({ color }));
  malla.scale.set(...escala);
  malla.position.set(...posicion);
  malla.castShadow = sombras;
  malla.receiveShadow = true;
  return malla;
}

// Asigna un color de vértice uniforme (para unir piezas de colores en una geometría)
export function pintarGeometria(geometria, color) {
  const tono = new THREE.Color(color);
  const colores = new Float32Array(geometria.attributes.position.count * 3);
  for (let indice = 0; indice < colores.length; indice += 3) {
    colores[indice] = tono.r;
    colores[indice + 1] = tono.g;
    colores[indice + 2] = tono.b;
  }
  geometria.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  return geometria;
}

// Generador pseudoaleatorio con semilla (misma escena en cada carga)
export function crearAleatorio(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const entre = (aleatorio, minimo, maximo) => minimo + aleatorio() * (maximo - minimo);
