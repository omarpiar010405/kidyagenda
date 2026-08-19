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
  proveedores: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('proveedores');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(val) {
      this.setDataValue('proveedores', Array.isArray(val) ? JSON.stringify(val) : val);
    },
  },
  empleados: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('empleados');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(val) {
      this.setDataValue('empleados', Array.isArray(val) ? JSON.stringify(val) : val);
    },
  },
}, {
  tableName: 'detalles_operativos',
  timestamps: true,
});

module.exports = DetalleOperativo;
