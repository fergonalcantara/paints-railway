const { sequelize } = require("../config/database.config");

// Importamos todos los modelos
const Rol = require('./rol.model');
const Permiso = require('./permiso.model');
const RolPermiso = require('./rolPermiso.model');
const Departamento = require('./departamento.model');
const Municipio = require('./municipio.model');
const Sucursal = require('./sucursal.model');
const Usuario = require('./usuario.model');
const Marca = require('./marca.model');
const Categoria = require('./categoria.model');
const UnidadMedida = require('./unidadMedida.model');
const Color = require('./color.model');
const Producto = require('./producto.model');
const Proveedor = require('./proveedor.model');
const Lote = require('./lote.model');
const Inventario = require('./inventario.model');
const LoteInventario = require('./loteInventario.model');
const MovimientoInventario = require('./movimientoInventario.model');
const MetodoPago = require('./metodoPago.model');
const Cotizacion = require('./cotizacion.model');
const CotizacionDetalle = require('./cotizacionDetalle.model');
const Factura = require('./factura.model');
const FacturaDetalle = require('./facturaDetalle.model');
const FacturaPago = require('./facturaPago.model');
const FacturaAnulacion = require('./facturaAnulacion.model');
const Carrito = require('./carrito.model');
const CarritoItem = require('./carritoItem.model');
const Cliente = require('./cliente.model');

// ====================================
// ASOCIACIONES (RELACIONES)
// ====================================

// Roles y Permisos (Many to Many)
Rol.belongsToMany(Permiso, { through: RolPermiso, foreignKey: 'rol_id', as: 'permisos' });
Permiso.belongsToMany(Rol, { through: RolPermiso, foreignKey: 'permiso_id', as: 'roles' });

// Departamentos y Municipios
Departamento.hasMany(Municipio, { foreignKey: 'departamento_id', as: 'municipios' });
Municipio.belongsTo(Departamento, { foreignKey: 'departamento_id', as: 'departamento' });

// Municipios y Sucursales
Municipio.hasMany(Sucursal, { foreignKey: 'municipio_id', as: 'sucursales' });
Sucursal.belongsTo(Municipio, { foreignKey: 'municipio_id', as: 'municipio' });

// Usuarios y Roles
Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });

// Usuarios y Municipios
Municipio.hasMany(Usuario, { foreignKey: 'municipio_id', as: 'usuarios' });
Usuario.belongsTo(Municipio, { foreignKey: 'municipio_id', as: 'municipio' });

// Usuarios y Sucursales (solo empleados)
Sucursal.hasMany(Usuario, { foreignKey: 'sucursal_id', as: 'empleados' });
Usuario.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

// Categorías (auto-referencia para subcategorías)
Categoria.hasMany(Categoria, { foreignKey: 'categoria_padre_id', as: 'subcategorias' });
Categoria.belongsTo(Categoria, { foreignKey: 'categoria_padre_id', as: 'padre' });

// Productos y sus catálogos
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

Marca.hasMany(Producto, { foreignKey: 'marca_id', as: 'productos' });
Producto.belongsTo(Marca, { foreignKey: 'marca_id', as: 'marca' });

UnidadMedida.hasMany(Producto, { foreignKey: 'unidad_medida_id', as: 'productos' });
Producto.belongsTo(UnidadMedida, { foreignKey: 'unidad_medida_id', as: 'unidad_medida' });

Color.hasMany(Producto, { foreignKey: 'color_id', as: 'productos' });
Producto.belongsTo(Color, { foreignKey: 'color_id', as: 'color' });

// Lotes
Proveedor.hasMany(Lote, { foreignKey: 'proveedor_id', as: 'lotes' });
Lote.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

Producto.hasMany(Lote, { foreignKey: 'producto_id', as: 'lotes' });
Lote.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Inventarios
Sucursal.hasMany(Inventario, { foreignKey: 'sucursal_id', as: 'inventarios' });
Inventario.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

Producto.hasMany(Inventario, { foreignKey: 'producto_id', as: 'inventarios' });
Inventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Lotes e Inventarios (Many to Many)
Lote.belongsToMany(Inventario, { through: LoteInventario, foreignKey: 'lote_id', as: 'inventarios' });
Inventario.belongsToMany(Lote, { through: LoteInventario, foreignKey: 'inventario_id', as: 'lotes' });

// Lotes-Inventarios y Usuario
Usuario.hasMany(LoteInventario, { foreignKey: 'usuario_asigna_id', as: 'asignaciones_lote' });
LoteInventario.belongsTo(Usuario, { foreignKey: 'usuario_asigna_id', as: 'usuario_asigna' });

// Movimientos de Inventario
Sucursal.hasMany(MovimientoInventario, { foreignKey: 'sucursal_origen_id', as: 'movimientos_origen' });
Sucursal.hasMany(MovimientoInventario, { foreignKey: 'sucursal_destino_id', as: 'movimientos_destino' });
MovimientoInventario.belongsTo(Sucursal, { foreignKey: 'sucursal_origen_id', as: 'sucursal_origen' });
MovimientoInventario.belongsTo(Sucursal, { foreignKey: 'sucursal_destino_id', as: 'sucursal_destino' });

Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id', as: 'movimientos' });
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Usuario.hasMany(MovimientoInventario, { foreignKey: 'usuario_autoriza_id', as: 'movimientos_autorizados' });
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_autoriza_id', as: 'usuario_autoriza' });

