// Colores de la interfaz (se vuelcan como variables CSS en :root)
export const coloresInterfaz = {
  '--color-menu': '#1f3a2e',
  '--color-menu-claro': '#2c4d3e',
  '--color-menu-icono': '#c9d6cc',
  '--color-acento': '#e8742c',
  '--color-acento-oscuro': '#d0631f',
  '--color-acento-suave': '#fbe3d2',
  '--color-superficie': 'rgb(255 255 255 / 0.88)',
  '--color-superficie-solida': '#ffffff',
  '--color-borde': 'rgb(31 58 46 / 0.12)',
  '--color-texto': '#1d2a24',
  '--color-texto-suave': '#5c6b63',
  '--color-cielo-arriba': '#9fcbea',
  '--color-cielo-abajo': '#e6f2f8',
};

// Colores de la escena 3D (paleta de Medellín de día)
export const coloresEscena = {
  // Suelo y vías
  cesped: '#7ea457',
  plaza: '#d9d7d1',
  anden: '#c9c7c1',
  asfalto: '#54585d',
  asfaltoCiudad: '#5f6368',
  aceraCiudad: '#cdcac3',
  separador: '#b7b4ad',
  lineaVia: '#f2f2ee',
  parque: '#76a052',

  // Río canalizado
  rio: '#8a7c58',
  brilloRio: '#cfc3a1',
  orilla: '#b4b1a9',

  // Tierra del bloque flotante (de arriba hacia abajo)
  capasTierra: ['#5b3f28', '#7a5737', '#9a7449'],
  roca: '#6f6a64',
  raiz: '#4a3626',
  cables: ['#1f2327', '#2b3035', '#d8762a', '#e0b23a', '#3a3f45'],
  tubo: '#a7acb0',

  // Vegetación
  troncoArbol: '#6b4f3a',
  copasArbol: ['#3f7a37', '#4d8a3f', '#5a9446', '#356b30', '#6a9c4a'],
  troncoPalma: '#8f7353',
  hojasPalma: '#467f35',

  // Cielo y fauna
  nube: '#ffffff',
  pajaro: '#33373b',

  // Tráfico y metro
  carros: ['#f2f2f2', '#d9dcdf', '#3a3f44', '#a9b1b8', '#c43c35', '#2d5d9f', '#e3c34b', '#1f2327'],
  concreto: '#bdbab3',
  vagon: '#d6dadd',
  franjaVagon: '#2a333b',
  techoEstacion: '#8f979c',
  poste: '#4f555b',

  // Ciudad: mayoría de ladrillo, algunas torres claras y de concreto
  ladrilloCiudad: ['#b4552f', '#a24a2a', '#c0663d', '#8f4026', '#b9603a', '#9c4a2e'],
  clarosCiudad: ['#e8e2d6', '#f1eee8', '#d8d4cc', '#a9a7a2'],
  ventanaCiudad: '#2f3a42',
  techoCiudad: '#8c8a86',

  // Edificio principal
  fachada: '#f1f2f2',
  ventana: '#7f97a8',
  losa: '#d4d7d9',
  aleta: '#ffffff',
  vidrioVerde: '#4f9a86',
  vidrioClaro: '#9fc2d3',
  vidrioLobby: '#6f8c9c',
  azotea: '#dcdad5',
  maquinas: '#9da1a5',
  resaltado: '#e8742c',

  // Oficina genérica (vista por la ventana)
  oficina: {
    piso: '#c8b89c',
    pared: '#f1efea',
    techo: '#fafaf8',
    lampara: '#fffbe9',
    escritorio: '#e9e4da',
    patas: '#6b7177',
    monitor: '#2a2f35',
    pantalla: '#8fc3e0',
    silla: '#3a4148',
    maceta: '#d9d3c7',
    hojas: '#4f8f3c',
    marco: '#f4f5f5',
    vidrio: '#cfe6f2',
    piel: '#f0c39c',
    cabello: ['#e8742c', '#4a3426', '#2b2522'],
    camisa: ['#f2c94c', '#5b8fc0', '#e8e4dc'],
    pantalon: ['#5b8fc0', '#3a4148', '#8a6a4c'],
    zapato: '#efe9df',
  },

  // Luces
  luzSol: '#fff3e0',
  luzCielo: '#dff0ff',
  luzSuelo: '#9cb889',
};
