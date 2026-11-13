// Ciudad alrededor del edificio (decorativa, sin clics)

// Bloque de tierra cuadrado que flota: mitad del lado, capas y profundidad de la roca
export const MITAD_TERRENO = 52;
export const terreno = {
  espesorCapas: [1.4, 3.2, 3.8],
  profundidadRoca: 11,
  divisionesRoca: 18,
  cantidadCables: 26,
  cantidadRaices: 14,
};

// Manzanas: 7 columnas entre la Calle 30 y la calle del sur; se descartan las que se salen del terreno.
// tipo 'industrial' = bodegas bajas de techo gris (Carrera 48); 'residencial' = ladrillo y torres
const ANCHO_COLUMNA = 90 / 7;
const columnasCompletas = Array.from({ length: 7 }, (_, indice) => [-45 + indice * ANCHO_COLUMNA, -45 + (indice + 1) * ANCHO_COLUMNA]);

export const bloquesManzanas = [
  // Franja industrial y comercial junto a la Carrera 48
  { columnas: columnasCompletas, filas: [[-28, -15]], tipo: 'industrial', alturaMaxima: 5 },
  // Barrios de ladrillo y torres hacia el oriente
  { columnas: columnasCompletas, filas: [[-41, -28], [-51.5, -41]], tipo: 'residencial', permiteTorres: true },
];

// Ladrillo bajo como en la mayoría de barrios, con algunas torres claras más altas
export const manzanas = {
  anchoCalle: 2,
  proporcionParques: 0.12,
  lotesMinimos: 2,
  lotesMaximos: 4,
  lotesIndustriales: 2,
  alturaMinima: 3,
  alturaMaxima: 10,
  proporcionTorres: 0.22,
  alturaTorreMinima: 13,
  alturaTorreMaxima: 22,
};

// Carrera 48 (Los Industriales): paralela al edificio por detrás, dos carriles por sentido
export const avenida = {
  z: -11.5,
  ancho: 6,
  carriles: [
    { coordenada: -13.8, sentido: 1, velocidad: 5 },
    { coordenada: -12.4, sentido: 1, velocidad: 6 },
    { coordenada: -10.6, sentido: -1, velocidad: 5.5 },
    { coordenada: -9.2, sentido: -1, velocidad: 6.5 },
  ],
  carrosPorCarril: 4,
};

// Del edificio hacia el occidente: metro, Avenida Regional, río y Autopista Sur
export const vias = [
  { nombre: 'Avenida Regional', z: 19, ancho: 8 },
  { nombre: 'Autopista Sur', z: 37, ancho: 8 },
];
export const rio = { z: 28, ancho: 6 };

// Metro elevado entre el edificio y la Regional; la estación queda al norte del edificio
export const metro = {
  z: 11.2,
  altura: 5,
  anchoTablero: 2.4,
  separacionPilares: 6,
  estacionX: -37,
  largoEstacion: 14,
  vagones: 3,
  largoVagon: 4,
  velocidad: 9,
  esperaSegundos: 5,
};

// Calle 30 al norte: a nivel detrás del edificio y elevada sobre la Regional, el río y la Autopista Sur.
// La oreja sube desde la Autopista Sur hasta el puente.
export const calle30 = {
  x: -48.5,
  ancho: 6,
  alturaPuente: 2.6,
  inicioRampa: 9,
  inicioPuente: 14,
  finPuente: 42.5,
  finRampa: 47.5,
  oreja: { centro: [-40.5, 47], radio: 3.6 },
};

// Calle a nivel en el extremo sur
export const calleSur = { x: 48.5, ancho: 5 };
