const { ConfigEmail } = require('../models');
const cache = require('../services/cacheService');

const PREFIJO_EMAILS = 'config:emails';

exports.listar = async (req, res, next) => {
  try {
    const enCache = cache.obtener(PREFIJO_EMAILS);
    if (enCache !== undefined) return res.json(enCache);

    const emails = await ConfigEmail.findAll({ order: [['createdAt', 'ASC']] });
    const datos = emails.map((e) => e.toJSON());
    cache.guardar(PREFIJO_EMAILS, datos, 5 * 60 * 1000);
    res.json(datos);
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email es requerido' });
    const nuevo = await ConfigEmail.create({ email });
    cache.invalidar(PREFIJO_EMAILS);
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ese correo ya esta registrado' });
    }
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const item = await ConfigEmail.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    await item.update(req.body);
    cache.invalidar(PREFIJO_EMAILS);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const item = await ConfigEmail.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    await item.destroy();
    cache.invalidar(PREFIJO_EMAILS);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
