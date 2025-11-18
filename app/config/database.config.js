const { Sequelize } = require("sequelize");

// Usar dotenv solo en desarrollo
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Detecta si estamos en Railway (MYSQLHOST siempre existe allí)
const isRailway = !!process.env.MYSQLHOST;

const config = {
  host: isRailway ? process.env.MYSQLHOST : process.env.DB_HOST || "localhost",
  port: isRailway ? process.env.MYSQLPORT : process.env.DB_PORT || 3306,
  username: isRailway ? process.env.MYSQLUSER : process.env.DB_USER || "root",
  password: isRailway ? process.env.MYSQLPASSWORD : process.env.DB_PASSWORD || "",
  database: isRailway ? process.env.MYSQLDATABASE : process.env.DB_NAME || "paints_ecommerce",
  dialect: "mysql",

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  logging: process.env.NODE_ENV === "development" ? console.log : false,
  timezone: "-06:00",

  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: true,
  },
};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a MySQL: OK");
    console.log(`Host: ${config.host}`);
    console.log(`DB:   ${config.database}`);
  } catch (error) {
    console.error("Error al conectar con MySQL:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };