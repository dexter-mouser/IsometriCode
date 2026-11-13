import * as THREE from 'three';
import { ALTURA_LOBBY, ALTURA_PISO, puentes, torres, zonas } from '../datos/edificio.js';
import { coloresEscena } from '../datos/tema.js';
import { cajaUnidad, crearCaja, crearInstancias } from './utilidades.js';

const ESPESOR_LOSA = 0.12;
const RETRANQUEO_LOBBY = 0.6;
const SALIENTE_VENTANA = 0.03;
const ANCHO_RELATIVO_VENTANA = 0.55;
const ALTO_RELATIVO_VENTANA = 0.62;
const SALIENTE_VIDRIO = 0.4;
const NIVEL_HOVER = 1;
const NIVEL_SELECCION = 2;

const colorResaltado = new THREE.Color(coloresEscena.resaltado);

// Crea el edificio completo y devuelve los objetos clicables
export function crearEdificio(escena) {
  const listas = { pisos: [], ventanas: [], losas: [], aletas: [] };
  for (const torre of torres) agregarTorre(torre, listas);

  const pisos = crearInstanciasEdificio(listas.pisos, coloresEscena.fachada, true);
  const ventanas = crearInstanciasEdificio(listas.ventanas, coloresEscena.ventana, true);
  const losas = crearInstanciasEdificio(listas.losas, coloresEscena.losa, false);
  const aletas = crearInstanciasEdificio(listas.aletas, coloresEscena.aleta, false);
  escena.add(pisos, ventanas, losas, aletas);

  return [
    pisos,
    ventanas,
    ...torres.flatMap((torre) => [...crearLobby(escena, torre), ...crearAzotea(escena, torre)]),
    ...puentes.flatMap((puente) => crearPuente(escena, puente)),
    ...crearPlazas(escena),
  ];
}

// Pisos de oficinas sobre el lobby, con ventanas, losas, aletas y volumen de vidrio
function agregarTorre(torre, listas) {
  for (let numero = 1; numero <= torre.pisos; numero++) {
    const y = ALTURA_LOBBY + (numero - 1) * ALTURA_PISO;
    const elementoPiso = { id: `${torre.id}/piso-${numero}`, tipo: 'piso', nombre: `${torre.nombre} · Piso ${numero}` };

    listas.pisos.push({
      posicion: [torre.x, y + ALTURA_PISO / 2, 0],
      escala: [torre.largo, ALTURA_PISO, torre.ancho],
      elemento: elementoPiso,
    });
    listas.losas.push({
      posicion: [torre.x, y + ESPESOR_LOSA / 2, 0],
      escala: [torre.largo + 0.1, ESPESOR_LOSA, torre.ancho + 0.1],
    });
    agregarVentanas(torre, numero, y, listas.ventanas);
    agregarTramoVidrio(torre, y, elementoPiso, listas);
  }
  agregarAletas(torre, listas.aletas);
}

// Fachadas de una torre: normal, eje a lo largo, largo, distancia al centro, giro y ventanas
function fachadas(torre) {
  const mitadLargo = torre.largo / 2;
  const mitadAncho = torre.ancho / 2;
  return [
    { normal: [0, 1], eje: [1, 0], largo: torre.largo, distancia: mitadAncho, giro: 0, ventanas: torre.ventanasLargo },
    { normal: [1, 0], eje: [0, -1], largo: torre.ancho, distancia: mitadLargo, giro: Math.PI / 2, ventanas: torre.ventanasCorto },
    { normal: [0, -1], eje: [-1, 0], largo: torre.largo, distancia: mitadAncho, giro: 0, ventanas: torre.ventanasLargo },
    { normal: [-1, 0], eje: [0, 1], largo: torre.ancho, distancia: mitadLargo, giro: Math.PI / 2, ventanas: torre.ventanasCorto },
  ];
}

// Punto sobre una fachada a cierta distancia de su centro
function puntoEnFachada(torre, fachada, separacion, desplazamiento) {
  return [
    torre.x + fachada.normal[0] * separacion + fachada.eje[0] * desplazamiento,
    fachada.normal[1] * separacion + fachada.eje[1] * desplazamiento,
  ];
}

