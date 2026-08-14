const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabla auxiliar para la pantalla de "Configuracion":
// guarda las direcciones de correo que reciben notificaciones
// cuando se crea o edita un evento.
const ConfigEmail = sequelize.define('ConfigEmail', {
  id_config_email: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'config_emails',
  timestamps: true,
});

module.exports = ConfigEmail;
