const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const appConfig = require('./config/app.config');

const app = express();
const routes = require('./routes');

// ==================================
// MIDDLEWARES GLOBALES
// ==================================

// Parse JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Sesiones
app.use(session({
  secret: appConfig.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: appConfig.security.sessionMaxAge,
    httpOnly: true,
    secure: appConfig.security.cookieSecure // true en producción (HTTPS)
  }
}));

// Archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para imagen placeholder
app.get('/images/no-image.png', (req, res) => {
    // SVG como string
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
            <rect width="200" height="200" fill="#e9ecef"/>
            <text x="50%" y="50%" font-size="20" text-anchor="middle" dy=".3em" fill="#adb5bd">
                Sin imagen
            </text>
        </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
});

// Todas las demás rutas...
app.use('/api', require('./routes'));


// ==================================
// HEADERS DE SEGURIDAD
// ==================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==================================
// LOGGING (solo en desarrollo)
// ==================================
if (appConfig.env === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==================================
// RUTAS
// ==================================

// Ruta de salud (para Railway/Kubernetes)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: appConfig.env
  });
});

// Rutas principales
app.use('/api', routes);

// Servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/client/home.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/admin/dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/auth/login.html'));
});

// ==================================
// MANEJO DE ERRORES 404
// ==================================
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views/errors/404.html'));
});

// ==================================
// MANEJO DE ERRORES GLOBALES
// ==================================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      status: err.status || 500,
      ...(appConfig.env === 'development' && { stack: err.stack })
    }
  });
});

module.exports = app;