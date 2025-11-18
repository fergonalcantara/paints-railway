const express = require('express');
const router = express.Router();

const proveedorController = require('../controllers/proveedor.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');

/**
 * Todas las rutas requieren autenticación
 */
router.use(verificarAutenticacion);
router.use(tienePermiso('gestionar_proveedores'));

/**
 * GET /api/proveedores
 * Listar proveedores
 */
router.get('/',
  proveedorController.listarProveedores
);

/**
 * GET /api/proveedores/:id
 * Obtener proveedor por ID
 */
router.get('/:id',
  proveedorController.obtenerProveedorPorId
);

/**
 * GET /api/proveedores/:id/productos
 * Obtener productos de un proveedor
 */
router.get('/:id/productos',
  proveedorController.obtenerProductosProveedor
);

/**
 * POST /api/proveedores
 * Crear proveedor
 */
router.post('/',
  proveedorController.crearProveedor
);

/**
 * PUT /api/proveedores/:id
 * Actualizar proveedor
 */
router.put('/:id',
  proveedorController.actualizarProveedor
);

/**
 * DELETE /api/proveedores/:id
 * Eliminar proveedor
 */
router.delete('/:id',
  proveedorController.eliminarProveedor
);

/**
 * PUT /api/proveedores/:id/estado
 * Cambiar estado del proveedor
 */
router.put('/:id/estado',
  proveedorController.cambiarEstado
);

module.exports = router;