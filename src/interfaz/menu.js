import { opcionesMenu } from '../datos/menu.js';
import { crearIcono } from './iconos.js';
import { mostrarAviso } from './aviso.js';

// Menú lateral minimizado: iconos con etiqueta emergente
export function crearMenu() {
  const lista = document.getElementById('menu-lista');
  const botones = opcionesMenu.map((opcion) => crearBoton(opcion));

  botones.forEach((boton, indice) => {
    boton.addEventListener('click', () => {
      for (const otro of botones) otro.setAttribute('aria-pressed', String(otro === boton));
      mostrarAviso(`${opcionesMenu[indice].etiqueta} · sin función todavía`);
    });
    const item = document.createElement('li');
    item.append(boton);
    lista.append(item);
  });

  // Escape oculta la etiqueta emergente sin mover el foco
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') lista.classList.add('menu__lista--sin-etiquetas');
  });
  lista.addEventListener('pointermove', () => lista.classList.remove('menu__lista--sin-etiquetas'));
  lista.addEventListener('focusin', () => lista.classList.remove('menu__lista--sin-etiquetas'));
}

function crearBoton({ etiqueta, icono }) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'menu__boton';
  boton.setAttribute('aria-label', etiqueta);
  boton.setAttribute('aria-pressed', 'false');

  const textoEmergente = document.createElement('span');
  textoEmergente.className = 'menu__etiqueta';
  textoEmergente.setAttribute('aria-hidden', 'true');
  textoEmergente.textContent = etiqueta;

  boton.append(crearIcono(icono), textoEmergente);
  return boton;
}
