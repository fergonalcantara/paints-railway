const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { esEmpleado } = require('../middlewares/roles.middleware');

/**
 * Todas las rutas requieren ser empleado
 */
router.use(verificarAutenticacion);
router.use(esEmpleado);

/**
 * GET /api/dashboard/estadisticas
 * Obtener estadísticas generales
 */
router.get('/estadisticas',
  dashboardController.obtenerEstadisticas
);

/**
 * GET /api/dashboard/ventas-por-dia
 * Ventas por día (para gráficas)
 */
router.get('/ventas-por-dia',
  dashboardController.ventasPorDia
);

module.exports = router;