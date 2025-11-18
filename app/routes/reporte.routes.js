const express = require('express');
const router = express.Router();

const reporteController = require('../controllers/reporte.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');

/**
 * Todos los reportes requieren autenticación y permiso de ver reportes
 */
router.use(verificarAutenticacion);
router.use(tienePermiso('ver_reportes'));

/**
 * GET /api/reportes/facturacion-metodo-pago
 * Reporte 1: Total facturado por método de pago
 */
router.get('/facturacion-metodo-pago',
    reporteController.facturacionMetodoPago
);

/**
 * GET /api/reportes/productos-mas-ingresos
 * Reporte 2: Productos que más dinero generan
 */
router.get('/productos-mas-ingresos',
    reporteController.productosMasIngresos
);

/**
 * GET /api/reportes/productos-mas-vendidos
 * Reporte 3: Productos más vendidos en cantidad
 */
router.get('/productos-mas-vendidos',
    reporteController.productosMasVendidos
);

/**
 * GET /api/reportes/inventario-general
 * Reporte 4: Inventario actual general
 */
router.get('/inventario-general',
    reporteController.inventarioGeneral
);

/**
 * GET /api/reportes/productos-menos-vendidos
 * Reporte 5: Productos con menos ventas
 */
router.get('/productos-menos-vendidos',
    reporteController.productosMenosVendidos
);

/**
 * GET /api/reportes/productos-sin-stock
 * Reporte 6: Productos sin stock
 */
router.get('/productos-sin-stock',
    reporteController.productosSinStock
);

/**
 * GET /api/reportes/factura/:numero_factura
 * Reporte 7: Detalle de factura
 */
router.get('/factura/:numero_factura',
    reporteController.detalleFactura
);

/**
 * GET /api/reportes/ingresos-inventario
 * Reporte 8: Ingresos al inventario (lotes)
 */
router.get('/ingresos-inventario',
    reporteController.ingresosInventario
);

/**
 * GET /api/reportes/stock-bajo-minimo
 * Reporte 9: Productos bajo stock mínimo
 */
router.get('/stock-bajo-minimo',
    reporteController.stockBajoMinimo
);

/**
 * GET /api/reportes/inventario-tienda/:sucursal_id
 * Reporte 10: Inventario por tienda
 */
router.get('/inventario-tienda/:sucursal_id',
    reporteController.inventarioPorTienda
);

/**
 * GET /api/reportes/exportar/:tipo/:formato
 * Exportar reporte en PDF o Excel
 */
router.get('/exportar/:tipo/:formato', reporteController.exportarReporte);

module.exports = router;