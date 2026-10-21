/**
 * Caché local (localStorage) para las lecturas de la API.
 *
 * El calendario se pinta al instante con los datos guardados en el navegador
 * y en segundo plano se revalida contra el servidor (stale-while-revalidate).
 * Así la información aparece de inmediato aunque la red o el MySQL remoto
 * tarden en responder.
 */

const PREFIJO = 'kidy.cache.';
const TTL_POR_DEFECTO = 60 * 1000; // 1 minuto

const suscriptores = new Set();

function leer(clave) {
  try {
    const raw = window.localStorage.getItem(PREFIJO + clave);
    if (!raw) return null;
    const guardado = JSON.parse(raw);
    if (!guardado || typeof guardado.t !== 'number') return null;
    return guardado;
  } catch {
    return null;
  }
}

function guardar(clave, valor) {
  try {
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify({ t: Date.now(), v: valor }));
  } catch {
    // localStorage lleno o no disponible: la app sigue funcionando sin caché.
  }
}

/** Borra las claves que empiezan con el prefijo indicado. */
export function invalidar(prefijo) {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIJO + prefijo))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // sin caché, nada que invalidar
  }
}

/** Se suscribe a los refrescos de la caché. Devuelve la función para cancelar. */
export function suscribir(fn) {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
}

function notificar(clave, valor) {
  suscriptores.forEach((fn) => {
    try {
      fn(clave, valor);
    } catch {
      // un suscriptor con error no debe romper el resto
    }
  });
}

/**
 * Resuelve los datos desde la caché local cuando existen y refresca en
 * segundo plano.
 *
 * @param {string} clave identificador de la caché
 * @param {() => Promise<any>} peticion promesa que trae los datos frescos
 * @param {{ ttl?: number }} opciones
 * @returns {Promise<any>} datos (cacheados o frescos)
 */
export function conCache(clave, peticion, { ttl = TTL_POR_DEFECTO } = {}) {
  const guardado = leer(clave);

  if (guardado) {
    // Datos viejos: se muestran ya y se actualizan en segundo plano.
    if (Date.now() - guardado.t >= ttl) {
      peticion()
        .then((datos) => {
          guardar(clave, datos);
          notificar(clave, datos);
        })
        .catch(() => {
          // si falla el refresco se conservan los datos cacheados
        });
    }
    return Promise.resolve(guardado.v);
  }

  return peticion().then((datos) => {
    guardar(clave, datos);
    return datos;
  });
}
