import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { avenida, MITAD_TERRENO } from '../datos/ciudad.js';
import { coloresEscena } from '../datos/tema.js';
import { centrosParques, MITAD_FRANJA, zonaOcupada } from './ciudad.js';
import { crearTerreno } from './terreno.js';
import { cajaUnidad, crearAleatorio, crearCaja, crearInstancias, entre, pintarGeometria } from './utilidades.js';

// Disposición del terreno (eje z hacia el frente del edificio)
const ANDEN = { z: 14.25, ancho: 1.5 };
const VIA = { z: 19, ancho: 8 };
const SEPARADOR = { z: 19, ancho: 0.8 };
const RIO = { z: 28, ancho: 6 };
const LIMITE_VIA = MITAD_FRANJA - 1;
const LIMITE_AVENIDA = MITAD_FRANJA - 1;

// Carriles: autopista y avenida, ambas sobre el eje x
const CARRILES = [
  ...[[15.9, -1, 6.5], [17.7, -1, 5], [20.3, 1, 5.5], [22.1, 1, 7]].map(([coordenada, sentido, velocidad]) => ({
    eje: 'x', coordenada, sentido, velocidad, minimo: -LIMITE_VIA, maximo: LIMITE_VIA, carros: 6,
  })),
  ...avenida.carriles.map((carril) => ({
    ...carril, eje: 'x', minimo: -LIMITE_AVENIDA, maximo: LIMITE_AVENIDA, carros: avenida.carrosPorCarril,
  })),
];
const CANTIDAD_ARBOLES = 120;
const CANTIDAD_BRILLOS = 32;
const ZONA_SIN_ARBOLES = { xMin: -46, xMax: 46, zMin: -8, zMax: 36 };

// Terreno, autopista, río y árboles; devuelve la función de animación
export function crearEntorno(escena) {
  escena.add(crearTerreno());
  agregarMurosRio(escena);
  agregarAutopista(escena);
  const animarBrillos = agregarRio(escena);
  agregarArboles(escena);
  const animarCarros = agregarCarros(escena);

  return (delta, tiempo) => {
    animarCarros(delta);
    animarBrillos(delta, tiempo);
  };
}

// Muros de concreto del río canalizado
function agregarMurosRio(escena) {
  for (const lado of [-1, 1]) {
    escena.add(crearCaja([MITAD_FRANJA * 2, 0.5, 0.35], [0, 0.25, RIO.z + lado * (RIO.ancho / 2 + 0.17)], coloresEscena.orilla));
  }
}

// Largo de una franja horizontal: el terreno es cuadrado, todas llegan al borde
function largoFranja() {
  return MITAD_FRANJA * 2;
}

function crearFranja(z, ancho, alto, color) {
  return crearCaja([largoFranja(z, ancho), alto, ancho], [0, alto / 2, z], color, { sombras: false });
}

// Andén, asfalto, separador y líneas
function agregarAutopista(escena) {
  escena.add(
    crearFranja(ANDEN.z, ANDEN.ancho, 0.1, coloresEscena.anden),
    crearFranja(VIA.z, VIA.ancho, 0.05, coloresEscena.asfalto),
    crearFranja(SEPARADOR.z, SEPARADOR.ancho, 0.2, coloresEscena.separador),
  );

  const lineas = [];
  for (const zBorde of [VIA.z - VIA.ancho / 2 + 0.15, VIA.z + VIA.ancho / 2 - 0.15]) {
    lineas.push({ posicion: [0, 0.06, zBorde], escala: [largoFranja(zBorde, 0.1), 0.01, 0.1] });
  }
  for (const zDivisoria of [16.8, 21.2]) {
    const limite = largoFranja(zDivisoria, 0.1) / 2 - 1;
    for (let x = -limite; x < limite; x += 4) {
      lineas.push({ posicion: [x, 0.06, zDivisoria], escala: [1.6, 0.01, 0.1] });
    }
  }
  escena.add(crearInstancias(cajaUnidad, lineas, coloresEscena.lineaVia, { sombras: false }));
}

// Río con orillas y brillos que fluyen
function agregarRio(escena) {
  escena.add(
    crearFranja(RIO.z, RIO.ancho, 0.04, coloresEscena.rio),
  );

  const aleatorio = crearAleatorio(7);
  const limite = largoFranja(RIO.z, RIO.ancho) / 2 - 1;
  const brillos = Array.from({ length: CANTIDAD_BRILLOS }, () => ({
    x: entre(aleatorio, -limite, limite),
    z: entre(aleatorio, RIO.z - RIO.ancho / 2 + 0.6, RIO.z + RIO.ancho / 2 - 0.6),
    largo: entre(aleatorio, 0.6, 1.6),
    velocidad: entre(aleatorio, 0.8, 1.6),
    fase: aleatorio() * Math.PI * 2,
  }));

  const material = new THREE.MeshBasicMaterial({ color: coloresEscena.brilloRio, transparent: true, opacity: 0.7 });
  const malla = new THREE.InstancedMesh(cajaUnidad, material, brillos.length);
  malla.frustumCulled = false;
  escena.add(malla);
  const auxiliar = new THREE.Object3D();

  return (delta, tiempo) => {
    brillos.forEach((brillo, indice) => {
      brillo.x += brillo.velocidad * delta;
      if (brillo.x > limite) brillo.x = -limite;
      const pulso = 0.6 + 0.4 * Math.sin(tiempo * 1.5 + brillo.fase);
      auxiliar.position.set(brillo.x, 0.05, brillo.z);
      auxiliar.scale.set(brillo.largo * pulso, 0.01, 0.07);
      auxiliar.updateMatrix();
      malla.setMatrixAt(indice, auxiliar.matrix);
    });
    malla.instanceMatrix.needsUpdate = true;
  };
}

