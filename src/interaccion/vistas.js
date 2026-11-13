const DURACION_FUNDIDO_MS = 220;

const esperar = (milisegundos) => new Promise((resolver) => setTimeout(resolver, milisegundos));

// Niveles de navegación apilados: ciudad → (plaza | piso | oficina) → oficina.
// Cada nivel sabe cómo deshacerse; "Volver" desapila y reabre el panel del nivel anterior.
export function crearVistas({ ciudad, oficina, controlCamara, seleccion, edificio, panel, controlZoom }) {
  const fundido = document.getElementById('fundido');
  const niveles = [];
  let vistaActual = ciudad;
  let enTransicion = false;

  const nivelActual = () => niveles.at(-1)?.tipo ?? 'ciudad';

  // Selección y zoom solo se usan fuera de la oficina y cuando no hay transición
  const actualizarControles = () => {
    const enOficina = nivelActual() === 'oficina';
    seleccion.pausar(enTransicion || enOficina);
    controlZoom.habilitar(!enTransicion && !enOficina && !controlCamara.estaBloqueada());
  };

  const ejecutar = async (pasos) => {
    if (enTransicion) return;
    enTransicion = true;
    actualizarControles();
    try {
      await pasos();
    } finally {
      enTransicion = false;
      actualizarControles();
    }
  };

  const fundir = async (cambio) => {
    fundido.classList.add('fundido--visible');
    await esperar(DURACION_FUNDIDO_MS);
    try {
      cambio();
    } finally {
      fundido.classList.remove('fundido--visible');
    }
  };

  const viajar = (destino, bloquear) => new Promise((resolver) => controlCamara.viajarA({ ...destino, bloquear }, resolver));
  const volverCamara = () => new Promise((resolver) => controlCamara.volver(resolver));

  const apilar = (nivel) => {
    niveles.push(nivel);
    panel.abrirPanel(nivel.contenido);
  };

  // Acerca la cámara a un punto (la plaza) dejando girar, desplazar y hacer zoom
  const acercar = (destino, contenido) => ejecutar(async () => {
    await viajar(destino, false);
    apilar({ tipo: 'acercado', contenido, salir: volverCamara });
  });

  // Viaja a un piso, corta la torre y deja elegir una de sus oficinas
  const entrarPiso = (elemento, contenido) => ejecutar(async () => {
    const clicablesCiudad = seleccion.obtenerClicables();
    seleccion.establecerClicables(edificio.mostrarPlanta(elemento));
    await viajar(elemento.destino, true);
    apilar({
      tipo: 'piso',
      contenido,
      salir: async () => {
        seleccion.establecerClicables(clicablesCiudad);
        edificio.ocultarPlanta();
        await volverCamara();
      },
    });
  });

  // Muestra un interior (oficina o sala de control); si hay destino, la cámara viaja antes
  const entrarOficina = (destino, diseno, contenido, semilla) => ejecutar(async () => {
    if (destino) await viajar(destino, true);
    await fundir(() => {
      oficina.mostrarDiseno(diseno, semilla);
      vistaActual = oficina;
    });
    apilar({
      tipo: 'oficina',
      contenido,
      salir: async () => {
        await fundir(() => { vistaActual = ciudad; });
        if (destino) await volverCamara();
      },
    });
  });

  // Deshace el último nivel y vuelve al anterior
  const volver = () => ejecutar(async () => {
    const nivel = niveles.pop();
    if (!nivel) return;
    await nivel.salir();
    const anterior = niveles.at(-1);
    if (anterior) panel.abrirPanel(anterior.contenido);
    else panel.cerrarPanel();
  });

  return {
    acercar,
    entrarPiso,
    entrarOficina,
    volver,
    nivelActual,
    estaEnTransicion: () => enTransicion,
    obtenerVista: () => vistaActual,
  };
}
