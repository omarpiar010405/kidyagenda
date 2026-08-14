const { Sequelize } = require('sequelize');
require('dotenv').config();

// Preferimos construir la conexion con variables separadas.
// Si prefieres usar la URI completa, puedes reemplazar por:
// const sequelize = new Sequelize(process.env.DB_URI, { dialect: 'mysql', ... });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      // Clever Cloud MySQL suele requerir SSL en algunos planes.
      // Si tu instancia lo requiere, descomenta:
      // ssl: { require: true, rejectUnauthorized: false }
      connectTimeout: 20000,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
