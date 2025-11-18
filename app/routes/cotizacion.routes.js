const express = require('express');
const router = express.Router();

const cotizacionController = require('../controllers/cotizacion.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');

/**
 * Todas las rutas requieren autenticación
 */
router.use(verificarAutenticacion);

/**
 * GET /api/cotizaciones
 * Listar cotizaciones
 */
router.get('/',
  cotizacionController.listarCotizaciones
);

/**
 * GET /api/cotizaciones/:numero_cotizacion
 * Obtener cotización por número
 */
router.get('/:numero_cotizacion',
  cotizacionController.obtenerCotizacionPorNumero
);

/**
 * POST /api/cotizaciones
 * Crear cotización
 */
router.post('/',
  tienePermiso('crear_cotizacion'),
  cotizacionController.crearCotizacion
);

/**
 * PUT /api/cotizaciones/:id/estado
 * Cambiar estado de cotización
 */
router.put('/:id/estado',
  tienePermiso('crear_cotizacion'),
  cotizacionController.cambiarEstado
);

module.exports = router;