function agregarVentanas(torre, numeroPiso, y, lista) {
  const altoVentana = (ALTURA_PISO - ESPESOR_LOSA) * ALTO_RELATIVO_VENTANA;
  const yVentana = y + ESPESOR_LOSA + (ALTURA_PISO - ESPESOR_LOSA) / 2;
  let numeroVentana = 0;

  for (const fachada of fachadas(torre)) {
    const tramo = fachada.largo / fachada.ventanas;
    for (let indice = 0; indice < fachada.ventanas; indice++) {
      numeroVentana++;
      const [x, z] = puntoEnFachada(torre, fachada, fachada.distancia + SALIENTE_VENTANA, -fachada.largo / 2 + (indice + 0.5) * tramo);
      lista.push({
        posicion: [x, yVentana, z],
        escala: [tramo * ANCHO_RELATIVO_VENTANA, altoVentana, 0.05],
        giro: fachada.giro,
        elemento: {
          id: `${torre.id}/piso-${numeroPiso}/ventana-${numeroVentana}`,
          tipo: 'ventana',
          nombre: `${torre.nombre} · Piso ${numeroPiso} · Ventana ${numeroVentana}`,
          posicion: [x, yVentana, z],
          normal: fachada.normal,
        },
      });
    }
  }
}

// Parasoles verticales en las fachadas largas, uno cada dos ventanas
function agregarAletas(torre, lista) {
  const alto = torre.pisos * ALTURA_PISO;
  for (const fachada of fachadas(torre).filter((cara) => cara.ventanas === torre.ventanasLargo)) {
    const tramo = fachada.largo / fachada.ventanas;
    for (let indice = 0; indice <= fachada.ventanas; indice += 2) {
      const [x, z] = puntoEnFachada(torre, fachada, fachada.distancia + 0.12, -fachada.largo / 2 + indice * tramo);
      lista.push({ posicion: [x, ALTURA_LOBBY + alto / 2, z], escala: [0.1, alto, 0.24], giro: fachada.giro });
    }
  }
}

// Volumen de vidrio en el extremo de la torre: un tramo por piso, clicable como ese piso
function agregarTramoVidrio(torre, y, elementoPiso, listas) {
  const { extremo, largo, color } = torre.volumenVidrio;
  const x = torre.x + extremo * (torre.largo / 2 - largo / 2 + SALIENTE_VIDRIO);
  const escala = [largo, ALTURA_PISO, torre.ancho + SALIENTE_VIDRIO * 2];
  listas.pisos.push({ posicion: [x, y + ALTURA_PISO / 2, 0], escala, color: coloresEscena[color], elemento: elementoPiso });
  listas.losas.push({ posicion: [x, y + ESPESOR_LOSA / 2, 0], escala: [largo + 0.06, ESPESOR_LOSA, escala[2] + 0.06] });
}

// Cajas instanciadas; si son clicables guardan su elemento y resaltan todas las piezas del mismo id
function crearInstanciasEdificio(lista, color, esClicable) {
  const malla = crearInstancias(cajaUnidad, lista, color);
  if (!esClicable) return malla;

  const coloresBase = lista.map((caja) => new THREE.Color(caja.color ?? color));
  const indicesPorId = new Map();
  lista.forEach((caja, indice) => {
    const indices = indicesPorId.get(caja.elemento.id) ?? [];
    indices.push(indice);
    indicesPorId.set(caja.elemento.id, indices);
  });

  const colorMezcla = new THREE.Color();
  malla.userData.elementos = lista.map((caja) => caja.elemento);
  malla.userData.resaltar = (indice, nivel) => {
    const mezcla = nivel === NIVEL_SELECCION ? 0.7 : nivel === NIVEL_HOVER ? 0.4 : 0;
    for (const pieza of indicesPorId.get(lista[indice].elemento.id)) {
      malla.setColorAt(pieza, colorMezcla.copy(coloresBase[pieza]).lerp(colorResaltado, mezcla));
    }
    malla.instanceColor.needsUpdate = true;
  };
  return malla;
}

// Marca varias mallas como una sola zona clicable
function registrarZona(escena, mallas, datosZona) {
  const elemento = { id: datosZona.id, tipo: 'zona', nombre: datosZona.nombre };
  const resaltar = (_indice, nivel) => {
    const intensidad = nivel === NIVEL_SELECCION ? 0.45 : nivel === NIVEL_HOVER ? 0.22 : 0;
    for (const malla of mallas) malla.material.emissive.copy(colorResaltado).multiplyScalar(intensidad);
  };
  for (const malla of mallas) {
    malla.userData.elemento = elemento;
    malla.userData.resaltar = resaltar;
    escena.add(malla);
  }
  return mallas;
}

