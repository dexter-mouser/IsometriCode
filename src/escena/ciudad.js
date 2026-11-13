import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { avenida, bloquesManzanas, manzanas, metro, MITAD_TERRENO } from '../datos/ciudad.js';
import { coloresEscena } from '../datos/tema.js';
import { cajaUnidad, crearAleatorio, crearCaja, crearInstancias, entre } from './utilidades.js';

const ALTO_ACERA = 0.15;
const RETIRO_LOTE = 0.6;
const MARGEN_METRO = 2.5;

// Distribución fija de manzanas (misma semilla en cada carga)
const celdas = calcularCeldas();

function calcularCeldas() {
  const aleatorio = crearAleatorio(5);
  const resultado = [];
  for (const { columnas, filas, alturaMaxima = manzanas.alturaMaxima, permiteTorres = false } of bloquesManzanas) {
    for (const [z0, z1] of filas) {
      for (const [x0, x1] of columnas) {
        const esquinas = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
        if (!esquinas.every(([x, z]) => Math.max(Math.abs(x), Math.abs(z)) < MITAD_TERRENO - 0.5)) continue;
        resultado.push({ x0, x1, z0, z1, alturaMaxima, permiteTorres, esParque: aleatorio() < manzanas.proporcionParques });
      }
    }
  }
  return resultado;
}

// Media longitud de una franja horizontal (el terreno es cuadrado: llega al borde)
export const MITAD_FRANJA = MITAD_TERRENO - 0.05;

// Centros de los parques (allí se agrupan árboles)
export const centrosParques = celdas
  .filter((celda) => celda.esParque)
  .map((celda) => [(celda.x0 + celda.x1) / 2, (celda.z0 + celda.z1) / 2]);

// Indica si un punto está ocupado por edificios, avenida o metro (para no poner árboles)
export function zonaOcupada(x, z) {
  const enManzana = celdas.some((celda) => !celda.esParque && x > celda.x0 && x < celda.x1 && z > celda.z0 && z < celda.z1);
  const enParque = celdas.some((celda) => celda.esParque && (x < celda.x0 + 2 || x > celda.x1 - 2 || z < celda.z0 + 2 || z > celda.z1 - 2) && x > celda.x0 && x < celda.x1 && z > celda.z0 && z < celda.z1);
  const enAvenida = Math.abs(z - avenida.z) < avenida.ancho / 2 + 1;
  const enMetro = Math.abs(z - metro.z) < MARGEN_METRO;
  return enManzana || enParque || enAvenida || enMetro;
}

// Manzanas, edificios, avenida, palmeras y postes
export function crearCiudad(escena) {
  agregarManzanas(escena);
  agregarAvenida(escena);
  agregarPalmeras(escena);
  agregarPostes(escena);
}

function agregarManzanas(escena) {
  const aleatorio = crearAleatorio(9);
  const asfalto = [];
  const aceras = [];
  const edificios = [];

  for (const celda of celdas) {
    const ancho = celda.x1 - celda.x0;
    const fondo = celda.z1 - celda.z0;
    const centro = [(celda.x0 + celda.x1) / 2, (celda.z0 + celda.z1) / 2];
    asfalto.push({ posicion: [centro[0], 0.025, centro[1]], escala: [ancho, 0.05, fondo] });
    aceras.push({
      posicion: [centro[0], ALTO_ACERA / 2, centro[1]],
      escala: [ancho - manzanas.anchoCalle * 2, ALTO_ACERA, fondo - manzanas.anchoCalle * 2],
      color: celda.esParque ? coloresEscena.parque : coloresEscena.aceraCiudad,
    });
    if (!celda.esParque) edificios.push(...crearLotes(celda, aleatorio));
  }

  escena.add(
    crearInstancias(cajaUnidad, asfalto, coloresEscena.asfaltoCiudad, { sombras: false }),
    crearInstancias(cajaUnidad, aceras, coloresEscena.aceraCiudad, { sombras: false }),
    crearInstancias(cajaUnidad, edificios, '#ffffff', { material: crearMaterialConVentanas() }),
  );
}

