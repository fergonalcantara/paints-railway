const express = require('express');
const router = express.Router();

const carritoController = require('../controllers/carrito.controller');
const { verificarAutenticacionOpcional } = require('../middlewares/auth.middleware');

/**
 * GET /api/carrito
 * Obtener carrito actual
 */
router.get('/',
  verificarAutenticacionOpcional,
  carritoController.obtenerCarrito
);

/**
 * POST /api/carrito/agregar
 * Agregar producto al carrito
 */
router.post('/agregar',
  verificarAutenticacionOpcional,
  carritoController.agregarProducto
);

/**
 * PUT /api/carrito/items/:item_id
 * Actualizar cantidad de un item
 */
router.put('/items/:item_id',
  verificarAutenticacionOpcional,
  carritoController.actualizarCantidad
);

/**
 * DELETE /api/carrito/items/:item_id
 * Eliminar producto del carrito
 */
router.delete('/items/:item_id',
  verificarAutenticacionOpcional,
  carritoController.eliminarProducto
);

/**
 * DELETE /api/carrito/:carrito_id
 * Vaciar carrito
 */
router.delete('/:carrito_id',
  verificarAutenticacionOpcional,
  carritoController.vaciarCarrito
);

module.exports = router;