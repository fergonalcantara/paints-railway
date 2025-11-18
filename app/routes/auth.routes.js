const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { soloInvitados } = require('../middlewares/guest.middleware');
const { camposRequeridos, validarEmail, validarPassword } = require('../middlewares/validation.middleware');

/**
 * POST /api/auth/register
 * Registro de nuevos usuarios (clientes)
 */
router.post('/register',
    soloInvitados,
    camposRequeridos('nombre', 'apellido', 'email', 'password'),
    validarEmail,
    validarPassword,
    authController.registro
);

/**
 * POST /api/auth/login
 * Login de usuarios
 */
router.post('/login',
    soloInvitados,
    camposRequeridos('email', 'password'),
    authController.login
);

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout',
    verificarAutenticacion,
    authController.logout
);

/**
 * GET /api/auth/session
 * Verificar sesión actual
 */
router.get('/session',
    verificarAutenticacion,
    authController.verificarSesion
);

/**
 * PUT /api/auth/password
 * Cambiar contraseña
 */
router.put('/password',
    verificarAutenticacion,
    camposRequeridos('password_actual', 'password_nueva'),
    validarPassword,
    authController.cambiarPassword
);

module.exports = router;