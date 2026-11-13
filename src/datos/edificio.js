// Datos del edificio: cambiar aquí regenera toda la geometría

export const ALTURA_PISO = 1.1;

// Base común (el primer piso es el lobby)
export const base = {
  ancho: 28,
  fondo: 15,
  pisos: 3,
  alturaPiso: 1.35,
};

// Torres sobre la base (x, z = centro de la planta)
export const torres = [
  {
    id: 'torre-norte',
    nombre: 'Torre Norte',
    pisos: 24,
    ancho: 9,
    fondo: 9,
    x: -6.5,
    z: -1.5,
    ventanasPorLado: 4,
    azotea: { id: 'zona/azotea-norte', nombre: 'Azotea Norte' },
  },
  {
    id: 'torre-sur',
    nombre: 'Torre Sur',
    pisos: 18,
    ancho: 8,
    fondo: 8,
    x: 7,
    z: 1,
    ventanasPorLado: 4,
    azotea: { id: 'zona/azotea-sur', nombre: 'Azotea Sur' },
  },
];

// Zonas clicables a nivel de calle
export const zonas = {
  plaza: { id: 'zona/plaza', nombre: 'Plaza', ancho: 30, fondo: 6, z: 10.5 },
  lobby: { id: 'zona/lobby', nombre: 'Lobby' },
  base: { id: 'zona/base', nombre: 'Base' },
};
