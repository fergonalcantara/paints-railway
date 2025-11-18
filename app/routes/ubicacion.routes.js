const express = require('express');
const router = express.Router();

const ubicacionController = require('../controllers/ubicacion.controller');

/**
 * GET /api/ubicacion/departamentos
 * Listar departamentos (público)
 */
router.get('/departamentos',
  ubicacionController.listarDepartamentos
);

/**
 * GET /api/ubicacion/departamentos/:departamento_id/municipios
 * Listar municipios por departamento (público)
 */
router.get('/departamentos/:departamento_id/municipios',
  ubicacionController.listarMunicipiosPorDepartamento
);

/**
 * GET /api/ubicacion/municipios
 * Listar todos los municipios (público)
 */
router.get('/municipios',
  ubicacionController.listarTodosMunicipios
);

module.exports = router;