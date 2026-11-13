// Qué pasa al tocar cada tipo de elemento. Cambiar una acción solo toca este archivo.

const NOMBRES_TIPO = { piso: 'Piso', ventana: 'Ventana', zona: 'Zona' };

const acciones = {
  piso: (elemento, interfaz) => interfaz.abrirPanel(crearContenidoPrueba(elemento, interfaz, [
    ['Ocupación', `${numeroDePrueba(elemento.id, 20, 95)} %`],
    ['Puestos', `${numeroDePrueba(elemento.id, 4, 24)}/24`],
    ['Temperatura', `${numeroDePrueba(elemento.id, 19, 25)} °C`],
  ])),

  // Ventana: la cámara viaja hasta ella, se ve la oficina y el panel muestra el menú
  ventana: (elemento, interfaz) => interfaz.entrarOficina(elemento, () => interfaz.abrirPanel({
    tipo: 'Oficina',
    titulo: elemento.nombre,
    id: elemento.id,
    datos: [
      { etiqueta: 'Personas', valor: String(numeroDePrueba(elemento.id, 1, 12)) },
      { etiqueta: 'Luz', valor: `${numeroDePrueba(elemento.id, 200, 900)} lx` },
      { etiqueta: 'Ruido', valor: `${numeroDePrueba(elemento.id, 35, 60)} dB` },
    ],
    botones: [
      ...['Prueba 1', 'Prueba 2', 'Prueba 3', 'Prueba 4'].map((texto) => ({
        texto,
        alPulsar: () => interfaz.mostrarAviso(`${texto} · ${elemento.nombre}`),
      })),
      { texto: 'Volver', variante: 'volver', alPulsar: interfaz.salirOficina },
    ],
  })),

  zona: (elemento, interfaz) => interfaz.abrirPanel(crearContenidoPrueba(elemento, interfaz, [
    ['Personas', String(numeroDePrueba(elemento.id, 0, 120))],
    ['Área', `${numeroDePrueba(elemento.id, 80, 900)} m²`],
    ['Ruido', `${numeroDePrueba(elemento.id, 35, 70)} dB`],
  ])),
};

// Punto de entrada: ejecuta la acción del tipo del elemento tocado
export function ejecutarAccion(elemento, interfaz) {
  const accion = acciones[elemento.tipo];
  if (accion) accion(elemento, interfaz);
  else interfaz.mostrarAviso(`Sin acción para ${elemento.nombre}`);
}

// Contenido común del panel: datos ficticios y dos botones de prueba
function crearContenidoPrueba(elemento, interfaz, datos) {
  return {
    tipo: NOMBRES_TIPO[elemento.tipo] ?? elemento.tipo,
    titulo: elemento.nombre,
    id: elemento.id,
    datos: datos.map(([etiqueta, valor]) => ({ etiqueta, valor })),
    botones: ['Prueba 1', 'Prueba 2'].map((texto) => ({
      texto,
      alPulsar: () => interfaz.mostrarAviso(`${texto} · ${elemento.nombre}`),
    })),
  };
}

// Número estable entre mínimo y máximo derivado del id (datos ficticios)
function numeroDePrueba(texto, minimo, maximo) {
  let hash = 0;
  for (const caracter of texto) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
  return minimo + (hash % (maximo - minimo + 1));
}