// Altura y color de un edificio: ladrillo bajo o, a veces, torre clara alta
function elegirEdificio(celda, aleatorio) {
  const esTorre = celda.permiteTorres && aleatorio() < manzanas.proporcionTorres;
  const [minimo, maximo] = esTorre
    ? [manzanas.alturaTorreMinima, manzanas.alturaTorreMaxima]
    : [manzanas.alturaMinima, celda.alturaMaxima];
  const paleta = esTorre || aleatorio() < 0.15 ? coloresEscena.clarosCiudad : coloresEscena.ladrilloCiudad;
  return {
    alto: Math.round(entre(aleatorio, minimo, maximo)),
    color: paleta[Math.floor(aleatorio() * paleta.length)],
  };
}

// Divide la acera de una manzana en varios lotes con un edificio cada uno
function crearLotes(celda, aleatorio) {
  const margen = manzanas.anchoCalle;
  const x0 = celda.x0 + margen;
  const x1 = celda.x1 - margen;
  const z0 = celda.z0 + margen;
  const z1 = celda.z1 - margen;
  const variedad = manzanas.lotesMaximos - manzanas.lotesMinimos + 1;
  const cantidad = manzanas.lotesMinimos + Math.floor(aleatorio() * variedad);
  const dividirEnX = x1 - x0 >= z1 - z0;
  const lotes = [];

  for (let indice = 0; indice < cantidad; indice++) {
    const desde = indice / cantidad;
    const hasta = (indice + 1) / cantidad;
    const lx0 = dividirEnX ? x0 + (x1 - x0) * desde : x0;
    const lx1 = dividirEnX ? x0 + (x1 - x0) * hasta : x1;
    const lz0 = dividirEnX ? z0 : z0 + (z1 - z0) * desde;
    const lz1 = dividirEnX ? z1 : z0 + (z1 - z0) * hasta;
    const { alto, color } = elegirEdificio(celda, aleatorio);
    lotes.push({
      posicion: [(lx0 + lx1) / 2, ALTO_ACERA + alto / 2, (lz0 + lz1) / 2],
      escala: [lx1 - lx0 - RETIRO_LOTE * 2, alto, lz1 - lz0 - RETIRO_LOTE * 2],
      color,
    });
  }
  return lotes;
}

// Ventanas pintadas en el shader según la posición en el mundo (sin texturas)
function crearMaterialConVentanas() {
  const material = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const colorVentana = new THREE.Color(coloresEscena.ventanaCiudad);
  const colorTecho = new THREE.Color(coloresEscena.techoCiudad);

  material.onBeforeCompile = (sombreador) => {
    sombreador.uniforms.colorVentana = { value: colorVentana };
    sombreador.uniforms.colorTecho = { value: colorTecho };
    sombreador.vertexShader = sombreador.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosMundo;\nvarying vec3 vNormalMundo;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 posicionMundo = vec4(transformed, 1.0);
        vec3 normalMundo = objectNormal;
        #ifdef USE_INSTANCING
          posicionMundo = instanceMatrix * posicionMundo;
          normalMundo = mat3(instanceMatrix) * normalMundo;
        #endif
        vPosMundo = (modelMatrix * posicionMundo).xyz;
        vNormalMundo = normalize(mat3(modelMatrix) * normalMundo);`);
    sombreador.fragmentShader = sombreador.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosMundo;\nvarying vec3 vNormalMundo;\nuniform vec3 colorVentana;\nuniform vec3 colorTecho;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float esFachada = 1.0 - step(0.5, abs(vNormalMundo.y));
        float horizontal = abs(vNormalMundo.x) > 0.5 ? vPosMundo.z : vPosMundo.x;
        vec2 celda = fract(vec2(horizontal / 1.0, (vPosMundo.y - 0.15) / 0.95));
        float ventana = step(0.25, celda.x) * step(celda.x, 0.75) * step(0.35, celda.y) * step(celda.y, 0.8);
        float sobrePlantaBaja = step(1.0, vPosMundo.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, colorVentana, ventana * esFachada * sobrePlantaBaja * 0.75);
        diffuseColor.rgb = mix(diffuseColor.rgb, colorTecho, (1.0 - esFachada) * 0.85);`);
  };
  return material;
}

