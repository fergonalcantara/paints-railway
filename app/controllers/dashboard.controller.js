const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Dashboard general con estadísticas
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // Ventas del periodo
    const ventas = await sequelize.query(`
      SELECT 
        COUNT(*) as total_facturas,
        SUM(total) as total_vendido,
        AVG(total) as ticket_promedio,
        SUM(CASE WHEN tipo_venta = 'online' THEN 1 ELSE 0 END) as ventas_online,
        SUM(CASE WHEN tipo_venta = 'fisica' THEN 1 ELSE 0 END) as ventas_fisicas
      FROM facturas
      WHERE DATE(fecha_emision) BETWEEN :fecha_inicio AND :fecha_fin
      AND estado = 1
    `, {
      replacements: { fecha_inicio, fecha_fin },
      type: QueryTypes.SELECT
    });

    // Productos con bajo stock
    const productosStockBajo = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM inventarios
      WHERE stock_actual < stock_minimo
      AND estado = 1
    `, {
      type: QueryTypes.SELECT
    });

    // Productos sin stock
    const productosSinStock = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM inventarios
      WHERE stock_actual = 0
      AND estado = 1
    `, {
      type: QueryTypes.SELECT
    });

    // Top 5 productos más vendidos
    const topProductos = await sequelize.query(`
      SELECT 
        p.nombre,
        SUM(fd.cantidad) as cantidad_vendida,
        SUM(fd.subtotal) as total_ingresos
      FROM facturas_detalle fd
      JOIN facturas f ON fd.factura_id = f.id
      JOIN productos p ON fd.producto_id = p.id
      WHERE DATE(f.fecha_emision) BETWEEN :fecha_inicio AND :fecha_fin
      AND f.estado = 1
      GROUP BY p.id
      ORDER BY total_ingresos DESC
      LIMIT 5
    `, {
      replacements: { fecha_inicio, fecha_fin },
      type: QueryTypes.SELECT
    });

    // Ventas por sucursal
    const ventasPorSucursal = await sequelize.query(`
      SELECT 
        s.nombre as sucursal,
        COUNT(f.id) as total_facturas,
        SUM(f.total) as total_vendido
      FROM facturas f
      JOIN sucursales s ON f.sucursal_id = s.id
      WHERE DATE(f.fecha_emision) BETWEEN :fecha_inicio AND :fecha_fin
      AND f.estado = 1
      GROUP BY s.id
      ORDER BY total_vendido DESC
    `, {
      replacements: { fecha_inicio, fecha_fin },
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        ventas: ventas[0],
        inventario: {
          productos_stock_bajo: productosStockBajo[0].total,
          productos_sin_stock: productosSinStock[0].total
        },
        top_productos: topProductos,
        ventas_por_sucursal: ventasPorSucursal
      },
      periodo: { fecha_inicio, fecha_fin }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Ventas por día (para gráficas)
 */
exports.ventasPorDia = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const resultado = await sequelize.query(`
      SELECT 
        DATE(fecha_emision) as fecha,
        COUNT(*) as total_facturas,
        SUM(total) as total_vendido
      FROM facturas
      WHERE DATE(fecha_emision) BETWEEN :fecha_inicio AND :fecha_fin
      AND estado = 1
      GROUP BY DATE(fecha_emision)
      ORDER BY fecha ASC
    `, {
      replacements: { fecha_inicio, fecha_fin },
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por día',
      error: error.message
    });
  }
};