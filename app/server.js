require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/database.config');
const appConfig = require('./config/app.config');

const PORT = appConfig.port;

// ==================================
// FUNCIÓN DE INICIO
// ==================================
async function startServer() {
  try {
    // 1. Probar conexión a BD
    await testConnection();
    
    // 2. Sincronizar modelos (NO usar sync en producción)
    if (appConfig.env === 'development') {
      await sequelize.sync({ alter: false });
      console.log('Modelos sincronizados');
    }
    
    // 3. Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Entorno: ${appConfig.env}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log('========================================');
      console.log('');
      console.log('Endpoints disponibles:');
      console.log(`   GET  /              - Frontend (Cliente)`);
      console.log(`   GET  /admin         - Panel Administrativo`);
      console.log(`   GET  /login         - Login`);
      console.log(`   GET  /health        - Health Check`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// ==================================
// MANEJO DE SEÑALES
// ==================================
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT recibido. Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

// ==================================
// INICIAR
// ==================================
startServer();