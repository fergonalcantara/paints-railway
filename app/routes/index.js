const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth.routes');
const productoRoutes = require('./producto.routes');
const facturaRoutes = require('./factura.routes');
const reporteRoutes = require('./reporte.routes');
const inventarioRoutes = require('./inventario.routes');
const cotizacionRoutes = require('./cotizacion.routes');
const usuarioRoutes = require('./usuario.routes');
const sucursalRoutes = require('./sucursal.routes');
const carritoRoutes = require('./carrito.routes');
const catalogoRoutes = require('./catalogo.routes');
const proveedorRoutes = require('./proveedor.routes');
const rolRoutes = require('./rol.routes');
const dashboardRoutes = require('./dashboard.routes');
const ubicacionRoutes = require('./ubicacion.routes');
const clienteRoutes = require('./cliente.routes');

// Montar rutas
router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/facturas', facturaRoutes);
router.use('/reportes', reporteRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/cotizaciones', cotizacionRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/sucursales', sucursalRoutes);
router.use('/carrito', carritoRoutes);
router.use('/catalogo', catalogoRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/roles', rolRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ubicacion', ubicacionRoutes);
router.use('/clientes', clienteRoutes);

// Ruta raíz del API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Paints Ecommerce',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      productos: '/api/productos',
      facturas: '/api/facturas',
      reportes: '/api/reportes',
      inventario: '/api/inventario',
      cotizaciones: '/api/cotizaciones',
      usuarios: '/api/usuarios',
      sucursales: '/api/sucursales',
      carrito: '/api/carrito',
      catalogo: '/api/catalogo',
      proveedores: '/api/proveedores',
      roles: '/api/roles',
      dashboard: '/api/dashboard',
      ubicacion: '/api/ubicacion',
      clientes: '/api/clientes'
    }
  });
});

module.exports = router;