import * as THREE from 'three';
import { coloresEscena } from '../datos/tema.js';

const SUAVIZADO = 2.2;
const { dia, tarde } = coloresEscena.ambientes;

// Transición suave entre día (0) y tarde (1): luces, cielo y ventanas encendidas.
// alCambiar(t) recibe el valor intermedio para que cada sistema ajuste lo suyo.
export function crearAmbiente({ luces, alCambiar }) {
  const estado = { actual: 0, objetivo: 0 };
  const color = new THREE.Color();
  const desde = new THREE.Color();
  const hasta = new THREE.Color();
  const posicionDia = new THREE.Vector3(...dia.posicionSol);
  const posicionTarde = new THREE.Vector3(...tarde.posicionSol);
  const raiz = document.documentElement;

  const mezclar = (inicio, fin, t) => color.copy(desde.set(inicio)).lerp(hasta.set(fin), t);

  const aplicar = (t) => {
    luces.sol.color.copy(mezclar(dia.sol, tarde.sol, t));
    luces.sol.intensity = THREE.MathUtils.lerp(dia.intensidadSol, tarde.intensidadSol, t);
    luces.sol.position.lerpVectors(posicionDia, posicionTarde, t);
    luces.cielo.color.copy(mezclar(dia.cielo, tarde.cielo, t));
    luces.cielo.groundColor.copy(mezclar(dia.suelo, tarde.suelo, t));
    luces.cielo.intensity = THREE.MathUtils.lerp(dia.intensidadCielo, tarde.intensidadCielo, t);
    raiz.style.setProperty('--color-cielo-arriba', `#${mezclar(dia.cieloArriba, tarde.cieloArriba, t).getHexString()}`);
    raiz.style.setProperty('--color-cielo-abajo', `#${mezclar(dia.cieloAbajo, tarde.cieloAbajo, t).getHexString()}`);
    alCambiar(t);
  };

  const actualizar = (delta) => {
    if (Math.abs(estado.actual - estado.objetivo) < 0.001) return;
    estado.actual = THREE.MathUtils.damp(estado.actual, estado.objetivo, SUAVIZADO, delta);
    if (Math.abs(estado.actual - estado.objetivo) < 0.001) estado.actual = estado.objetivo;
    aplicar(estado.actual);
  };

  // Alterna entre día y tarde; devuelve true si queda en tarde
  const alternar = () => {
    estado.objetivo = estado.objetivo === 0 ? 1 : 0;
    return estado.objetivo === 1;
  };

  return { actualizar, alternar };
}