function puedeTenerArbol(x, z) {
  const dentroDelDisco = Math.max(Math.abs(x), Math.abs(z)) < MITAD_TERRENO - 1.5;
  const enZonaLibre = x > ZONA_SIN_ARBOLES.xMin && x < ZONA_SIN_ARBOLES.xMax && z > ZONA_SIN_ARBOLES.zMin && z < ZONA_SIN_ARBOLES.zMax;
  const enViaORio = z > ANDEN.z - 1.5 && z < RIO.z + RIO.ancho / 2 + 1;
  return dentroDelDisco && !enZonaLibre && !enViaORio && !zonaOcupada(x, z);
}

// Árboles low-poly agrupados (tronco + copa, dos mallas instanciadas)
function agregarArboles(escena) {
  const aleatorio = crearAleatorio(21);
  const troncos = [];
  const copas = [];
  const centrosGrupo = [
    ...centrosParques,
    ...Array.from({ length: 12 }, () => [entre(aleatorio, -58, 58), entre(aleatorio, -58, 58)]),
  ];

  let intentos = 0;
  while (copas.length < CANTIDAD_ARBOLES && intentos < 2000) {
    intentos++;
    const [cx, cz] = centrosGrupo[Math.floor(aleatorio() * centrosGrupo.length)];
    const x = cx + entre(aleatorio, -5, 5);
    const z = cz + entre(aleatorio, -5, 5);
    if (!puedeTenerArbol(x, z)) continue;

    const tamano = entre(aleatorio, 0.8, 1.4);
    troncos.push({ posicion: [x, 0.5 * tamano, z], escala: [tamano, tamano, tamano] });
    copas.push({
      posicion: [x, 1.7 * tamano, z],
      escala: [tamano, tamano * entre(aleatorio, 1, 1.3), tamano],
      giro: aleatorio() * Math.PI,
      color: coloresEscena.copasArbol[Math.floor(aleatorio() * coloresEscena.copasArbol.length)],
    });
  }

  const geometriaTronco = new THREE.CylinderGeometry(0.12, 0.18, 1, 6);
  const geometriaCopa = new THREE.IcosahedronGeometry(0.95, 0);
  const materialCopa = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
  escena.add(
    crearInstancias(geometriaTronco, troncos, coloresEscena.troncoArbol),
    crearInstancias(geometriaCopa, copas, '#ffffff', { material: materialCopa }),
  );
}

// Geometría de carro: carrocería y cabina oscura unidas
function crearGeometriaCarro() {
  const carroceria = pintarGeometria(new THREE.BoxGeometry(1.9, 0.45, 0.9).translate(0, 0.35, 0), '#ffffff');
  const cabina = pintarGeometria(new THREE.BoxGeometry(1.0, 0.38, 0.8).translate(-0.1, 0.76, 0), '#3b4652');
  return mergeGeometries([carroceria, cabina]);
}

// Giro del carro según el eje y el sentido en que avanza
function giroCarro({ eje, sentido }) {
  if (eje === 'x') return sentido > 0 ? 0 : Math.PI;
  return sentido > 0 ? -Math.PI / 2 : Math.PI / 2;
}

// Carros que circulan en bucle por la autopista y la avenida
function agregarCarros(escena) {
  const aleatorio = crearAleatorio(3);
  const carros = [];
  for (const carril of CARRILES) {
    const espaciado = (carril.maximo - carril.minimo) / carril.carros;
    for (let indice = 0; indice < carril.carros; indice++) {
      carros.push({ carril, avance: carril.minimo + indice * espaciado + entre(aleatorio, 0, espaciado * 0.6) });
    }
  }

  const material = new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true });
  const malla = new THREE.InstancedMesh(crearGeometriaCarro(), material, carros.length);
  const color = new THREE.Color();
  carros.forEach((_, indice) => {
    malla.setColorAt(indice, color.set(coloresEscena.carros[Math.floor(aleatorio() * coloresEscena.carros.length)]));
  });
  malla.castShadow = true;
  malla.frustumCulled = false;
  escena.add(malla);

  const auxiliar = new THREE.Object3D();
  return (delta) => {
    carros.forEach((carro, indice) => {
      const { eje, coordenada, sentido, velocidad, minimo, maximo } = carro.carril;
      carro.avance += sentido * velocidad * delta;
      if (carro.avance > maximo) carro.avance = minimo;
      if (carro.avance < minimo) carro.avance = maximo;
      if (eje === 'x') auxiliar.position.set(carro.avance, 0.05, coordenada);
      else auxiliar.position.set(coordenada, 0.05, carro.avance);
      auxiliar.rotation.y = giroCarro(carro.carril);
      auxiliar.updateMatrix();
      malla.setMatrixAt(indice, auxiliar.matrix);
    });
    malla.instanceMatrix.needsUpdate = true;
  };
}
