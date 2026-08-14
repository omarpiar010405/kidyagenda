const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleOperativo = sequelize.define('DetalleOperativo', {
  id_evento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  decoracion_notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  peticiones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  actividades: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  comida_notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'detalles_operativos',
  timestamps: true,
});

module.exports = DetalleOperativo;
