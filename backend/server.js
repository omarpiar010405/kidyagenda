require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { sequelize } = require('./models');
const errorHandler = require('./middlewares/errorHandler');

const clienteRoutes = require('./routes/clienteRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const tareaRoutes = require('./routes/tareaRoutes');
const extraRoutes = require('./routes/extraRoutes');
const configRoutes = require('./routes/configRoutes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/clientes', clienteRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/extras', extraRoutes);
app.use('/api/config', configRoutes);

// --- Servir el build de React (produccion / un solo servicio en Render) ---
// Express sirve los archivos estaticos del frontend compilado y, para cualquier
// ruta no-API, devuelve index.html (soporte del enrutador de React Router).
const BUILD_DIR = path.join(__dirname, '..', 'frontend', 'build');

if (fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
  app.use(express.static(BUILD_DIR));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(BUILD_DIR, 'index.html'));
  });
} else {
  console.log('⚠️  No se encontro el build del frontend. La API se sirve igualmente.');
}

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexion a MySQL establecida correctamente.');

    // Crea/actualiza las tablas segun los modelos definidos.
    // En produccion es mas seguro usar migraciones, pero para este
    // proyecto usamos sync() por simplicidad.
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

iniciar();
