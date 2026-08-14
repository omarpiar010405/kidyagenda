const { Cliente } = require('../models');

exports.listar = async (req, res, next) => {
  try {
    const clientes = await Cliente.findAll({ order: [['nombre_completo', 'ASC']] });
    res.json(clientes);
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
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
