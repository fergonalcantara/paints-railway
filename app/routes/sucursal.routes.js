const express = require('express');
const router = express.Router();

const sucursalController = require('../controllers/sucursal.controller');
const { verificarAutenticacionOpcional } = require('../middlewares/auth.middleware');

/**
 * GET /api/sucursales
 * Listar todas las sucursales (público)
 */
router.get('/',
  sucursalController.listarSucursales
);

/**
 * GET /api/sucursales/cercana
 * Obtener sucursal más cercana según GPS (público)
 */
router.get('/cercana',
  verificarAutenticacionOpcional,
  sucursalController.obtenerSucursalCercana
);

/**
 * GET /api/sucursales/:id
 * Obtener sucursal por ID (público)
 */
router.get('/:id',
  sucursalController.obtenerSucursalPorId
);

module.exports = router;