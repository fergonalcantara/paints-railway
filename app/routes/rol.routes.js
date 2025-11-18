const express = require('express');
const router = express.Router();

const rolController = require('../controllers/rol.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { esAdmin } = require('../middlewares/roles.middleware');

/**
 * Todas las rutas requieren ser admin
 */
router.use(verificarAutenticacion);
router.use(esAdmin);

/**
 * GET /api/roles
 * Listar roles
 */
router.get('/',
  rolController.listarRoles
);

/**
 * GET /api/roles/:id
 * Obtener rol por ID
 */
router.get('/:id',
  rolController.obtenerRolPorId
);

/**
 * POST /api/roles
 * Crear rol
 */
router.post('/',
  rolController.crearRol
);

/**
 * PUT /api/roles/:id
 * Actualizar rol
 */
router.put('/:id',
  rolController.actualizarRol
);

/**
 * DELETE /api/roles/:id
 * Eliminar rol
 */
router.delete('/:id',
  rolController.eliminarRol
);

/**
 * GET /api/roles/permisos
 * Listar todos los permisos disponibles
 */
router.get('/permisos',
  rolController.listarPermisos
);

/**
 * GET /api/roles/:id/permisos
 * Obtener permisos de un rol
 */
router.get('/:id/permisos',
  rolController.obtenerPermisosRol
);

/**
 * PUT /api/roles/:id/permisos
 * Asignar permisos a un rol
 */
router.put('/:id/permisos',
  rolController.asignarPermisos
);

/**
 * POST /api/roles/:id/clonar-permisos
 * Clonar permisos de un rol a otro
 */
router.post('/:id/clonar-permisos',
  rolController.clonarPermisos
);

module.exports = router;