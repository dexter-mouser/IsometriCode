const DURACION_AVISO_MS = 2200;
let temporizador = 0;

// Aviso breve en la parte inferior
export function mostrarAviso(texto) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.classList.add('aviso--visible');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), DURACION_AVISO_MS);
}
