// Ciudad alrededor del edificio (decorativa, sin clics)

// Bloque de tierra cuadrado que flota: mitad del lado, capas y profundidad de la roca
export const MITAD_TERRENO = 62;
export const terreno = {
  espesorCapas: [1.4, 3.2, 3.8],
  profundidadRoca: 11,
  divisionesRoca: 18,
  cantidadCables: 26,
  cantidadRaices: 14,
};

// Manzanas: cuadrícula de celdas de 13 x 13; se descartan las que se salen del disco
const columnasCompletas = Array.from({ length: 9 }, (_, indice) => [-58.5 + indice * 13, -45.5 + indice * 13]);

export const bloquesManzanas = [
  // Detrás de la avenida
  { columnas: columnasCompletas, filas: [[-28, -15], [-41, -28], [-54, -41]], permiteTorres: true },
  // A los lados del edificio
  { columnas: [[-60, -47], [47, 60]], filas: [[-8, 5]], alturaMaxima: 8 },
  // Al otro lado del río y del metro (bajos para no tapar el edificio)
  { columnas: columnasCompletas, filas: [[38.5, 51.5]], alturaMaxima: 6 },
];

// Ladrillo bajo como en la mayoría de barrios, con algunas torres claras más altas
export const manzanas = {
  anchoCalle: 2,
  proporcionParques: 0.12,
  lotesMinimos: 2,
  lotesMaximos: 4,
  alturaMinima: 3,
  alturaMaxima: 10,
  proporcionTorres: 0.22,
  alturaTorreMinima: 13,
  alturaTorreMaxima: 22,
};

// Avenida paralela al edificio por detrás (eje x), dos carriles por sentido
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

// Metro elevado junto al río; la estación queda frente al edificio
export const metro = {
  z: 34.5,
  altura: 5,
  anchoTablero: 2.4,
  separacionPilares: 6,
  estacionX: 0,
  largoEstacion: 14,
  vagones: 3,
  largoVagon: 4,
  velocidad: 9,
  esperaSegundos: 5,
};
