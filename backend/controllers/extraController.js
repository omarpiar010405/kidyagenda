const { ExtraMobiliario } = require('../models');

exports.listarPorEvento = async (req, res, next) => {
  try {
    const extras = await ExtraMobiliario.findAll({ where: { id_evento: req.params.idEvento } });
    res.json(extras);
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { articulo, cantidad } = req.body;
    const extra = await ExtraMobiliario.create({
      id_evento: req.params.idEvento,
      articulo,
      cantidad: cantidad || 1,
    });
    res.status(201).json(extra);
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const extra = await ExtraMobiliario.findByPk(req.params.id);
    if (!extra) return res.status(404).json({ error: 'Extra no encontrado' });
    await extra.update(req.body);
    res.json(extra);
  } catch (err) {
    next(err);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const extra = await ExtraMobiliario.findByPk(req.params.id);
    if (!extra) return res.status(404).json({ error: 'Extra no encontrado' });
    await extra.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
