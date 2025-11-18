const express = require('express');
const router = express.Router();

const catalogoController = require('../controllers/catalogo.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/permissions.middleware');

// ============================================
// CATEGORÍAS
// ============================================

router.get('/categorias', catalogoController.listarCategorias);
router.get('/categorias/:id', catalogoController.obtenerCategoriaPorId);

router.post('/categorias',
  verificarAutenticacion,
  tienePermiso('crear_producto'),
  catalogoController.crearCategoria
);

router.put('/categorias/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.actualizarCategoria
);

router.delete('/categorias/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.eliminarCategoria
);

// ============================================
// MARCAS
// ============================================

router.get('/marcas', catalogoController.listarMarcas);
router.get('/marcas/:id', catalogoController.obtenerMarcaPorId);

router.post('/marcas',
  verificarAutenticacion,
  tienePermiso('crear_producto'),
  catalogoController.crearMarca
);

router.put('/marcas/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.actualizarMarca
);

router.delete('/marcas/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.eliminarMarca
);

// ============================================
// COLORES
// ============================================

router.get('/colores', catalogoController.listarColores);

router.post('/colores',
  verificarAutenticacion,
  tienePermiso('crear_producto'),
  catalogoController.crearColor
);

router.put('/colores/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.actualizarColor
);

router.delete('/colores/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.eliminarColor
);

// ============================================
// UNIDADES DE MEDIDA
// ============================================

router.get('/unidades-medida', catalogoController.listarUnidadesMedida);

router.post('/unidades-medida',
  verificarAutenticacion,
  tienePermiso('crear_producto'),
  catalogoController.crearUnidadMedida
);

router.put('/unidades-medida/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.actualizarUnidadMedida
);

router.delete('/unidades-medida/:id',
  verificarAutenticacion,
  tienePermiso('editar_producto'),
  catalogoController.eliminarUnidadMedida
);

// ============================================
// MÉTODOS DE PAGO
// ============================================

router.get('/metodos-pago', catalogoController.listarMetodosPago);

router.post('/metodos-pago',
  verificarAutenticacion,
  tienePermiso('crear_usuario'),
  catalogoController.crearMetodoPago
);

router.put('/metodos-pago/:id',
  verificarAutenticacion,
  tienePermiso('crear_usuario'),
  catalogoController.actualizarMetodoPago
);

router.delete('/metodos-pago/:id',
  verificarAutenticacion,
  tienePermiso('crear_usuario'),
  catalogoController.eliminarMetodoPago
);

// ============================================
// ROLES
// ============================================

router.get('/roles', catalogoController.listarRoles);

module.exports = router;