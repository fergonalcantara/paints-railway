const express = require('express');
const router = express.Router();

const productoController = require('../controllers/producto.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');
const { camposRequeridos, validarNumeroPositivo } = require('../middlewares/validation.middleware');
const { esEmpleado } = require('../middlewares/roles.middleware');

/**
 * GET /api/productos
 * Obtener todos los productos (público)
 */
router.get('/',
    productoController.obtenerProductos
);

/**
 * GET /api/productos/pos-buscar
 * Buscar productos para POS con stock
 */
router.get('/pos-buscar',
    verificarAutenticacion,
    esEmpleado,
    productoController.buscarProductosPOS
);

/**
 * GET /api/productos/:id
 * Obtener producto por ID (público)
 */
router.get('/:id',
    productoController.obtenerProductoPorId
);

/**
 * GET /api/productos/:id/stock
 * Obtener stock de un producto
 */
router.get('/:id/stock',
    productoController.obtenerStock
);

/**
 * POST /api/productos
 * Crear nuevo producto (requiere permiso)
 */
router.post('/',
    verificarAutenticacion,
    tienePermiso('crear_producto'),
    camposRequeridos('sku', 'nombre', 'categoria_id', 'marca_id', 'unidad_medida_id', 'precio_venta'),
    validarNumeroPositivo('precio_venta'),
    productoController.crearProducto
);

/**
 * PUT /api/productos/:id
 * Actualizar producto (requiere permiso)
 */
router.put('/:id',
    verificarAutenticacion,
    tienePermiso('editar_producto'),
    productoController.actualizarProducto
);

/**
 * DELETE /api/productos/:id
 * Eliminar producto (requiere permiso)
 */
router.delete('/:id',
    verificarAutenticacion,
    tienePermiso('editar_producto'),
    productoController.eliminarProducto
);

module.exports = router;