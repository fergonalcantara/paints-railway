const express = require('express');
const router = express.Router();

const inventarioController = require('../controllers/inventario.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');
const { esEmpleado } = require('../middlewares/roles.middleware');

/**
 * Todas las rutas requieren autenticación y ser empleado
 */
router.use(verificarAutenticacion);
router.use(esEmpleado);

/**
 * GET /api/inventario/sucursal/:sucursal_id
 * Obtener inventario por sucursal
 */
router.get('/sucursal/:sucursal_id',
    tienePermiso('ver_inventario'),
    inventarioController.obtenerInventarioPorSucursal
);

/**
 * PUT /api/inventario
 * Actualizar inventario (stock mínimo/máximo)
 */
router.put('/',
    tienePermiso('ver_inventario'),
    inventarioController.actualizarInventario
);

/**
 * POST /api/inventario/lote
 * Registrar ingreso de lote
 */
router.post('/lote',
    tienePermiso('registrar_lotes'),
    inventarioController.registrarLote
);

/**
 * GET /api/inventario/lotes/:producto_id
 * Obtener lotes de un producto
 */
router.get('/lotes/:producto_id',
    tienePermiso('ver_inventario'),
    inventarioController.obtenerLotesProducto
);

/**
 * GET /api/inventario/bajo-stock
 * Productos con bajo stock
 */
router.get('/bajo-stock',
    tienePermiso('ver_inventario'),
    inventarioController.productosBajoStock
);

/**
 * POST /api/inventario/lote/distribuir
 * Distribuir un lote existente
 */
router.post('/lote/distribuir',
    tienePermiso('registrar_lote'),
    inventarioController.distribuirLote
);


module.exports = router;