const { ConfigEmail } = require('../models');

exports.listar = async (req, res, next) => {
  try {
    const emails = await ConfigEmail.findAll({ order: [['createdAt', 'ASC']] });
    res.json(emails);
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email es requerido' });
    const nuevo = await ConfigEmail.create({ email });
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
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
