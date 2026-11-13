import * as THREE from 'three';
import { torres, zonas } from '../datos/edificio.js';
import { coloresEscena } from '../datos/tema.js';
import { cajaUnidad, crearAleatorio, crearInstancias, entre } from './utilidades.js';

const colores = coloresEscena.decoPlaza;
const CANTIDAD_PERSONAS = 26;
const ALTO_PERSONA = 0.38;

// Mobiliario de las plazas: franjas de piso, fuente, bancas, jardineras y personas caminando
export function crearPlaza(escena) {
  const [torreA, torreB] = torres;
  const izquierda = torreA.x - torreA.largo / 2;
  const derecha = torreB.x + torreB.largo / 2;
  const xCentral = (torreA.x + torreA.largo / 2 + torreB.x - torreB.largo / 2) / 2;
  const { zDesde, zHasta } = zonas.plazaFrontal;

  agregarFranjas(escena, izquierda, derecha, zDesde, zHasta);
  const animarAgua = agregarFuente(escena, xCentral, 0);
  agregarBancasYJardineras(escena, izquierda, derecha, zDesde, zHasta);
  const animarPersonas = agregarPersonas(escena, izquierda, derecha, zDesde, zHasta);

  return (delta, tiempo) => {
    animarAgua(tiempo);
    animarPersonas(delta, tiempo);
  };
}

// Franjas de piso que marcan el ritmo de la fachada
function agregarFranjas(escena, izquierda, derecha, zDesde, zHasta) {
  const franjas = [];
  for (let x = izquierda; x <= derecha; x += 3) {
    franjas.push({ posicion: [x, 0.105, (zDesde + zHasta) / 2], escala: [0.12, 0.01, zHasta - zDesde - 0.4] });
  }
  escena.add(crearInstancias(cajaUnidad, franjas, colores.franja, { sombras: false }));
}

// Fuente circular en la plazoleta central con chorro que sube y baja
function agregarFuente(escena, x, z) {
  const borde = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.3, 24), new THREE.MeshLambertMaterial({ color: colores.fuente }));
  borde.position.set(x, 0.27, z);
  const agua = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.05, 24), new THREE.MeshLambertMaterial({ color: colores.agua }));
  agua.position.set(x, 0.4, z);
  const chorro = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 1, 8), new THREE.MeshLambertMaterial({ color: colores.agua, transparent: true, opacity: 0.75 }));
  chorro.position.set(x, 0.9, z);
  borde.receiveShadow = true;
  escena.add(borde, agua, chorro);

  return (tiempo) => {
    const altura = 0.8 + Math.sin(tiempo * 2) * 0.2;
    chorro.scale.y = altura;
    chorro.position.y = 0.42 + altura / 2;
  };
}

// Bancas de madera y jardineras con árbol en la plaza frontal
function agregarBancasYJardineras(escena, izquierda, derecha, zDesde, zHasta) {
  const bancas = [];
  const jardineras = [];
  const copas = [];
  const zBancas = zDesde + 1.2;
  const zJardineras = zHasta - 1.4;
  for (let x = izquierda + 2; x <= derecha - 2; x += 6) {
    if (Math.abs(x) < 3) continue;
    bancas.push({ posicion: [x, 0.2, zBancas], escala: [1.2, 0.08, 0.3] });
    bancas.push({ posicion: [x, 0.32, zBancas - 0.13], escala: [1.2, 0.2, 0.05] });
    jardineras.push({ posicion: [x + 3, 0.25, zJardineras], escala: [1.4, 0.3, 1.4] });
    copas.push({ posicion: [x + 3, 1.3, zJardineras], escala: [0.9, 1.1, 0.9], giro: x });
  }
  const materialCopa = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
  escena.add(
    crearInstancias(cajaUnidad, bancas, colores.banca),
    crearInstancias(cajaUnidad, jardineras, colores.jardinera),
    crearInstancias(new THREE.IcosahedronGeometry(0.95, 0), copas, coloresEscena.copasArbol[0], { material: materialCopa }),
  );
}

// Geometrías de persona: cuerpo (se tiñe por instancia) y cabeza
const geometriaCuerpo = new THREE.CylinderGeometry(0.06, 0.07, ALTO_PERSONA * 0.72, 6).translate(0, ALTO_PERSONA * 0.36, 0);
const geometriaCabeza = new THREE.SphereGeometry(0.06, 8, 6).translate(0, ALTO_PERSONA * 0.86, 0);

// Personas que caminan de un lado a otro de la plaza
function agregarPersonas(escena, izquierda, derecha, zDesde, zHasta) {
  const aleatorio = crearAleatorio(31);
  const personas = Array.from({ length: CANTIDAD_PERSONAS }, () => ({
    x: entre(aleatorio, izquierda, derecha),
    z: entre(aleatorio, zDesde + 0.6, zHasta - 0.6),
    velocidad: entre(aleatorio, 0.3, 0.7) * (aleatorio() < 0.5 ? -1 : 1),
    fase: aleatorio() * Math.PI * 2,
  }));

  const cuerpos = new THREE.InstancedMesh(geometriaCuerpo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), personas.length);
  const cabezas = new THREE.InstancedMesh(geometriaCabeza, new THREE.MeshLambertMaterial({ color: coloresEscena.oficina.piel }), personas.length);
  const color = new THREE.Color();
  personas.forEach((_, indice) => cuerpos.setColorAt(indice, color.set(colores.personas[indice % colores.personas.length])));
  for (const malla of [cuerpos, cabezas]) {
    malla.castShadow = true;
    malla.frustumCulled = false;
    escena.add(malla);
  }

  const auxiliar = new THREE.Object3D();
  return (delta, tiempo) => {
    personas.forEach((persona, indice) => {
      persona.x += persona.velocidad * delta;
      if (persona.x > derecha || persona.x < izquierda) persona.velocidad *= -1;
      auxiliar.position.set(persona.x, 0.1 + Math.abs(Math.sin(tiempo * 6 + persona.fase)) * 0.02, persona.z);
      auxiliar.rotation.y = persona.velocidad > 0 ? Math.PI / 2 : -Math.PI / 2;
      auxiliar.updateMatrix();
      cuerpos.setMatrixAt(indice, auxiliar.matrix);
      cabezas.setMatrixAt(indice, auxiliar.matrix);
    });
    cuerpos.instanceMatrix.needsUpdate = true;
    cabezas.instanceMatrix.needsUpdate = true;
  };
}
