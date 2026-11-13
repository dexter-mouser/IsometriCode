import * as THREE from 'three';
import { ALTURA_LOBBY, ALTURA_PISO, puentes, torres, zonas } from '../datos/edificio.js';
import { coloresEscena } from '../datos/tema.js';
import { crearPlanta } from './planta.js';
import { cajaUnidad, crearCaja, crearInstancias, crearLote } from './utilidades.js';

export const ESPESOR_LOSA = 0.12;
const RETRANQUEO_LOBBY = 0.6;
const SALIENTE_VENTANA = 0.03;
const ANCHO_RELATIVO_VENTANA = 0.55;
const ALTO_RELATIVO_VENTANA = 0.62;
const SALIENTE_VIDRIO = 0.4;
const NIVEL_HOVER = 1;
const NIVEL_SELECCION = 2;

const colorResaltado = new THREE.Color(coloresEscena.resaltado);
const MATRIZ_OCULTA = new THREE.Matrix4().makeScale(0, 0, 0);
const ZOOM_PISO = 3.9;
const ZOOM_VENTANA = 90;
const ZOOM_PUENTE = 14;
const ZOOM_PLAZA = 3.2;
const VISTA_OBLICUA = [0.5, 1];
const PORCENTAJE_ENCENDIDAS = 55;
const VISTA_A_LO_LARGO = [1, 0.45];

// Crea el edificio completo. Devuelve los clicables, el corte por piso y la animación de balizas
export function crearEdificio(escena) {
  const listas = { pisos: [], ventanas: [], losas: [], aletas: [] };
  for (const torre of torres) agregarTorre(torre, listas);

  const pisos = crearInstanciasEdificio(listas.pisos, coloresEscena.fachada, true);
  const ventanas = crearInstanciasEdificio(listas.ventanas, coloresEscena.ventana, true);
  const losas = crearInstanciasEdificio(listas.losas, coloresEscena.losa, false);
  const aletas = crearInstanciasEdificio(listas.aletas, coloresEscena.aleta, false);
  escena.add(pisos, ventanas, losas, aletas);

  const azoteas = new Map(torres.map((torre) => [torre.id, crearAzotea(escena, torre)]));
  const mallasPuentes = puentes.map((puente) => ({ puente, mallas: crearPuente(escena, puente) }));
  const animarBalizas = agregarVigilancia(escena);

  const clicables = [
    pisos,
    ventanas,
    ...torres.flatMap((torre) => crearLobby(escena, torre)),
    ...[...azoteas.values()].flat(),
    ...mallasPuentes.flatMap(({ mallas }) => mallas),
    ...crearPlazas(escena),
  ];

  const corte = crearCorte({
    escena,
    instanciadas: [
      { malla: pisos, lista: listas.pisos, incluyeActual: true },
      { malla: ventanas, lista: listas.ventanas, incluyeActual: true },
      { malla: aletas, lista: listas.aletas, incluyeActual: true },
      { malla: losas, lista: listas.losas, incluyeActual: false },
    ],
    azoteas,
    mallasPuentes,
  });

  // Tarde: parte de las ventanas se encienden con luz cálida
  const encenderVentanas = (valor) => {
    ventanas.userData.encender(valor);
    ventanas.material.emissive.set(coloresEscena.luzVentana).multiplyScalar(valor * 0.18);
  };

  return { clicables, ...corte, animar: animarBalizas, encenderVentanas };
}

// Oculta los pisos desde el elegido hacia arriba y muestra la planta con sus oficinas
function crearCorte({ escena, instanciadas, azoteas, mallasPuentes }) {
  const ocultas = [];
  let plantaActual = null;

  const ocultarInstancia = (malla, indice) => {
    const matriz = new THREE.Matrix4();
    malla.getMatrixAt(indice, matriz);
    ocultas.push({ malla, indice, matriz });
    malla.setMatrixAt(indice, MATRIZ_OCULTA);
  };

  const mostrarPlanta = ({ torre: torreId, piso }) => {
    const torre = torres.find((candidata) => candidata.id === torreId);
    for (const { malla, lista, incluyeActual } of instanciadas) {
      lista.forEach((caja, indice) => {
        const quedaArriba = caja.piso > piso || (incluyeActual && caja.piso === piso);
        if (caja.torre === torreId && quedaArriba) ocultarInstancia(malla, indice);
      });
      malla.instanceMatrix.needsUpdate = true;
    }
    for (const malla of azoteas.get(torreId)) malla.visible = false;
    for (const { puente, mallas } of mallasPuentes) {
      if (puente.pisoDesde + puente.pisos - 1 >= piso) for (const malla of mallas) malla.visible = false;
    }

    const yPiso = ALTURA_LOBBY + (piso - 1) * ALTURA_PISO + ESPESOR_LOSA;
    plantaActual = crearPlanta(torre, piso, yPiso);
    escena.add(plantaActual.grupo);
    return plantaActual.clicables;
  };

  const ocultarPlanta = () => {
    for (const { malla, indice, matriz } of ocultas) {
      malla.setMatrixAt(indice, matriz);
      malla.instanceMatrix.needsUpdate = true;
    }
    ocultas.length = 0;
    for (const mallas of azoteas.values()) for (const malla of mallas) malla.visible = true;
    for (const { mallas } of mallasPuentes) for (const malla of mallas) malla.visible = true;
    if (plantaActual) {
      escena.remove(plantaActual.grupo);
      plantaActual.liberar();
      plantaActual = null;
    }
  };

  return { mostrarPlanta, ocultarPlanta };
}

