import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { calle30, calleSur, metro, MITAD_TERRENO } from '../datos/ciudad.js';
import { coloresEscena } from '../datos/tema.js';
import { cajaUnidad, crearInstancias, crearLote, pintarGeometria } from './utilidades.js';

const ESPESOR_TABLERO = 0.6;
const SEPARACION_VAGONES = 0.3;

// Media longitud del viaducto (de borde a borde del terreno)
const mitadLargo = MITAD_TERRENO - 0.1;

// Viaducto, estación y tren; devuelve la animación del tren
export function crearMetro(escena) {
  const lote = crearLote();
  agregarViaducto(escena, lote);
  agregarEstacion(escena, lote);
  escena.add(lote.construir({ sombras: true }));
  return agregarTren(escena);
}

// Los pilares no caen sobre la Calle 30 ni la calle del sur
const sobreCalle = (x) => Math.abs(x - calle30.x) < calle30.ancho / 2 + 0.6 || Math.abs(x - calleSur.x) < calleSur.ancho / 2 + 0.6;

function agregarViaducto(escena, lote) {
  const yTablero = metro.altura;
  lote.caja([mitadLargo * 2, ESPESOR_TABLERO, metro.anchoTablero], [0, yTablero - ESPESOR_TABLERO / 2, metro.z], coloresEscena.concreto);
  lote.caja([mitadLargo * 2, 0.06, 0.12], [0, yTablero + 0.03, metro.z - 0.5], coloresEscena.poste);
  lote.caja([mitadLargo * 2, 0.06, 0.12], [0, yTablero + 0.03, metro.z + 0.5], coloresEscena.poste);

  const pilares = [];
  for (let x = -mitadLargo + 2; x < mitadLargo - 1; x += metro.separacionPilares) {
    if (sobreCalle(x)) continue;
    pilares.push({ posicion: [x, (yTablero - ESPESOR_TABLERO) / 2, metro.z], escala: [0.7, yTablero - ESPESOR_TABLERO, 0.9] });
  }
  escena.add(crearInstancias(cajaUnidad, pilares, coloresEscena.concreto));
}

// Andenes, cubierta sobre columnas y escalera al suelo
function agregarEstacion(escena, lote) {
  const { estacionX: x, largoEstacion: largo, z, altura } = metro;
  const anchoAnden = 1.2;
  const altoCubierta = 2.4;
  lote.caja([largo, 0.3, anchoAnden], [x, altura - 0.15, z - metro.anchoTablero / 2 - anchoAnden / 2], coloresEscena.aceraCiudad);
  lote.caja([largo, 0.3, anchoAnden], [x, altura - 0.15, z + metro.anchoTablero / 2 + anchoAnden / 2], coloresEscena.aceraCiudad);
  lote.caja([largo + 1, 0.2, metro.anchoTablero + anchoAnden * 2 + 0.6], [x, altura + altoCubierta, z], coloresEscena.techoEstacion);
  lote.caja([3, altura, 1.6], [x + largo / 2 + 1.5, altura / 2, z - 2.4], coloresEscena.concreto);

  const columnas = [];
  for (const dz of [-1, 1]) {
    for (let dx = -largo / 2 + 1; dx <= largo / 2 - 1; dx += 4) {
      columnas.push({ posicion: [x + dx, altura + altoCubierta / 2, z + dz * (metro.anchoTablero / 2 + anchoAnden - 0.15)], escala: [0.15, altoCubierta, 0.15] });
    }
  }
  escena.add(crearInstancias(cajaUnidad, columnas, coloresEscena.poste));
}

// Vagón: caja clara con franja oscura de ventanas
function crearGeometriaVagon() {
  return mergeGeometries([
    pintarGeometria(new THREE.BoxGeometry(metro.largoVagon, 1.3, 1.5).translate(0, 0.75, 0), coloresEscena.vagon),
    pintarGeometria(new THREE.BoxGeometry(metro.largoVagon - 0.4, 0.4, 1.52).translate(0, 0.95, 0), coloresEscena.franjaVagon),
  ]);
}

// Tren que cruza el viaducto, sale del disco y vuelve tras una espera
function agregarTren(escena) {
  const material = new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true });
  const vagones = new THREE.InstancedMesh(crearGeometriaVagon(), material, metro.vagones);
  vagones.castShadow = true;
  vagones.frustumCulled = false;
  escena.add(vagones);

  const largoTren = metro.vagones * (metro.largoVagon + SEPARACION_VAGONES);
  const recorrido = mitadLargo * 2 + largoTren;
  const ciclo = recorrido / metro.velocidad + metro.esperaSegundos;
  const auxiliar = new THREE.Object3D();

  return (_delta, tiempo) => {
    const avance = ((tiempo % ciclo) * metro.velocidad);
    const cabeza = -mitadLargo + avance;
    for (let indice = 0; indice < metro.vagones; indice++) {
      const x = cabeza - indice * (metro.largoVagon + SEPARACION_VAGONES) - metro.largoVagon / 2;
      const dentro = Math.abs(x) < mitadLargo - metro.largoVagon / 2;
      auxiliar.position.set(x, metro.altura, metro.z);
      auxiliar.scale.setScalar(dentro ? 1 : 0);
      auxiliar.updateMatrix();
      vagones.setMatrixAt(indice, auxiliar.matrix);
    }
    vagones.instanceMatrix.needsUpdate = true;
  };
}
