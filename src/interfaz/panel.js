// Panel flotante no modal (dialog con popover manual)
export function crearPanel({ alCerrar }) {
  const panel = document.getElementById('panel');
  const partes = {
    tipo: document.getElementById('panel-tipo'),
    titulo: document.getElementById('panel-titulo'),
    id: document.getElementById('panel-id'),
    datos: document.getElementById('panel-datos'),
    botones: document.getElementById('panel-botones'),
  };

  const estaAbierto = () => panel.matches(':popover-open');

  const cerrarPanel = () => {
    if (estaAbierto()) panel.hidePopover();
  };

  const abrirPanel = (contenido) => {
    partes.tipo.textContent = contenido.tipo;
    partes.titulo.textContent = contenido.titulo;
    partes.id.textContent = contenido.id;
    partes.datos.replaceChildren(...contenido.datos.map(crearDato));
    partes.botones.replaceChildren(...contenido.botones.map(crearBoton));
    if (!estaAbierto()) panel.showPopover();
  };

  panel.addEventListener('toggle', (evento) => {
    if (evento.newState === 'closed') alCerrar();
  });
  document.getElementById('panel-cerrar').addEventListener('click', cerrarPanel);
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarPanel();
  });

  return { abrirPanel, cerrarPanel };
}

function crearDato({ etiqueta, valor }) {
  const grupo = document.createElement('div');
  grupo.className = 'panel__dato';
  const termino = document.createElement('dt');
  termino.textContent = etiqueta;
  const descripcion = document.createElement('dd');
  descripcion.textContent = valor;
  grupo.append(termino, descripcion);
  return grupo;
}

function crearBoton({ texto, alPulsar, variante }) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = variante ? `panel__boton panel__boton--${variante}` : 'panel__boton';
  boton.textContent = texto;
  boton.addEventListener('click', alPulsar);
  return boton;
}