// Pisos de oficinas sobre el lobby, con ventanas, losas, aletas y volumen de vidrio
function agregarTorre(torre, listas) {
  for (let numero = 1; numero <= torre.pisos; numero++) {
    const y = ALTURA_LOBBY + (numero - 1) * ALTURA_PISO;
    const elementoPiso = {
      id: `${torre.id}/piso-${numero}`,
      tipo: 'piso',
      nombre: `${torre.nombre} · Piso ${numero}`,
      torre: torre.id,
      piso: numero,
      destino: { posicion: [torre.x, y + 0.3, 0], normal: VISTA_OBLICUA, zoom: ZOOM_PISO },
    };
    const marca = { torre: torre.id, piso: numero };

    listas.pisos.push({
      ...marca,
      posicion: [torre.x, y + ALTURA_PISO / 2, 0],
      escala: [torre.largo, ALTURA_PISO, torre.ancho],
      elemento: elementoPiso,
    });
    listas.losas.push({
      ...marca,
      posicion: [torre.x, y + ESPESOR_LOSA / 2, 0],
      escala: [torre.largo + 0.1, ESPESOR_LOSA, torre.ancho + 0.1],
    });
    agregarVentanas(torre, numero, y, listas.ventanas);
    agregarTramoVidrio(torre, y, elementoPiso, listas);
    agregarAletas(torre, numero, y, listas.aletas);
  }
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
        torre: torre.id,
        piso: numeroPiso,
        posicion: [x, yVentana, z],
        escala: [tramo * ANCHO_RELATIVO_VENTANA, altoVentana, 0.05],
        giro: fachada.giro,
        elemento: {
          id: `${torre.id}/piso-${numeroPiso}/ventana-${numeroVentana}`,
          tipo: 'ventana',
          nombre: `${torre.nombre} · Piso ${numeroPiso} · Ventana ${numeroVentana}`,
          destino: { posicion: [x, yVentana, z], normal: fachada.normal, zoom: ZOOM_VENTANA },
        },
      });
    }
  }
}

// Parasoles verticales en las fachadas largas, uno cada dos ventanas (un tramo por piso)
function agregarAletas(torre, numeroPiso, y, lista) {
  for (const fachada of fachadas(torre).filter((cara) => cara.ventanas === torre.ventanasLargo)) {
    const tramo = fachada.largo / fachada.ventanas;
    for (let indice = 0; indice <= fachada.ventanas; indice += 2) {
      const [x, z] = puntoEnFachada(torre, fachada, fachada.distancia + 0.12, -fachada.largo / 2 + indice * tramo);
      lista.push({ torre: torre.id, piso: numeroPiso, posicion: [x, y + ALTURA_PISO / 2, z], escala: [0.1, ALTURA_PISO, 0.24], giro: fachada.giro });
    }
  }
}

// Volumen de vidrio en el extremo de la torre: un tramo por piso, clicable como ese piso
function agregarTramoVidrio(torre, y, elementoPiso, listas) {
  const { extremo, largo, color } = torre.volumenVidrio;
  const x = torre.x + extremo * (torre.largo / 2 - largo / 2 + SALIENTE_VIDRIO);
  const escala = [largo, ALTURA_PISO, torre.ancho + SALIENTE_VIDRIO * 2];
  const marca = { torre: torre.id, piso: elementoPiso.piso };
  listas.pisos.push({ ...marca, posicion: [x, y + ALTURA_PISO / 2, 0], escala, color: coloresEscena[color], elemento: elementoPiso });
  listas.losas.push({ ...marca, posicion: [x, y + ESPESOR_LOSA / 2, 0], escala: [largo + 0.06, ESPESOR_LOSA, escala[2] + 0.06] });
}

