import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { avenida, bloquesManzanas, calle30, calleSur, manzanas, metro, MITAD_TERRENO, rio, vias } from '../datos/ciudad.js';
import { coloresEscena } from '../datos/tema.js';
import { cajaUnidad, crearAleatorio, crearInstancias, crearLote, entre } from './utilidades.js';

const ALTO_ACERA = 0.15;
const RETIRO_LOTE = 0.6;
const MARGEN_METRO = 2.5;
const ALTO_LOCAL = 1;
const SEPARACION_BALCONES = 1.9;
const SEGMENTOS_OREJA = 26;

// Uniforme compartido: 0 = día, 1 = tarde con ventanas encendidas
const ventanasEncendidas = { value: 0 };

// Distribución fija de manzanas (misma semilla en cada carga)
const celdas = calcularCeldas();

function calcularCeldas() {
  const aleatorio = crearAleatorio(5);
  const resultado = [];
  for (const { columnas, filas, tipo = 'residencial', alturaMaxima = manzanas.alturaMaxima, permiteTorres = false } of bloquesManzanas) {
    for (const [z0, z1] of filas) {
      for (const [x0, x1] of columnas) {
        const esquinas = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
        if (!esquinas.every(([x, z]) => Math.max(Math.abs(x), Math.abs(z)) < MITAD_TERRENO - 0.5)) continue;
        resultado.push({ x0, x1, z0, z1, tipo, alturaMaxima, permiteTorres, esParque: aleatorio() < manzanas.proporcionParques });
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

// Indica si un punto está ocupado por edificios, calles o metro (para no poner árboles)
export function zonaOcupada(x, z) {
  const dentro = (celda) => x > celda.x0 && x < celda.x1 && z > celda.z0 && z < celda.z1;
  const enManzana = celdas.some((celda) => !celda.esParque && dentro(celda));
  const enBordeParque = celdas.some((celda) => celda.esParque && dentro(celda)
    && (x < celda.x0 + 2 || x > celda.x1 - 2 || z < celda.z0 + 2 || z > celda.z1 - 2));
  const enAvenida = Math.abs(z - avenida.z) < avenida.ancho / 2 + 1;
  const enMetro = Math.abs(z - metro.z) < MARGEN_METRO;
  const enCalles = Math.abs(x - calle30.x) < calle30.ancho / 2 + 1 || Math.abs(x - calleSur.x) < calleSur.ancho / 2 + 1;
  const enOreja = Math.hypot(x - calle30.oreja.centro[0], z - calle30.oreja.centro[1]) < calle30.oreja.radio + 2;
  return enManzana || enBordeParque || enAvenida || enMetro || enCalles || enOreja;
}

// Cambia la iluminación de las ventanas de la ciudad (0 = día, 1 = tarde)
export function encenderVentanasCiudad(valor) {
  ventanasEncendidas.value = valor;
}

// Manzanas, edificios, calles, palmeras y postes
export function crearCiudad(escena) {
  agregarManzanas(escena);
  agregarCalles(escena);
  agregarPalmeras(escena);
  agregarPostes(escena);
}

// Listas de piezas de la arquitectura de la ciudad (cada una se dibuja instanciada)
function crearListas() {
  return {
    edificios: [], bodegas: [], techosDosAguas: [], claraboyas: [], portones: [],
    locales: [], vitrinas: [], toldos: [], remates: [], tanques: [], balcones: [],
  };
}

function agregarManzanas(escena) {
  const aleatorio = crearAleatorio(9);
  const lote = crearLote();
  const listas = crearListas();

  for (const celda of celdas) {
    const ancho = celda.x1 - celda.x0;
    const fondo = celda.z1 - celda.z0;
    const centro = [(celda.x0 + celda.x1) / 2, (celda.z0 + celda.z1) / 2];
    lote.caja([ancho, 0.05, fondo], [centro[0], 0.025, centro[1]], coloresEscena.asfaltoCiudad);
    lote.caja(
      [ancho - manzanas.anchoCalle * 2, ALTO_ACERA, fondo - manzanas.anchoCalle * 2],
      [centro[0], ALTO_ACERA / 2, centro[1]],
      celda.esParque ? coloresEscena.parque : coloresEscena.aceraCiudad,
    );
    if (!celda.esParque) for (const parcela of dividirEnParcelas(celda, aleatorio)) construirEdificio(parcela, celda, aleatorio, listas);
  }

  escena.add(
    lote.construir(),
    crearInstancias(cajaUnidad, listas.edificios, '#ffffff', { material: crearMaterialConVentanas() }),
    crearInstancias(cajaUnidad, listas.bodegas, '#ffffff'),
    crearInstancias(crearGeometriaPrisma(), listas.techosDosAguas, '#ffffff'),
    crearInstancias(cajaUnidad, listas.claraboyas, coloresEscena.claraboya, { sombras: false }),
    crearInstancias(cajaUnidad, listas.portones, coloresEscena.porton, { sombras: false }),
    crearInstancias(cajaUnidad, listas.locales, '#ffffff'),
    crearInstancias(cajaUnidad, listas.vitrinas, coloresEscena.vitrina, { sombras: false }),
    crearInstancias(new THREE.BoxGeometry(1, 0.04, 1).rotateX(0.45), listas.toldos, '#ffffff'),
    crearInstancias(cajaUnidad, listas.remates, coloresEscena.remate),
    crearInstancias(new THREE.CylinderGeometry(0.5, 0.5, 1, 10), listas.tanques, coloresEscena.tanque),
    crearInstancias(cajaUnidad, listas.balcones, coloresEscena.balcon),
  );
}

// Divide la acera de una manzana en parcelas
function dividirEnParcelas(celda, aleatorio) {
  const margen = manzanas.anchoCalle;
  const x0 = celda.x0 + margen;
  const x1 = celda.x1 - margen;
  const z0 = celda.z0 + margen;
  const z1 = celda.z1 - margen;
  const variedad = manzanas.lotesMaximos - manzanas.lotesMinimos + 1;
  const cantidad = celda.tipo === 'industrial'
    ? 1 + Math.floor(aleatorio() * manzanas.lotesIndustriales)
    : manzanas.lotesMinimos + Math.floor(aleatorio() * variedad);
  const dividirEnX = x1 - x0 >= z1 - z0;

  return Array.from({ length: cantidad }, (_, indice) => {
    const desde = indice / cantidad;
    const hasta = (indice + 1) / cantidad;
    const px0 = dividirEnX ? x0 + (x1 - x0) * desde : x0;
    const px1 = dividirEnX ? x0 + (x1 - x0) * hasta : x1;
    const pz0 = dividirEnX ? z0 : z0 + (z1 - z0) * desde;
    const pz1 = dividirEnX ? z1 : z0 + (z1 - z0) * hasta;
    return {
      x: (px0 + px1) / 2,
      z: (pz0 + pz1) / 2,
      ancho: px1 - px0 - RETIRO_LOTE * 2,
      fondo: pz1 - pz0 - RETIRO_LOTE * 2,
    };
  });
}

// Normal (x, z) de la fachada de la parcela que mira a la calle más cercana
function fachadaHaciaCalle(parcela, celda) {
  const distancias = [
    [parcela.x - celda.x0, [-1, 0]],
    [celda.x1 - parcela.x, [1, 0]],
    [parcela.z - celda.z0, [0, -1]],
    [celda.z1 - parcela.z, [0, 1]],
  ];
  return distancias.sort((a, b) => a[0] - b[0])[0][1];
}

const elegir = (aleatorio, lista) => lista[Math.floor(aleatorio() * lista.length)];

function construirEdificio(parcela, celda, aleatorio, listas) {
  if (celda.tipo === 'industrial') {
    construirBodega(parcela, celda, aleatorio, listas);
    return;
  }
  const esTorre = celda.permiteTorres && aleatorio() < manzanas.proporcionTorres;
  if (esTorre) construirTorre(parcela, celda, aleatorio, listas);
  else construirResidencial(parcela, celda, aleatorio, listas);
}

// Planta baja comercial: local claro, vitrina oscura y toldo de color hacia la calle
function agregarLocal(parcela, celda, aleatorio, listas, { ancho, fondo }) {
  listas.locales.push({ posicion: [parcela.x, ALTO_ACERA + ALTO_LOCAL / 2, parcela.z], escala: [ancho, ALTO_LOCAL, fondo], color: elegir(aleatorio, coloresEscena.localesCiudad) });
  const [nx, nz] = fachadaHaciaCalle(parcela, celda);
  const largoFachada = nx === 0 ? ancho : fondo;
  const distancia = (nx === 0 ? fondo : ancho) / 2;
  const giro = nx === 0 ? (nz > 0 ? 0 : Math.PI) : (nx > 0 ? Math.PI / 2 : -Math.PI / 2);
  listas.vitrinas.push({
    posicion: [parcela.x + nx * (distancia + 0.02), ALTO_ACERA + 0.45, parcela.z + nz * (distancia + 0.02)],
    escala: [largoFachada * 0.8, 0.55, 0.04],
    giro,
  });
  listas.toldos.push({
    posicion: [parcela.x + nx * (distancia + 0.3), ALTO_ACERA + ALTO_LOCAL - 0.05, parcela.z + nz * (distancia + 0.3)],
    escala: [largoFachada * 0.85, 1, 0.6],
    giro,
    color: elegir(aleatorio, coloresEscena.toldos),
  });
}

// Remates de techo: tanque de agua y cuarto de máquinas
function agregarRemates(x, z, yTecho, ancho, fondo, aleatorio, listas) {
  const lado = aleatorio() < 0.5 ? -1 : 1;
  listas.tanques.push({ posicion: [x + lado * ancho * 0.25, yTecho + 0.35, z - fondo * 0.2], escala: [0.7, 0.7, 0.7] });
  listas.remates.push({ posicion: [x - lado * ancho * 0.2, yTecho + 0.3, z + fondo * 0.15], escala: [Math.min(1.4, ancho * 0.3), 0.6, Math.min(1.2, fondo * 0.3)] });
}

// Ladrillo: local abajo, volumen principal y, si es alto, un retranqueo escalonado con terraza
function construirResidencial(parcela, celda, aleatorio, listas) {
  const alto = Math.round(entre(aleatorio, manzanas.alturaMinima, celda.alturaMaxima));
  const color = aleatorio() < 0.15 ? elegir(aleatorio, coloresEscena.clarosCiudad) : elegir(aleatorio, coloresEscena.ladrilloCiudad);
  const yBase = ALTO_ACERA + ALTO_LOCAL;
  agregarLocal(parcela, celda, aleatorio, listas, parcela);

  const conRetranqueo = alto >= 6 && aleatorio() < 0.6;
  const altoInferior = conRetranqueo ? Math.round(alto * 0.6) : alto;
  listas.edificios.push({ posicion: [parcela.x, yBase + altoInferior / 2, parcela.z], escala: [parcela.ancho, altoInferior, parcela.fondo], color });

  let yTecho = yBase + altoInferior;
  let ancho = parcela.ancho;
  let fondo = parcela.fondo;
  if (conRetranqueo) {
    ancho *= 0.72;
    fondo *= 0.72;
    const altoSuperior = alto - altoInferior;
    listas.edificios.push({ posicion: [parcela.x, yTecho + altoSuperior / 2, parcela.z], escala: [ancho, altoSuperior, fondo], color });
    yTecho += altoSuperior;
  }
  agregarRemates(parcela.x, parcela.z, yTecho, ancho, fondo, aleatorio, listas);
}

// Torre residencial clara: más esbelta, franjas de balcones y remate superior con antena
function construirTorre(parcela, celda, aleatorio, listas) {
  const alto = Math.round(entre(aleatorio, manzanas.alturaTorreMinima, manzanas.alturaTorreMaxima));
  const ancho = parcela.ancho * 0.75;
  const fondo = parcela.fondo * 0.75;
  const yBase = ALTO_ACERA + ALTO_LOCAL;
  agregarLocal(parcela, celda, aleatorio, listas, { ancho: parcela.ancho * 0.9, fondo: parcela.fondo * 0.9 });

  listas.edificios.push({ posicion: [parcela.x, yBase + alto / 2, parcela.z], escala: [ancho, alto, fondo], color: elegir(aleatorio, coloresEscena.clarosCiudad) });
  for (let y = yBase + SEPARACION_BALCONES; y < yBase + alto - 0.5; y += SEPARACION_BALCONES) {
    listas.balcones.push({ posicion: [parcela.x, y, parcela.z], escala: [ancho + 0.35, 0.08, fondo + 0.35] });
  }
  const yTecho = yBase + alto;
  listas.remates.push(
    { posicion: [parcela.x, yTecho + 0.4, parcela.z], escala: [ancho * 0.6, 0.8, fondo * 0.6] },
    { posicion: [parcela.x, yTecho + 1.5, parcela.z], escala: [0.08, 1.6, 0.08] },
  );
}

// Bodega: muros sin ventanas, techo a dos aguas con claraboyas y portón hacia la calle
function construirBodega(parcela, celda, aleatorio, listas) {
  const alto = Math.round(entre(aleatorio, 2, celda.alturaMaxima - 1));
  const color = elegir(aleatorio, coloresEscena.industrialCiudad);
  const yTecho = ALTO_ACERA + alto;
  listas.bodegas.push({ posicion: [parcela.x, ALTO_ACERA + alto / 2, parcela.z], escala: [parcela.ancho, alto, parcela.fondo], color });

  // Cumbrera a lo largo del lado más largo
  const largoEnX = parcela.ancho >= parcela.fondo;
  const [anchoTecho, largoTecho] = largoEnX ? [parcela.fondo, parcela.ancho] : [parcela.ancho, parcela.fondo];
  listas.techosDosAguas.push({
    posicion: [parcela.x, yTecho, parcela.z],
    escala: [anchoTecho + 0.2, 1.1, largoTecho + 0.2],
    giro: largoEnX ? Math.PI / 2 : 0,
    color: elegir(aleatorio, [coloresEscena.techoCiudad, '#b5b8bb', '#a8553a']),
  });
  for (let indice = -1; indice <= 1; indice++) {
    const desplazamiento = indice * largoTecho * 0.28;
    const lateral = anchoTecho * 0.22;
    listas.claraboyas.push({
      posicion: [parcela.x + (largoEnX ? desplazamiento : lateral), yTecho + 0.6, parcela.z + (largoEnX ? lateral : desplazamiento)],
      escala: largoEnX ? [largoTecho * 0.12, 0.08, anchoTecho * 0.18] : [anchoTecho * 0.18, 0.08, largoTecho * 0.12],
    });
  }

  const [nx, nz] = fachadaHaciaCalle(parcela, celda);
  const distancia = (nx === 0 ? parcela.fondo : parcela.ancho) / 2;
  listas.portones.push({
    posicion: [parcela.x + nx * (distancia + 0.02), ALTO_ACERA + 0.65, parcela.z + nz * (distancia + 0.02)],
    escala: [Math.min(2.4, (nx === 0 ? parcela.ancho : parcela.fondo) * 0.35), 1.3, 0.05],
    giro: nx === 0 ? 0 : Math.PI / 2,
  });
}

// Prisma triangular de base 1 x 1 y altura 1 (techo a dos aguas, cumbrera sobre el eje z)
function crearGeometriaPrisma() {
  const a = [-0.5, 0, -0.5];
  const b = [0.5, 0, -0.5];
  const c = [0, 1, -0.5];
  const d = [-0.5, 0, 0.5];
  const e = [0.5, 0, 0.5];
  const f = [0, 1, 0.5];
  const triangulos = [
    a, c, b, d, e, f,
    a, d, f, a, f, c,
    b, c, f, b, f, e,
    a, b, e, a, e, d,
  ];
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(triangulos.flat(), 3));
  geometria.computeVertexNormals();
  return geometria;
}

// Ventanas pintadas en el shader según la posición en el mundo; en la tarde algunas se encienden
function crearMaterialConVentanas() {
  const material = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const colorVentana = new THREE.Color(coloresEscena.ventanaCiudad);
  const colorTecho = new THREE.Color(coloresEscena.techoCiudad);
  const colorLuz = new THREE.Color(coloresEscena.luzVentana);

  material.onBeforeCompile = (sombreador) => {
    sombreador.uniforms.colorVentana = { value: colorVentana };
    sombreador.uniforms.colorTecho = { value: colorTecho };
    sombreador.uniforms.colorLuz = { value: colorLuz };
    sombreador.uniforms.encendido = ventanasEncendidas;
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
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosMundo;\nvarying vec3 vNormalMundo;\nuniform vec3 colorVentana;\nuniform vec3 colorTecho;\nuniform vec3 colorLuz;\nuniform float encendido;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float esFachada = 1.0 - step(0.5, abs(vNormalMundo.y));
        float horizontal = abs(vNormalMundo.x) > 0.5 ? vPosMundo.z : vPosMundo.x;
        vec2 coordenada = vec2(horizontal / 1.0, (vPosMundo.y - 0.15) / 0.95);
        vec2 celda = fract(coordenada);
        float ventana = step(0.25, celda.x) * step(celda.x, 0.75) * step(0.35, celda.y) * step(celda.y, 0.8);
        float sobrePlantaBaja = step(1.3, vPosMundo.y);
        float azar = fract(sin(dot(floor(coordenada) + vec2(vPosMundo.x + vPosMundo.z), vec2(12.9898, 78.233))) * 43758.5453);
        float luz = step(azar, 0.55) * encendido * ventana * esFachada * sobrePlantaBaja;
        diffuseColor.rgb = mix(diffuseColor.rgb, colorVentana, ventana * esFachada * sobrePlantaBaja * 0.75);
        diffuseColor.rgb = mix(diffuseColor.rgb, colorLuz, luz);
        diffuseColor.rgb = mix(diffuseColor.rgb, colorTecho, (1.0 - esFachada) * 0.55);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += colorLuz * luz * 0.55;`);
  };
  return material;
}

// Carrera 48, Calle 30 (con puente, rampas y oreja) y calle del sur, en una sola malla
function agregarCalles(escena) {
  const lote = crearLote();
  const mitad = MITAD_FRANJA;
  lote.caja([mitad * 2, 0.05, avenida.ancho], [0, 0.025, avenida.z], coloresEscena.asfalto);
  lote.caja([mitad * 2, 0.2, 0.4], [0, 0.1, avenida.z], coloresEscena.separador);
  agregarCalle30(lote);
  agregarCalleSur(lote);
  escena.add(lote.construir({ sombras: true }));

  const lineas = [];
  for (const zDivisoria of [avenida.z - 1.6, avenida.z + 1.6]) {
    for (let x = -mitad + 1; x < mitad - 1; x += 4) lineas.push({ posicion: [x, 0.06, zDivisoria], escala: [1.6, 0.01, 0.1] });
  }
  for (const xCalle of [calle30.x, calleSur.x]) {
    for (let z = -mitad + 1; z < calle30.inicioRampa - 1; z += 4) lineas.push({ posicion: [xCalle, 0.06, z], escala: [0.1, 0.01, 1.6] });
  }
  escena.add(crearInstancias(cajaUnidad, lineas, coloresEscena.lineaVia, { sombras: false }));
}

// Tramo recto inclinado entre dos alturas a lo largo de z
function tramoInclinado(lote, x, ancho, z0, z1, y0, y1) {
  const largo = Math.hypot(z1 - z0, y1 - y0);
  const angulo = Math.atan2(y1 - y0, z1 - z0);
  lote.caja([ancho, 0.3, largo], [x, (y0 + y1) / 2 + 0.15, (z0 + z1) / 2], coloresEscena.asfalto, [-angulo, 0, 0]);
}

function agregarCalle30(lote) {
  const { x, ancho, alturaPuente, inicioRampa, inicioPuente, finPuente, finRampa } = calle30;
  lote.caja([ancho, 0.04, inicioRampa + MITAD_TERRENO], [x, 0.02, (inicioRampa - MITAD_TERRENO) / 2], coloresEscena.asfalto);
  tramoInclinado(lote, x, ancho, inicioRampa, inicioPuente, 0, alturaPuente);
  lote.caja([ancho, 0.3, finPuente - inicioPuente], [x, alturaPuente + 0.15, (inicioPuente + finPuente) / 2], coloresEscena.asfalto);
  tramoInclinado(lote, x, ancho, finPuente, finRampa, alturaPuente, 0);
  lote.caja([ancho, 0.04, MITAD_TERRENO - finRampa], [x, 0.02, (finRampa + MITAD_TERRENO) / 2], coloresEscena.asfalto);

  // Barreras y pilares del puente
  for (const lado of [-1, 1]) {
    lote.caja([0.15, 0.35, finPuente - inicioPuente], [x + lado * (ancho / 2 - 0.08), alturaPuente + 0.47, (inicioPuente + finPuente) / 2], coloresEscena.barrera);
  }
  for (const zPilar of [inicioPuente + 0.4, rio.z - rio.ancho / 2 - 1, rio.z + rio.ancho / 2 + 1, finPuente - 0.4]) {
    lote.caja([ancho * 0.6, alturaPuente, 0.6], [x, alturaPuente / 2, zPilar], coloresEscena.concreto);
  }
  agregarOreja(lote);
}

// Oreja: rampa en curva que sube desde la Autopista Sur hasta la Calle 30
function agregarOreja(lote) {
  const { centro: [cx, cz], radio } = calle30.oreja;
  const anguloInicio = -Math.PI / 2;
  const recorrido = Math.PI * 1.5;
  const alturaMaxima = 1.4;
  const largoSegmento = (recorrido * radio) / SEGMENTOS_OREJA;
  for (let indice = 0; indice < SEGMENTOS_OREJA; indice++) {
    const t = (indice + 0.5) / SEGMENTOS_OREJA;
    const angulo = anguloInicio + recorrido * t;
    const y = Math.sin(Math.PI * t) * alturaMaxima;
    const px = cx + Math.cos(angulo) * radio;
    const pz = cz + Math.sin(angulo) * radio;
    lote.caja([2.2, 0.25, largoSegmento * 1.08], [px, y + 0.12, pz], coloresEscena.asfalto, [0, -angulo, 0]);
    if (y > 0.5 && indice % 4 === 0) lote.caja([0.4, y, 0.4], [px, y / 2, pz], coloresEscena.concreto);
  }
  // Empalmes con la Autopista Sur y con la Calle 30
  lote.caja([2.2, 0.06, 2.4], [cx, 0.03, cz - radio - 1], coloresEscena.asfalto);
  lote.caja([2.2, 0.06, 1.6], [cx - radio - 0.8, 0.12, cz], coloresEscena.asfalto, [0, Math.PI / 2, 0]);
}

// Calle del sur a nivel, con un puente bajo sobre el río
function agregarCalleSur(lote) {
  const { x, ancho } = calleSur;
  lote.caja([ancho, 0.04, MITAD_TERRENO * 2], [x, 0.02, 0], coloresEscena.asfalto);
  lote.caja([ancho + 0.4, 0.35, rio.ancho + 1.4], [x, 0.18, rio.z], coloresEscena.concreto);
  for (const lado of [-1, 1]) lote.caja([0.15, 0.3, rio.ancho + 1.4], [x + lado * (ancho / 2 + 0.1), 0.5, rio.z], coloresEscena.barrera);
}

// Palmeras frente a la plaza y entre el edificio y la avenida
function agregarPalmeras(escena) {
  const aleatorio = crearAleatorio(13);
  const posiciones = [];
  for (let x = -42; x <= 42; x += 5.25) {
    posiciones.push([x, 8.9]);
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

// Postes de luz junto a la avenida y en los separadores de las vías rápidas
function agregarPostes(escena) {
  const poste = mergeGeometries([
    new THREE.CylinderGeometry(0.05, 0.07, 3.4, 5).translate(0, 1.7, 0),
    new THREE.BoxGeometry(0.9, 0.06, 0.06).translate(0.45, 3.35, 0),
    new THREE.BoxGeometry(0.35, 0.1, 0.18).translate(0.85, 3.3, 0),
  ]);

  const postes = [];
  const zAcera = avenida.z - avenida.ancho / 2 - 0.5;
  const limite = calleSur.x - calleSur.ancho;
  for (let x = calle30.x + calle30.ancho; x <= limite; x += 8) {
    postes.push({ posicion: [x, 0, zAcera], escala: [1, 1, 1], giro: -Math.PI / 2 });
  }
  for (let x = -42; x <= 42; x += 10) {
    for (const via of vias) {
      postes.push({ posicion: [x, 0.2, via.z], escala: [1, 1, 1], giro: Math.PI / 2 });
      postes.push({ posicion: [x + 5, 0.2, via.z], escala: [1, 1, 1], giro: -Math.PI / 2 });
    }
  }
  escena.add(crearInstancias(poste, postes, coloresEscena.poste));
}
