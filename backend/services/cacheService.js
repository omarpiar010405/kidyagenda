/**
 * Caché en memoria del backend.
 *
 * La base de datos está en Clever Cloud (MySQL remoto) y cada consulta
 * cuesta ~150-400 ms de ida y vuelta. Con una caché de corta duracion
 * las lecturas repetidas responden en milisegundos.
 *
 * Se invalida explicitamente cuando se escribe en la base de datos,
 * de modo que el usuario siempre vea los datos recien guardados.
 */

const TTL_POR_DEFECTO = 60 * 1000; // 1 minuto
const MAX_ENTRADAS = 500;

// Guardado en globalThis para sobrevivir recargas en caliente durante el desarrollo.
const almacen = globalThis.__kidyCache || new Map();
globalThis.__kidyCache = almacen;

/**
 * @param {string} clave
 * @returns {any|undefined} valor cacheado o undefined si no hay o ya venció
 */
function obtener(clave) {
  const entrada = almacen.get(clave);
  if (!entrada) return undefined;
  if (entrada.expira <= Date.now()) {
    almacen.delete(clave);
    return undefined;
  }
  return entrada.valor;
}

/**
 * @param {string} clave
 * @param {any} valor
 * @param {number} ttl milisegundos
 */
function guardar(clave, valor, ttl = TTL_POR_DEFECTO) {
  if (almacen.size >= MAX_ENTRADAS) {
    // Descarta la entrada más antigua para no crecer sin límite.
    const primera = almacen.keys().next().value;
    if (primera !== undefined) almacen.delete(primera);
  }
  almacen.set(clave, { valor, expira: Date.now() + ttl });
  return valor;
}

/**
 * Invalida todas las claves que empiezan con el prefijo indicado.
 * @param {string} prefijo
 */
function invalidar(prefijo) {
  if (!prefijo) {
    almacen.clear();
    return;
  }
  for (const clave of almacen.keys()) {
    if (clave.startsWith(prefijo)) almacen.delete(clave);
  }
}

module.exports = { obtener, guardar, invalidar, TTL_POR_DEFECTO };
