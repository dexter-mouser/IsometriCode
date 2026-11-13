import { coloresInterfaz } from './datos/tema.js';
import { crearEscenario, iniciarBucle } from './escena/escenario.js';
import { crearCamara } from './escena/camara.js';
import { crearEdificio } from './escena/edificio.js';
import { crearEntorno } from './escena/entorno.js';
import { crearCielo } from './escena/cielo.js';
import { crearCiudad } from './escena/ciudad.js';
import { crearMetro } from './escena/metro.js';
import { crearOficina } from './escena/oficina.js';
import { crearSeleccion } from './interaccion/seleccion.js';
import { crearVistas } from './interaccion/vistas.js';
import { ejecutarAccion } from './interaccion/acciones.js';
import { crearMenu } from './interfaz/menu.js';
import { crearPanel } from './interfaz/panel.js';
import { crearEtiqueta } from './interfaz/etiqueta.js';
import { mostrarAviso } from './interfaz/aviso.js';

// Tema: colores de la interfaz como variables CSS
for (const [variable, valor] of Object.entries(coloresInterfaz)) {
  document.documentElement.style.setProperty(variable, valor);
}

// Escena 3D de la ciudad
const lienzo = document.getElementById('lienzo');
const escenario = crearEscenario(lienzo);
const controlCamara = crearCamara(lienzo);
const { camara } = controlCamara;
const clicables = crearEdificio(escenario.escena);
const animarEntorno = crearEntorno(escenario.escena);
const animarCielo = crearCielo(escenario.escena);
crearCiudad(escenario.escena);
const animarMetro = crearMetro(escenario.escena);

// Oficina que se ve al entrar por una ventana
const oficina = crearOficina();

// Interfaz
crearMenu();
const mostrarEtiqueta = crearEtiqueta();
let seleccion = null;
let vistas = null;
const panel = crearPanel({
  alCerrar: () => {
    if (vistas.estaEnOficina()) vistas.salirOficina();
    seleccion.limpiarSeleccion();
  },
});

// Selección de pisos, ventanas y zonas
seleccion = crearSeleccion({
  lienzo,
  camara,
  clicables,
  alPasar: mostrarEtiqueta,
  alSeleccionar: (elemento) => ejecutarAccion(elemento, interfaz),
  alDeseleccionar: panel.cerrarPanel,
});

const vistaCiudad = {
  escena: escenario.escena,
  camara,
  actualizadores: [controlCamara.actualizar, animarEntorno, animarCielo, animarMetro, seleccion.actualizar],
};
const vistaOficina = { escena: oficina.escena, camara: oficina.camara, actualizadores: [oficina.actualizar] };
vistas = crearVistas({ ciudad: vistaCiudad, oficina: vistaOficina, controlCamara, seleccion });

// Herramientas que reciben las acciones
const interfaz = {
  abrirPanel: panel.abrirPanel,
  mostrarAviso,
  entrarOficina: (elemento, alLlegar) => {
    panel.cerrarPanel();
    vistas.entrarOficina(elemento, alLlegar);
  },
  salirOficina: () => {
    vistas.salirOficina();
    panel.cerrarPanel();
  },
};

// Doble clic en el fondo: volver a la vista inicial
lienzo.addEventListener('dblclick', () => {
  if (!seleccion.hayElementoBajoCursor()) controlCamara.reiniciar();
});

iniciarBucle(escenario.renderer, vistas.obtenerVista);

// Acceso para medir rendimiento en desarrollo
if (import.meta.env.DEV) window.escenaDesarrollo = escenario;
