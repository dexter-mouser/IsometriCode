// Datos del edificio: cambiar aquí regenera toda la geometría.
// Volumen lineal (~380 x 27 m, 54 m de alto) partido en dos torres por una plazoleta central
// y unido por puentes de vidrio. Escala: 1 unidad ≈ 4,5 m.

export const ALTURA_PISO = 0.95;
export const ALTURA_LOBBY = 1.3;

// Torres alineadas sobre el eje x; el frente largo mira al río (+z)
export const torres = [
  {
    id: 'torre-norte',
    nombre: 'Torre Norte',
    pisos: 12,
    largo: 38,
    ancho: 6.5,
    x: -23,
    ventanasLargo: 26,
    ventanasCorto: 4,
    volumenVidrio: { extremo: -1, largo: 5, color: 'vidrioVerde' },
    lobby: { id: 'zona/lobby-norte', nombre: 'Lobby Norte' },
    azotea: { id: 'zona/azotea-norte', nombre: 'Azotea Norte' },
  },
  {
    id: 'torre-sur',
    nombre: 'Torre Sur',
    pisos: 12,
    largo: 38,
    ancho: 6.5,
    x: 23,
    ventanasLargo: 26,
    ventanasCorto: 4,
    volumenVidrio: { extremo: 1, largo: 5, color: 'vidrioClaro' },
    lobby: { id: 'zona/lobby-sur', nombre: 'Lobby Sur' },
    azotea: { id: 'zona/azotea-sur', nombre: 'Azotea Sur' },
  },
];

// Puentes de vidrio sobre la plazoleta central (pisoDesde cuenta desde el primer piso de oficinas)
export const puentes = [
  { id: 'zona/puente-bajo', nombre: 'Puente Bajo', pisoDesde: 4, pisos: 2, ancho: 4 },
  { id: 'zona/puente-alto', nombre: 'Puente Alto', pisoDesde: 9, pisos: 2, ancho: 4 },
];

// Espacio público clicable
export const zonas = {
  plazaCentral: { id: 'zona/plaza-central', nombre: 'Plazoleta Central' },
  plazaFrontal: { id: 'zona/plaza-frontal', nombre: 'Plaza Frontal', zDesde: 3.25, zHasta: 9.4 },
};
