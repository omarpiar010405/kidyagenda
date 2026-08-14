const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evento = sequelize.define('Evento', {
  id_evento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre_festejado: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  tematica: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  fecha_evento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  numero_personas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  total_costo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  anticipo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  estado_pago: {
    type: DataTypes.ENUM('pendiente', 'parcial', 'pagado'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
  notas_pago: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'eventos',
  timestamps: true,
});

module.exports = Evento;