// Cajas instanciadas; si son clicables guardan su elemento y resaltan todas las piezas del mismo id
function crearInstanciasEdificio(lista, color, esClicable) {
  const malla = crearInstancias(cajaUnidad, lista, color);
  if (!esClicable) return malla;

  const coloresBase = lista.map((caja) => new THREE.Color(caja.color ?? color));
  const niveles = new Uint8Array(lista.length);
  const indicesPorId = new Map();
  lista.forEach((caja, indice) => {
    const indices = indicesPorId.get(caja.elemento.id) ?? [];
    indices.push(indice);
    indicesPorId.set(caja.elemento.id, indices);
  });

  // Color de una pieza: base, luz de la tarde (si le toca encenderse) y resaltado
  const colorLuz = new THREE.Color(coloresEscena.luzVentana);
  const colorMezcla = new THREE.Color();
  let encendido = 0;
  const pintarPieza = (pieza) => {
    const nivel = niveles[pieza];
    const mezcla = nivel === NIVEL_SELECCION ? 0.7 : nivel === NIVEL_HOVER ? 0.4 : 0;
    const seEnciende = (pieza * 2654435761) % 100 < PORCENTAJE_ENCENDIDAS;
    colorMezcla.copy(coloresBase[pieza]);
    if (seEnciende) colorMezcla.lerp(colorLuz, encendido * 0.9);
    malla.setColorAt(pieza, colorMezcla.lerp(colorResaltado, mezcla));
  };

  malla.userData.elementos = lista.map((caja) => caja.elemento);
  malla.userData.resaltar = (indice, nivel) => {
    for (const pieza of indicesPorId.get(lista[indice].elemento.id)) {
      niveles[pieza] = nivel;
      pintarPieza(pieza);
    }
    malla.instanceColor.needsUpdate = true;
  };
  malla.userData.encender = (valor) => {
    encendido = valor;
    for (let pieza = 0; pieza < lista.length; pieza++) pintarPieza(pieza);
    malla.instanceColor.needsUpdate = true;
  };
  return malla;
}

// Marca varias mallas como una sola zona clicable
function registrarZona(escena, mallas, datosZona, tipo = 'zona', destino = null) {
  const elemento = { id: datosZona.id, tipo, nombre: datosZona.nombre, destino };
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

// Medidas de un puente entre las dos torres
function medidasPuente(puente) {
  const [torreA, torreB] = torres;
  const inicio = torreA.x + torreA.largo / 2;
  const fin = torreB.x - torreB.largo / 2;
  return {
    largo: fin - inicio + 0.4,
    xCentro: (inicio + fin) / 2,
    yInicio: ALTURA_LOBBY + (puente.pisoDesde - 1) * ALTURA_PISO,
    alto: puente.pisos * ALTURA_PISO,
  };
}

// Puente de vidrio verde: zona de vigilancia y control
function crearPuente(escena, puente) {
  const { largo, xCentro, yInicio, alto } = medidasPuente(puente);

  const vidrio = crearCaja([largo, alto, puente.ancho], [xCentro, yInicio + alto / 2, 0], coloresEscena.vidrioVerde);
  const marcos = [yInicio, yInicio + alto].map((yMarco) => crearCaja(
    [largo, 0.14, puente.ancho + 0.1],
    [xCentro, yMarco, 0],
    coloresEscena.losa,
  ));
  const destino = { posicion: [xCentro, yInicio + alto / 2, puente.ancho / 2], normal: [0, 1], zoom: ZOOM_PUENTE };
  return registrarZona(escena, [vidrio, ...marcos], puente, 'puente', destino);
}

// Cámaras bajo los puentes y balizas intermitentes encima
function agregarVigilancia(escena) {
  const balizas = [];
  const camaras = crearLote();
  for (const puente of puentes) {
    const { largo, xCentro, yInicio, alto } = medidasPuente(puente);
    for (const lado of [-1, 1]) {
      for (const frente of [-1, 1]) {
        camaras.caja([0.35, 0.22, 0.3], [xCentro + lado * (largo / 2 - 0.6), yInicio - 0.18, frente * (puente.ancho / 2 - 0.2)], coloresEscena.control.camara);
      }
      const color = lado < 0 ? coloresEscena.control.balizaRoja : coloresEscena.control.balizaAzul;
      const baliza = new THREE.Mesh(cajaUnidad, new THREE.MeshBasicMaterial({ color }));
      baliza.scale.set(0.22, 0.22, 0.22);
      baliza.position.set(xCentro + lado * 0.8, yInicio + alto + 0.2, 0);
      escena.add(baliza);
      balizas.push({ baliza, fase: lado < 0 ? 0 : Math.PI });
    }
  }
  escena.add(camaras.construir());
  return (tiempo) => {
    for (const { baliza, fase } of balizas) baliza.visible = Math.sin(tiempo * 4 + fase) > 0;
  };
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

  const destinoCentral = { posicion: [(inicioCentral + finCentral) / 2, 0, 0], normal: VISTA_OBLICUA, zoom: ZOOM_PLAZA * 1.2 };
  const destinoFrontal = { posicion: [16, 0, (zDesde + zHasta) / 2], normal: VISTA_A_LO_LARGO, zoom: ZOOM_PLAZA };
  return [
    ...registrarZona(escena, [central], zonas.plazaCentral, 'plaza', destinoCentral),
    ...registrarZona(escena, [frontal], zonas.plazaFrontal, 'plaza', destinoFrontal),
  ];
}
