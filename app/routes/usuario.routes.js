const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');
const { esAdmin } = require('../middlewares/roles.middleware');

/**
 * Todas las rutas requieren autenticación
 */
router.use(verificarAutenticacion);

/**
 * GET /api/usuarios
 * Listar usuarios (solo admin)
 */
router.get('/',
  tienePermiso('ver_usuarios'),
  usuarioController.obtenerUsuarios
);

/**
 * GET /api/usuarios/:id
 * Obtener usuario por ID
 */
router.get('/:id',
  tienePermiso('ver_usuarios'),
  usuarioController.obtenerUsuarioPorId
);

/**
 * POST /api/usuarios
 * Crear usuario/empleado (solo admin)
 */
router.post('/',
  esAdmin,
  tienePermiso('crear_usuario'),
  usuarioController.crearUsuario
);

/**
 * PUT /api/usuarios/:id
 * Actualizar usuario
 */
router.put('/:id',
  tienePermiso('crear_usuario'),
  usuarioController.actualizarUsuario
);

/**
 * PUT /api/usuarios/:id/estado
 * Cambiar estado de usuario
 */
router.put('/:id/estado',
  esAdmin,
  usuarioController.cambiarEstado
);

module.exports = router;