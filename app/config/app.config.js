require('dotenv').config();

module.exports = {
  // Servidor
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // Base de datos
  database: {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    name: process.env.MYSQLDATABASE || process.env.DB_NAME || 'paints_ecommerce'
  },
  
  // Seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
    sessionSecret: process.env.SESSION_SECRET || 'default_session_key',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
    cookieSecure: process.env.COOKIE_SECURE === 'true' || false
  },
  
  // Aplicación
  app: {
    name: 'Paints Ecommerce',
    version: '1.0.0',
    description: 'Sistema de gestión de ventas e inventario'
  },
  
  // Paginación
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },
  
  // Archivos
  uploads: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    destination: 'app/public/images/productos/'
  }
};