import { coloresInterfaz } from './datos/tema.js';
import { torres } from './datos/edificio.js';
import { crearEscenario, iniciarBucle } from './escena/escenario.js';
import { crearCamara } from './escena/camara.js';
import { crearEdificio } from './escena/edificio.js';
import { crearPlaza } from './escena/plaza.js';
import { crearEntorno } from './escena/entorno.js';
import { crearCielo } from './escena/cielo.js';
import { crearCiudad, encenderVentanasCiudad } from './escena/ciudad.js';
import { crearAmbiente } from './escena/ambiente.js';
import { crearMetro } from './escena/metro.js';
import { crearOficina } from './escena/oficina.js';
import { crearSeleccion } from './interaccion/seleccion.js';
import { crearVistas } from './interaccion/vistas.js';
import { crearTeclado } from './interaccion/teclado.js';
import { ejecutarAccion } from './interaccion/acciones.js';
import { crearMenu } from './interfaz/menu.js';
import { crearPanel } from './interfaz/panel.js';
import { crearEtiqueta } from './interfaz/etiqueta.js';
import { crearControlZoom } from './interfaz/zoom.js';
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
const edificio = crearEdificio(escenario.escena);
const animarPlaza = crearPlaza(escenario.escena);
const animarEntorno = crearEntorno(escenario.escena);
const animarCielo = crearCielo(escenario.escena, () => camara.zoom);
crearCiudad(escenario.escena);
const animarMetro = crearMetro(escenario.escena);

// Interiores que se ven a través de una ventana o del puente
const oficina = crearOficina();

// Día / Tarde: luces, cielo y ventanas encendidas en ciudad, edificio e interiores
const ambiente = crearAmbiente({
  luces: escenario.luces,
  alCambiar: (valor) => {
    edificio.encenderVentanas(valor);
    encenderVentanasCiudad(valor);
    oficina.establecerTarde(valor);
  },
});

// Interfaz
crearMenu();
const botonAmbiente = document.getElementById('boton-ambiente');
botonAmbiente.addEventListener('click', () => {
  const enTarde = ambiente.alternar();
  botonAmbiente.setAttribute('aria-pressed', String(enTarde));
  botonAmbiente.setAttribute('aria-label', enTarde ? 'Cambiar a día' : 'Cambiar a tarde');
  document.getElementById('etiqueta-ambiente').textContent = enTarde ? 'Día' : 'Tarde';
  mostrarAviso(enTarde ? 'Tarde' : 'Día');
});
const mostrarEtiqueta = crearEtiqueta();
const controlZoom = crearControlZoom({ alCambiar: controlCamara.establecerZoom });
controlCamara.alCambiarZoom(controlZoom.mostrarZoom);

let seleccion = null;
let vistas = null;
const panel = crearPanel({
  // Cerrar el panel (X o Esc) dentro de un nivel equivale a «Volver»
  alCerrar: () => {
    if (vistas.nivelActual() !== 'ciudad' && !vistas.estaEnTransicion()) vistas.volver();
    seleccion.limpiarSeleccion();
  },
});

// Herramientas que reciben las acciones
const interfaz = {
  abrirPanel: panel.abrirPanel,
  mostrarAviso,
  acercar: (destino, contenido) => vistas.acercar(destino, contenido),
  entrarPiso: (elemento, contenido) => vistas.entrarPiso(elemento, contenido),
  entrarOficina: (destino, diseno, contenido, semilla) => vistas.entrarOficina(destino, diseno, contenido, semilla),
  volver: () => vistas.volver(),
};

// Selección de pisos, ventanas, zonas y oficinas de la planta
seleccion = crearSeleccion({
  lienzo,
  camara,
  clicables: edificio.clicables,
  alPasar: mostrarEtiqueta,
  alSeleccionar: (elemento) => ejecutarAccion(elemento, interfaz),
  alDeseleccionar: () => {
    if (vistas.nivelActual() === 'ciudad') panel.cerrarPanel();
  },
});

const vistaCiudad = {
  escena: escenario.escena,
  camara,
  actualizadores: [
    controlCamara.actualizar,
    ambiente.actualizar,
    animarEntorno,
    animarPlaza,
    animarCielo,
    animarMetro,
    (_delta, tiempo) => edificio.animar(tiempo),
    seleccion.actualizar,
  ],
};
const vistaOficina = { escena: oficina.escena, camara: oficina.camara, actualizadores: [oficina.actualizar, ambiente.actualizar], mostrarDiseno: oficina.mostrarDiseno };
vistas = crearVistas({ ciudad: vistaCiudad, oficina: vistaOficina, controlCamara, seleccion, edificio, panel, controlZoom });

// Teclado: flechas, Enter y Esc sobre el edificio
crearTeclado({ seleccion, vistas, mallaPisos: edificio.clicables[0], torres, mostrarAviso });

// Doble clic en el fondo: volver a la vista inicial
lienzo.addEventListener('dblclick', () => {
  if (vistas.nivelActual() === 'ciudad' && !seleccion.hayElementoBajoCursor()) controlCamara.reiniciar();
});

iniciarBucle(escenario.renderer, vistas.obtenerVista);

// Acceso para medir rendimiento y simular clics en desarrollo
if (import.meta.env.DEV) {
  window.escenaDesarrollo = {
    ...escenario,
    clicables: edificio.clicables,
    probarAccion: (elemento) => ejecutarAccion(elemento, interfaz),
    vistas,
  };
}
