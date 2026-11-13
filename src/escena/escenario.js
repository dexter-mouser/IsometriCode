import * as THREE from 'three';
import { coloresEscena } from '../datos/tema.js';

const PIXEL_RATIO_MAXIMO = 2;
const TAMANO_MAPA_SOMBRAS = 3072;
const ALCANCE_SOMBRAS = 80;

// Renderer, escena, luces y bucle de animación
export function crearEscenario(lienzo) {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_MAXIMO));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const escena = new THREE.Scene();
  agregarLuces(escena);

  window.addEventListener('resize', () => renderer.setSize(window.innerWidth, window.innerHeight, false));

  return { renderer, escena };
}

// Sol con sombras + luz de cielo
function agregarLuces(escena) {
  const cielo = new THREE.HemisphereLight(coloresEscena.luzCielo, coloresEscena.luzSuelo, 1.6);
  escena.add(cielo);

  const sol = new THREE.DirectionalLight(coloresEscena.luzSol, 2.4);
  sol.position.set(28, 48, 22);
  sol.castShadow = true;
  sol.shadow.mapSize.set(TAMANO_MAPA_SOMBRAS, TAMANO_MAPA_SOMBRAS);
  const camaraSombra = sol.shadow.camera;
  camaraSombra.left = -ALCANCE_SOMBRAS;
  camaraSombra.right = ALCANCE_SOMBRAS;
  camaraSombra.top = ALCANCE_SOMBRAS;
  camaraSombra.bottom = -ALCANCE_SOMBRAS;
  camaraSombra.near = 10;
  camaraSombra.far = 160;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  sol.shadow.radius = 3;
  escena.add(sol);
}

// Bucle: actualiza los sistemas de la vista activa y la dibuja; se pausa con la pestaña oculta
// obtenerVista devuelve { escena, camara, actualizadores } de la vista activa (ciudad u oficina)
export function iniciarBucle(renderer, obtenerVista) {
  const reloj = new THREE.Clock();

  const dibujarFotograma = () => {
    const delta = Math.min(reloj.getDelta(), 0.1);
    const tiempo = reloj.elapsedTime;
    const { escena, camara, actualizadores } = obtenerVista();
    for (const actualizar of actualizadores) actualizar(delta, tiempo);
    renderer.render(escena, camara);
  };

  const alternarPausa = () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
      reloj.stop();
    } else {
      reloj.start();
      renderer.setAnimationLoop(dibujarFotograma);
    }
  };

  document.addEventListener('visibilitychange', alternarPausa);
  renderer.setAnimationLoop(dibujarFotograma);
}
