const express = require('express');
const router = express.Router();

const facturaController = require('../controllers/factura.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');
const { esEmpleado } = require('../middlewares/roles.middleware');

/**
 * GET /api/facturas
 * Listar facturas con filtros
 */
router.get('/',
    verificarAutenticacion,
    tienePermiso('ver_facturas'),
    facturaController.listarFacturas
);

/**
 * GET /api/facturas/:numero_factura
 * Obtener factura por número
 */
router.get('/:numero_factura',
    verificarAutenticacion,
    tienePermiso('ver_facturas'),
    facturaController.obtenerFacturaPorNumero
);

/**
 * POST /api/facturas
 * Crear factura (VENTA)
 */
router.post('/',
    verificarAutenticacion,
    esEmpleado,
    tienePermiso('crear_venta'),
    facturaController.crearFactura
);

/**
 * POST /api/facturas/:numero_factura/anular
 * Anular factura (crítico para evaluación)
 */
router.post('/:numero_factura/anular',
    verificarAutenticacion,
    esEmpleado,
    tienePermiso('anular_factura'),
    facturaController.anularFactura
);

module.exports = router;