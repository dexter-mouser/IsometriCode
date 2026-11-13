// Qué pasa al tocar cada tipo de elemento. Cambiar una acción solo toca este archivo.
import { disenoPorId, disenosOficina } from '../datos/oficinas.js';
import { ejecutarFuncion } from './funciones.js';

const NOMBRES_TIPO = { piso: 'Piso', ventana: 'Ventana', zona: 'Zona', oficina: 'Oficina', puente: 'Vigilancia', plaza: 'Plaza' };

const acciones = {
  // Piso: corte de la torre y elección de una de sus oficinas
  piso: (elemento, interfaz) => interfaz.entrarPiso(elemento, crearContenido(elemento, interfaz, {
    datos: [
      ['Oficinas', '8'],
      ['Ocupación', `${numeroDePrueba(elemento.id, 20, 95)} %`],
      ['Temperatura', `${numeroDePrueba(elemento.id, 19, 25)} °C`],
    ],
    nota: 'Toca una oficina para entrar.',
    botones: 2,
  })),

  // Oficina de la planta: entra a su diseño
  oficina: (elemento, interfaz) => interfaz.entrarOficina(null, elemento.diseno, crearContenido(elemento, interfaz, {
    tipo: disenosOficina[elemento.diseno].nombre,
    datos: datosOficina(elemento),
    botones: 4,
  }), elemento.id),

  // Ventana: la cámara viaja hasta ella y se ve una oficina a través del vidrio
  ventana: (elemento, interfaz) => {
    const diseno = disenoPorId(elemento.id);
    interfaz.entrarOficina(elemento.destino, diseno, crearContenido(elemento, interfaz, {
      tipo: disenosOficina[diseno].nombre,
      datos: datosOficina(elemento),
      botones: 4,
      grupo: 'oficina',
    }), elemento.id);
  },

  // Puente: sala de vigilancia y control
  puente: (elemento, interfaz) => interfaz.entrarOficina(elemento.destino, 'control', crearContenido(elemento, interfaz, {
    tipo: disenosOficina.control.nombre,
    datos: [
      ['Cámaras', String(numeroDePrueba(elemento.id, 24, 64))],
      ['Alertas', String(numeroDePrueba(elemento.id, 0, 5))],
      ['Turno', 'Día'],
    ],
    botones: 4,
  })),

  // Plaza: acercamiento libre (se puede girar y hacer zoom)
  plaza: (elemento, interfaz) => interfaz.acercar(elemento.destino, crearContenido(elemento, interfaz, {
    datos: [
      ['Personas', String(numeroDePrueba(elemento.id, 20, 140))],
      ['Área', `${numeroDePrueba(elemento.id, 800, 4000)} m²`],
      ['Ruido', `${numeroDePrueba(elemento.id, 45, 70)} dB`],
    ],
    botones: 2,
  })),

  // Lobby y azoteas: solo panel
  zona: (elemento, interfaz) => interfaz.abrirPanel(crearContenido(elemento, interfaz, {
    datos: [
      ['Personas', String(numeroDePrueba(elemento.id, 0, 120))],
      ['Área', `${numeroDePrueba(elemento.id, 80, 900)} m²`],
      ['Ruido', `${numeroDePrueba(elemento.id, 35, 70)} dB`],
    ],
    botones: 2,
    conVolver: false,
  })),
};

// Punto de entrada: ejecuta la acción del tipo del elemento tocado
export function ejecutarAccion(elemento, interfaz) {
  const accion = acciones[elemento.tipo];
  if (accion) accion(elemento, interfaz);
  else interfaz.mostrarAviso(`Sin acción para ${elemento.nombre}`);
}

function datosOficina(elemento) {
  return [
    ['Personas', String(numeroDePrueba(elemento.id, 1, 12))],
    ['Luz', `${numeroDePrueba(elemento.id, 200, 900)} lx`],
    ['Ruido', `${numeroDePrueba(elemento.id, 35, 60)} dB`],
  ];
}

// Contenido del panel: datos ficticios, botones «Prueba N» y, si aplica, «Volver»
// grupo: prefijo del id en funciones.js (por defecto, el tipo del elemento)
function crearContenido(elemento, interfaz, { tipo, datos, nota, botones, grupo = elemento.tipo, conVolver = true }) {
  const botonesPrueba = Array.from({ length: botones }, (_, indice) => {
    const texto = `Prueba ${indice + 1}`;
    return { texto, alPulsar: () => ejecutarFuncion(`${grupo}/prueba-${indice + 1}`, { etiqueta: texto, elemento }, interfaz) };
  });
  return {
    tipo: tipo ?? NOMBRES_TIPO[elemento.tipo] ?? elemento.tipo,
    titulo: elemento.nombre,
    id: elemento.id,
    nota,
    datos: datos.map(([etiqueta, valor]) => ({ etiqueta, valor })),
    botones: conVolver ? [...botonesPrueba, { texto: 'Volver', variante: 'volver', alPulsar: interfaz.volver }] : botonesPrueba,
  };
}

// Número estable entre mínimo y máximo derivado del id (datos ficticios)
function numeroDePrueba(texto, minimo, maximo) {
  let hash = 0;
  for (const caracter of texto) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
  return minimo + (hash % (maximo - minimo + 1));
}
