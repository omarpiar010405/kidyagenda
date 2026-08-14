const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Evento = require('./Evento');
const DetalleOperativo = require('./DetalleOperativo');
const TareaEvento = require('./TareaEvento');
const ExtraMobiliario = require('./ExtraMobiliario');
const Pago = require('./Pago');
const ConfigEmail = require('./ConfigEmail');

// --- Relaciones ---

// Un cliente puede tener muchos eventos
Cliente.hasMany(Evento, { foreignKey: 'id_cliente', onDelete: 'CASCADE' });
Evento.belongsTo(Cliente, { foreignKey: 'id_cliente' });

// Un evento tiene un unico registro de detalles operativos (1 a 1)
Evento.hasOne(DetalleOperativo, { foreignKey: 'id_evento', onDelete: 'CASCADE' });
DetalleOperativo.belongsTo(Evento, { foreignKey: 'id_evento' });

// Un evento tiene muchas tareas
Evento.hasMany(TareaEvento, { foreignKey: 'id_evento', onDelete: 'CASCADE' });
TareaEvento.belongsTo(Evento, { foreignKey: 'id_evento' });

// Un evento tiene muchos extras/mobiliario
Evento.hasMany(ExtraMobiliario, { foreignKey: 'id_evento', onDelete: 'CASCADE' });
ExtraMobiliario.belongsTo(Evento, { foreignKey: 'id_evento' });

// Un evento tiene muchos abonos/pagos
Evento.hasMany(Pago, { foreignKey: 'id_evento', onDelete: 'CASCADE' });
Pago.belongsTo(Evento, { foreignKey: 'id_evento' });

module.exports = {
  sequelize,
  Cliente,
  Evento,
  DetalleOperativo,
  TareaEvento,
  ExtraMobiliario,
  Pago,
  ConfigEmail,
};