// Cotizaciones
Usuario.hasMany(Cotizacion, { foreignKey: 'cliente_id', as: 'cotizaciones_cliente' });
Cotizacion.belongsTo(Usuario, { foreignKey: 'cliente_id', as: 'cliente' });

Sucursal.hasMany(Cotizacion, { foreignKey: 'sucursal_id', as: 'cotizaciones' });
Cotizacion.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

Usuario.hasMany(Cotizacion, { foreignKey: 'usuario_genera_id', as: 'cotizaciones_generadas' });
Cotizacion.belongsTo(Usuario, { foreignKey: 'usuario_genera_id', as: 'usuario_genera' });

// Cotizaciones Detalle
Cotizacion.hasMany(CotizacionDetalle, { foreignKey: 'cotizacion_id', as: 'detalles' });
CotizacionDetalle.belongsTo(Cotizacion, { foreignKey: 'cotizacion_id', as: 'cotizacion' });

Producto.hasMany(CotizacionDetalle, { foreignKey: 'producto_id', as: 'cotizaciones_detalle' });
CotizacionDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Facturas
Usuario.hasMany(Factura, { foreignKey: 'cliente_id', as: 'facturas_cliente' });
Factura.belongsTo(Usuario, { foreignKey: 'cliente_id', as: 'cliente' });

Sucursal.hasMany(Factura, { foreignKey: 'sucursal_id', as: 'facturas' });
Factura.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

Usuario.hasMany(Factura, { foreignKey: 'usuario_emite_id', as: 'facturas_emitidas' });
Factura.belongsTo(Usuario, { foreignKey: 'usuario_emite_id', as: 'usuario_emite' });

Cotizacion.hasMany(Factura, { foreignKey: 'cotizacion_id', as: 'facturas' });
Factura.belongsTo(Cotizacion, { foreignKey: 'cotizacion_id', as: 'cotizacion' });

// Facturas Detalle
Factura.hasMany(FacturaDetalle, { foreignKey: 'factura_id', as: 'detalles' });
FacturaDetalle.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

Producto.hasMany(FacturaDetalle, { foreignKey: 'producto_id', as: 'facturas_detalle' });
FacturaDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Lote.hasMany(FacturaDetalle, { foreignKey: 'lote_id', as: 'facturas_detalle' });
FacturaDetalle.belongsTo(Lote, { foreignKey: 'lote_id', as: 'lote' });

// Facturas Pagos
Factura.hasMany(FacturaPago, { foreignKey: 'factura_id', as: 'pagos' });
FacturaPago.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

MetodoPago.hasMany(FacturaPago, { foreignKey: 'metodo_pago_id', as: 'facturas_pagos' });
FacturaPago.belongsTo(MetodoPago, { foreignKey: 'metodo_pago_id', as: 'metodo_pago' });

// Facturas Anulaciones
Factura.hasOne(FacturaAnulacion, { foreignKey: 'factura_id', as: 'anulacion' });
FacturaAnulacion.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

Usuario.hasMany(FacturaAnulacion, { foreignKey: 'usuario_anula_id', as: 'anulaciones_realizadas' });
FacturaAnulacion.belongsTo(Usuario, { foreignKey: 'usuario_anula_id', as: 'usuario_anula' });

// Carritos
Usuario.hasMany(Carrito, { foreignKey: 'usuario_id', as: 'carritos' });
Carrito.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Sucursal.hasMany(Carrito, { foreignKey: 'sucursal_id', as: 'carritos' });
Carrito.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

// Carritos Items
Carrito.hasMany(CarritoItem, { foreignKey: 'carrito_id', as: 'items' });
CarritoItem.belongsTo(Carrito, { foreignKey: 'carrito_id', as: 'carrito' });

Producto.hasMany(CarritoItem, { foreignKey: 'producto_id', as: 'carritos_items' });
CarritoItem.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Clientes y Municipios
Cliente.belongsTo(Municipio, { foreignKey: 'municipio_id', as: 'municipio' });
Municipio.hasMany(Cliente, { foreignKey: 'municipio_id', as: 'clientes' });

// Facturas con Clientes físicos
Cliente.hasMany(Factura, { foreignKey: 'cliente_fisico_id', as: 'facturas' });
Factura.belongsTo(Cliente, { foreignKey: 'cliente_fisico_id', as: 'cliente_fisico' });

// ====================================
// EXPORTAR TODOS LOS MODELOS
// ====================================
module.exports = {
  sequelize,
  Rol,
  Permiso,
  RolPermiso,
  Departamento,
  Municipio,
  Sucursal,
  Usuario,
  Marca,
  Categoria,
  UnidadMedida,
  Color,
  Producto,
  Proveedor,
  Lote,
  Inventario,
  LoteInventario,
  MovimientoInventario,
  MetodoPago,
  Cotizacion,
  CotizacionDetalle,
  Factura,
  FacturaDetalle,
  FacturaPago,
  FacturaAnulacion,
  Carrito,
  CarritoItem,
  Cliente
};