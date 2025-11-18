const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración para Railway (producción) o local (desarrollo)
const config = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  username: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'paints_ecommerce',
  dialect: 'mysql',

  // Configuración de pool de conexiones
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  // Logging (desactivado en producción)
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  // Zona horaria
  timezone: '-06:00', // Guatemala (CST)

  // Configuración adicional
  define: {
    timestamps: true,
    underscored: true, // Usa snake_case en BD
    freezeTableName: true, // No pluralizar nombres de tablas
    paranoid: true // Soft deletes (deleted_at)
  }
};

// Crear instancia de Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Función para probar conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente');
    console.log(`Base de datos: ${config.database}`);
    console.log(`Servidor: ${config.host}:${config.port}`);
  } catch (error) {
    console.error('Error al conectar con MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };