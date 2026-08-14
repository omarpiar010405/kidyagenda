const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  id_pago: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha_pago: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'pagos',
  timestamps: true,
});

module.exports = Pago;