// Planta baja de vidrio retranqueada con columnas
function crearLobby(escena, torre) {
  const vidrio = crearCaja(
    [torre.largo - RETRANQUEO_LOBBY * 2, ALTURA_LOBBY, torre.ancho - RETRANQUEO_LOBBY * 2],
    [torre.x, ALTURA_LOBBY / 2, 0],
    coloresEscena.vidrioLobby,
  );

  const columnas = [];
  for (const lado of [-1, 1]) {
    for (let dx = -torre.largo / 2 + 0.3; dx <= torre.largo / 2 - 0.3; dx += 3.4) {
      columnas.push({ posicion: [torre.x + dx, ALTURA_LOBBY / 2, lado * (torre.ancho / 2 - 0.2)], escala: [0.25, ALTURA_LOBBY, 0.25] });
    }
  }
  escena.add(crearInstanciasEdificio(columnas, coloresEscena.aleta, false));
  return registrarZona(escena, [vidrio], torre.lobby);
}

// Azotea con pretil y cuartos de máquinas
function crearAzotea(escena, torre) {
  const yTecho = ALTURA_LOBBY + torre.pisos * ALTURA_PISO;
  const losa = crearCaja([torre.largo + 0.1, 0.25, torre.ancho + 0.1], [torre.x, yTecho + 0.12, 0], coloresEscena.azotea);
  const maquinas = [-0.25, 0.15].map((posicion, indice) => crearCaja(
    [torre.largo * 0.18, 0.7, torre.ancho * 0.45],
    [torre.x + posicion * torre.largo, yTecho + 0.6, indice === 0 ? -0.8 : 0.6],
    coloresEscena.maquinas,
  ));
  return registrarZona(escena, [losa, ...maquinas], torre.azotea);
}

// Puente de vidrio verde que cruza la plazoleta central
function crearPuente(escena, puente) {
  const [torreA, torreB] = torres;
  const inicio = torreA.x + torreA.largo / 2;
  const fin = torreB.x - torreB.largo / 2;
  const largo = fin - inicio + 0.4;
  const xCentro = (inicio + fin) / 2;
  const yInicio = ALTURA_LOBBY + (puente.pisoDesde - 1) * ALTURA_PISO;
  const alto = puente.pisos * ALTURA_PISO;

  const vidrio = crearCaja([largo, alto, puente.ancho], [xCentro, yInicio + alto / 2, 0], coloresEscena.vidrioVerde);
  const marcos = [yInicio, yInicio + alto].map((yMarco) => crearCaja(
    [largo, 0.14, puente.ancho + 0.1],
    [xCentro, yMarco, 0],
    coloresEscena.losa,
  ));
  return registrarZona(escena, [vidrio, ...marcos], puente);
}

// Plazoleta central entre torres y plaza frontal hacia el río
function crearPlazas(escena) {
  const [torreA, torreB] = torres;
  const izquierda = torreA.x - torreA.largo / 2 - 2;
  const derecha = torreB.x + torreB.largo / 2 + 2;
  const inicioCentral = torreA.x + torreA.largo / 2;
  const finCentral = torreB.x - torreB.largo / 2;
  const { zDesde, zHasta } = zonas.plazaFrontal;

  const central = crearCaja([finCentral - inicioCentral, 0.12, torreA.ancho + 2], [(inicioCentral + finCentral) / 2, 0.06, 0], coloresEscena.plaza, { sombras: false });
  const frontal = crearCaja([derecha - izquierda, 0.1, zHasta - zDesde], [(izquierda + derecha) / 2, 0.05, (zDesde + zHasta) / 2], coloresEscena.plaza, { sombras: false });
  const trasera = crearCaja([derecha - izquierda, 0.1, 4], [(izquierda + derecha) / 2, 0.05, -torreA.ancho / 2 - 2], coloresEscena.plaza, { sombras: false });
  escena.add(trasera);

  return [
    ...registrarZona(escena, [central], zonas.plazaCentral),
    ...registrarZona(escena, [frontal], zonas.plazaFrontal),
  ];
}
