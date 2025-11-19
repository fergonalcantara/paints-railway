const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const appConfig = require('./config/app.config');
const app = express();
const routes = require('./routes');

// ==================================
// CONFIGURACIÓN DE CORS (CRÍTICO PARA PRODUCCIÓN)
// ==================================
const corsOptions = {
  origin: function (origin, callback) {
    // Lista blanca de orígenes permitidos
    const whitelist = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL, // Variable de Railway
      process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null
    ].filter(Boolean); // Eliminar valores null/undefined

    // En desarrollo, permitir requests sin origin (Postman, Thunder Client)
    if (!origin && appConfig.env === 'development') {
      return callback(null, true);
    }

    if (whitelist.indexOf(origin) !== -1 || appConfig.env === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permitir cookies/sesiones
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions)); // 🆕 ACTIVAR CORS

// ==================================
// HEADERS DE SEGURIDAD (DEBEN IR ANTES DE LAS RUTAS)
// ==================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==================================
// MIDDLEWARES GLOBALES
// ==================================
// Parse JSON y URL-encoded
app.use(express.json({ limit: '10mb' })); // 🆕 Límite para imágenes base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    secure: appConfig.security.cookieSecure, // true en producción (HTTPS)
    sameSite: appConfig.env === 'production' ? 'none' : 'lax' // 🆕 Para CORS
  }
}));

// ==================================
// ARCHIVOS ESTÁTICOS
// ==================================
// Servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para imagen placeholder (SVG dinámico)
app.get('/images/no-image.png', (req, res) => {
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#e9ecef"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial" font-size="16" fill="#6c757d">
        Sin imagen
      </text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 🆕 Cache 24h
  res.send(svg);
});

// ==================================
// LOGGING (solo en desarrollo)
// ==================================
if (appConfig.env === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ==================================
// RUTAS API
// ==================================
// Ruta de salud (para Railway/Kubernetes)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: appConfig.env,
    nodeVersion: process.version,
    memory: process.memoryUsage()
  });
});

// TODAS LAS RUTAS API (una sola declaración)
app.use('/api', routes);

// ==================================
// SERVIR FRONTEND (HTML)
// ==================================
// 🔧 CORREGIDO: Rutas apuntan a public/
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Ruta específica para categorías (ejemplo)
app.get('/admin/categorias', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/categorias.html'));
});

// ==================================
// MANEJO DE ERRORES 404
// ==================================
app.use((req, res) => {
  // Si el archivo 404.html no existe, enviar JSON
  const notFoundPath = path.join(__dirname, 'views/errors/404.html');
  if (require('fs').existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      status: 404
    });
  }
});

// ==================================
// MANEJO DE ERRORES GLOBALES
// ==================================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Si es un error de CORS, dar más información
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: {
        message: 'CORS: Origin not allowed',
        origin: req.headers.origin,
        status: 403
      }
    });
  }

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      status: err.status || 500,
      ...(appConfig.env === 'development' && { stack: err.stack })
    }
  });
});

module.exports = app;