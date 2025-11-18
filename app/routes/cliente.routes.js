const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/cliente.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { esEmpleado } = require('../middlewares/roles.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');
const { camposRequeridos } = require('../middlewares/validation.middleware');

/**
 * Todas las rutas requieren autenticación y ser empleado
 */
router.use(verificarAutenticacion);
router.use(esEmpleado);

/**
 * GET /api/clientes
 * Listar clientes físicos
 */
router.get('/',
  tienePermiso('ver_clientes'),
  clienteController.listarClientes
);

/**
 * GET /api/clientes/:id
 * Obtener cliente por ID
 */
router.get('/:id',
  tienePermiso('ver_clientes'),
  clienteController.obtenerClientePorId
);

/**
 * GET /api/clientes/nit/:nit
 * Buscar cliente por NIT
 */
router.get('/nit/:nit',
  tienePermiso('ver_clientes'),
  clienteController.buscarPorNIT
);

/**
 * GET /api/clientes/:id/historial
 * Historial de compras del cliente
 */
router.get('/:id/historial',
  tienePermiso('ver_clientes'),
  clienteController.historialCompras
);

/**
 * POST /api/clientes
 * Crear cliente físico
 */
router.post('/',
  tienePermiso('crear_venta'),
  camposRequeridos('nombre'),
  clienteController.crearCliente
);

/**
 * PUT /api/clientes/:id
 * Actualizar cliente
 */
router.put('/:id',
  tienePermiso('crear_venta'),
  clienteController.actualizarCliente
);

/**
 * DELETE /api/clientes/:id
 * Eliminar cliente
 */
router.delete('/:id',
  tienePermiso('crear_usuario'),
  clienteController.eliminarCliente
);

module.exports = router;