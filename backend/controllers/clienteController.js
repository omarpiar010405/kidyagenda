const { Cliente } = require('../models');
const cache = require('../services/cacheService');

const PREFIJO_CLIENTES = 'clientes';

exports.listar = async (req, res, next) => {
  try {
    const enCache = cache.obtener(PREFIJO_CLIENTES);
    if (enCache !== undefined) return res.json(enCache);

    const clientes = await Cliente.findAll({ order: [['nombre_completo', 'ASC']] });
    const datos = clientes.map((c) => c.toJSON());
    cache.guardar(PREFIJO_CLIENTES, datos, 5 * 60 * 1000);
    res.json(datos);
  } catch (err) {
    next(err);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { nombre_completo, telefono } = req.body;
    if (!nombre_completo) {
      return res.status(400).json({ error: 'nombre_completo es requerido' });
    }
    const cliente = await Cliente.create({ nombre_completo, telefono });
    cache.invalidar(PREFIJO_CLIENTES);
    res.status(201).json(cliente);
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cliente.update(req.body);
    cache.invalidar(PREFIJO_CLIENTES);
    res.json(cliente);
  } catch (err) {
    next(err);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cliente.destroy();
    cache.invalidar(PREFIJO_CLIENTES);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
