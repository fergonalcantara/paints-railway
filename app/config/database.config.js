require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || process.env.DB_NAME,
  process.env.MYSQLUSER     || process.env.DB_USER,
  process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    timezone: '-06:00',

    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      paranoid: true
    }
  }
);

// Test de conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente');
  } catch (err) {
    console.error('Error al conectar con MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, testConnection };