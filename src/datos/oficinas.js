// Diseños de oficina: nombre visible de cada tipo
export const disenosOficina = {
  abierta: { nombre: 'Open space' },
  juntas: { nombre: 'Sala de juntas' },
  privada: { nombre: 'Oficina privada' },
  descanso: { nombre: 'Zona de descanso' },
  control: { nombre: 'Sala de control' },
};

// Orden en que se reparten los diseños en cada piso (el control solo está en los puentes)
export const ordenDisenos = ['abierta', 'juntas', 'privada', 'descanso'];

// Distribución de cada piso: oficinas a cada lado de un pasillo central
export const plantaPiso = {
  oficinasPorLado: 4,
  anchoPasillo: 1.2,
  alturaMuro: 0.32,
  largoRecepcion: 5.4,
};

// Diseño estable para un id (ventanas: misma oficina cada vez)
export function disenoPorId(id) {
  let hash = 0;
  for (const caracter of id) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
  return ordenDisenos[hash % ordenDisenos.length];
}
