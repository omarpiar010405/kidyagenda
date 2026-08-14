const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExtraMobiliario = sequelize.define('ExtraMobiliario', {
  id_extra: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  articulo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'extras_mobiliario',
  timestamps: true,
});

module.exports = ExtraMobiliario;