// Avenida paralela al edificio: asfalto, separador y líneas (los carros están en entorno.js)
function agregarAvenida(escena) {
  const mitad = MITAD_FRANJA;
  escena.add(
    crearCaja([mitad * 2, 0.05, avenida.ancho], [0, 0.025, avenida.z], coloresEscena.asfalto, { sombras: false }),
    crearCaja([mitad * 2, 0.2, 0.4], [0, 0.1, avenida.z], coloresEscena.separador, { sombras: false }),
  );

  const lineas = [];
  for (const zDivisoria of [avenida.z - 1.6, avenida.z + 1.6]) {
    for (let x = -mitad + 1; x < mitad - 1; x += 4) {
      lineas.push({ posicion: [x, 0.06, zDivisoria], escala: [1.6, 0.01, 0.1] });
    }
  }
  escena.add(crearInstancias(cajaUnidad, lineas, coloresEscena.lineaVia, { sombras: false }));
}

// Palmeras frente a la plaza y entre el edificio y la avenida
function agregarPalmeras(escena) {
  const aleatorio = crearAleatorio(13);
  const posiciones = [];
  for (let x = -42; x <= 42; x += 5.25) {
    posiciones.push([x, 13.9]);
    posiciones.push([x + 2.6, avenida.z + avenida.ancho / 2 + 0.6]);
  }

  const troncos = [];
  const copas = [];
  for (const [x, z] of posiciones) {
    const tamano = entre(aleatorio, 0.85, 1.15);
    const giro = aleatorio() * Math.PI;
    troncos.push({ posicion: [x, 0, z], escala: [tamano, tamano, tamano], giro });
    copas.push({ posicion: [x, 0, z], escala: [tamano, tamano, tamano], giro });
  }

  const tronco = new THREE.CylinderGeometry(0.09, 0.15, 3.2, 5).translate(0, 1.6, 0);
  const hojas = mergeGeometries(Array.from({ length: 6 }, (_, indice) => new THREE.BoxGeometry(1.5, 0.05, 0.32)
    .translate(0.75, 0, 0)
    .rotateZ(-0.35)
    .rotateY((indice * Math.PI) / 3)
    .translate(0, 3.2, 0)));

  escena.add(
    crearInstancias(tronco, troncos, coloresEscena.troncoPalma),
    crearInstancias(hojas, copas, coloresEscena.hojasPalma, { material: new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }) }),
  );
}

// Postes de luz junto a la avenida y en el separador de la autopista
function agregarPostes(escena) {
  const poste = mergeGeometries([
    new THREE.CylinderGeometry(0.05, 0.07, 3.4, 5).translate(0, 1.7, 0),
    new THREE.BoxGeometry(0.9, 0.06, 0.06).translate(0.45, 3.35, 0),
    new THREE.BoxGeometry(0.35, 0.1, 0.18).translate(0.85, 3.3, 0),
  ]);

  const postes = [];
  const zAcera = avenida.z - avenida.ancho / 2 - 0.5;
  const mitadAvenida = MITAD_FRANJA - 2;
  for (let x = -mitadAvenida; x <= mitadAvenida; x += 8) {
    postes.push({ posicion: [x, 0, zAcera], escala: [1, 1, 1], giro: -Math.PI / 2 });
  }
  for (let x = -50; x <= 50; x += 10) {
    postes.push({ posicion: [x, 0.2, 19], escala: [1, 1, 1], giro: Math.PI / 2 });
    postes.push({ posicion: [x + 5, 0.2, 19], escala: [1, 1, 1], giro: -Math.PI / 2 });
  }
  escena.add(crearInstancias(poste, postes, coloresEscena.poste));
}
