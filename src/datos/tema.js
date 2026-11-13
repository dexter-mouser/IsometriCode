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
  rio: '#3f86b4',
  brilloRio: '#d3ecf7',
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
  industrialCiudad: ['#d4d6d7', '#c2c5c7', '#aeb2b5', '#e2ded6', '#b9a99a', '#a8553a'],
  ventanaCiudad: '#2f3a42',
  luzVentana: '#ffd27a',
  localesCiudad: ['#f1ece2', '#e2ded6', '#d9d4cc', '#efe6d6'],
  vitrina: '#4d6676',
  toldos: ['#e8742c', '#2f6db5', '#4c9a6a', '#d64545', '#f2c94c'],
  claraboya: '#dfe9ee',
  porton: '#4a4f55',
  balcon: '#f4f2ee',
  remate: '#9a9893',
  tanque: '#b9bcbf',
  barrera: '#d8d6d0',
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
    sofa: '#5b8fc0',
    mesaJuntas: '#8a6a4c',
    estante: '#b08d68',
    pantallaJuntas: '#2f4a63',
    cocina: '#d9d3c7',
    pasillo: '#d6d3cc',
    muroPlanta: '#ffffff',
    // Variantes por oficina (se eligen con el id del piso o la ventana)
    variantes: {
      silla: ['#3a4148', '#2f6db5', '#4c9a6a', '#8a4a3c', '#5b5f66'],
      sofa: ['#5b8fc0', '#e8742c', '#6a9c4a', '#b55a5a', '#7a6ab0'],
      madera: ['#8a6a4c', '#b08d68', '#5e4636', '#c9b391'],
      acento: ['#f1efea', '#d9e8f2', '#f3e2cf', '#dfeadb', '#4f9a86', '#e8742c'],
      piso: ['#c8b89c', '#b9b4ab', '#d9cdb5', '#a98a6a', '#c7ccd1'],
    },
    pisos: {
      abierta: '#d9cdb5',
      juntas: '#bcc6cd',
      privada: '#b48f6b',
      descanso: '#cfe0c4',
      control: '#3a4148',
    },
  },

  // Sala de control del puente
  control: {
    fondo: '#1c2127',
    pared: '#2a3038',
    consola: '#3a4350',
    pantallas: ['#36c2d6', '#4cd28a', '#2f7fd1', '#e8742c', '#9be3f0'],
    camara: '#2a2f35',
    balizaRoja: '#ff3b30',
    balizaAzul: '#2f7fd1',
  },

  // Mobiliario y personas de la plaza
  decoPlaza: {
    banca: '#8a6a4c',
    jardinera: '#bdb8ae',
    agua: '#5fb2d8',
    fuente: '#e2dfd8',
    franja: '#c4c1ba',
    personas: ['#e8742c', '#2f6db5', '#f2c94c', '#d64545', '#3a3f44', '#4c9a6a'],
  },

  // Ambientes de luz: día y tarde (el botón del menú alterna entre ellos)
  ambientes: {
    dia: {
      sol: '#fff3e0', intensidadSol: 2.4, posicionSol: [28, 48, 22],
      cielo: '#dff0ff', suelo: '#9cb889', intensidadCielo: 1.6,
      cieloArriba: '#9fcbea', cieloAbajo: '#e6f2f8',
    },
    tarde: {
      sol: '#ffa45c', intensidadSol: 1.7, posicionSol: [46, 16, 6],
      cielo: '#f5c8a2', suelo: '#6f6352', intensidadCielo: 1.05,
      cieloArriba: '#e98a5c', cieloAbajo: '#fbd9b4',
    },
  },

  // Luces
  luzSol: '#fff3e0',
  luzCielo: '#dff0ff',
  luzSuelo: '#9cb889',
};
