const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TareaEvento = sequelize.define('TareaEvento', {
  id_tarea: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'tareas_evento',
  timestamps: true,
});

module.exports = TareaEvento;
