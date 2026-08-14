module.exports = (err, req, res, next) => {
  console.error('[error]', err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Error de validacion',
      detalles: err.errors?.map((e) => e.message),
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
};
