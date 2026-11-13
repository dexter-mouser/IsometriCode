// Funciones de los botones del menú lateral y del panel.
// Están conectadas pero vacías: cada botón tiene aquí su id; al pulsarlo solo avisa que está pendiente.
// Para darle una función real basta con reemplazar su "pendiente" por la función.

const pendiente = null;

export const funciones = {
  // Menú lateral
  'menu/prueba-1': pendiente,
  'menu/prueba-2': pendiente,
  'menu/prueba-3': pendiente,
  'menu/prueba-4': pendiente,
  'menu/prueba-5': pendiente,
  'menu/prueba-6': pendiente,

  // Panel de un piso
  'piso/prueba-1': pendiente,
  'piso/prueba-2': pendiente,

  // Panel de una oficina (desde la planta o desde una ventana)
  'oficina/prueba-1': pendiente,
  'oficina/prueba-2': pendiente,
  'oficina/prueba-3': pendiente,
  'oficina/prueba-4': pendiente,

  // Panel de la sala de control
  'puente/prueba-1': pendiente,
  'puente/prueba-2': pendiente,
  'puente/prueba-3': pendiente,
  'puente/prueba-4': pendiente,

  // Panel de una plaza
  'plaza/prueba-1': pendiente,
  'plaza/prueba-2': pendiente,

  // Panel del lobby o una azotea
  'zona/prueba-1': pendiente,
  'zona/prueba-2': pendiente,
};

// Ejecuta la función de un botón; contexto: { etiqueta, elemento? }
export function ejecutarFuncion(id, contexto, { mostrarAviso }) {
  const funcion = funciones[id];
  if (typeof funcion === 'function') {
    funcion(contexto);
    return;
  }
  const sobre = contexto.elemento ? ` · ${contexto.elemento.nombre}` : '';
  mostrarAviso(`${contexto.etiqueta}${sobre} · función pendiente`);
}
