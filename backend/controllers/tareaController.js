const { TareaEvento } = require('../models');

exports.listarPorEvento = async (req, res, next) => {
  try {
    const tareas = await TareaEvento.findAll({ where: { id_evento: req.params.idEvento } });
    res.json(tareas);
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { descripcion, completada } = req.body;
    const tarea = await TareaEvento.create({
      id_evento: req.params.idEvento,
      descripcion,
      completada: !!completada,
    });
    res.status(201).json(tarea);
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const tarea = await TareaEvento.findByPk(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    await tarea.update(req.body);
    res.json(tarea);
  } catch (err) {
    next(err);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const tarea = await TareaEvento.findByPk(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    await tarea.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
