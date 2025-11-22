const { generarPDF, generarExcel } = require('../utils/reporteExporter');

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Reporte 1: Total facturado por método de pago entre fechas
 */
exports.facturacionMetodoPago = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar fecha_inicio y fecha_fin'
            });
        }
        
        const resultados = await sequelize.query(
            'CALL sp_reporte_facturacion_metodo_pago(:fecha_inicio, :fecha_fin)',
            { replacements: { fecha_inicio, fecha_fin } }
        );

        // Si está vacío, devolver datos en ceros
        if (!resultados || resultados.length === 0 || !resultados[0]) {
            return res.json({
                success: true,
                data: [
                    { metodo_pago: 'Total General', cantidad_facturas: '-', total_facturado: 0 },
                    { metodo_pago: 'Efectivo', cantidad_facturas: '-', total_facturado: 0 },
                    { metodo_pago: 'Tarjeta', cantidad_facturas: '-', total_facturado: 0 },
                    { metodo_pago: 'Cheque', cantidad_facturas: '-', total_facturado: 0 },
                    { metodo_pago: 'Transferencia', cantidad_facturas: '-', total_facturado: 0 }
                ],
                periodo: { fecha_inicio, fecha_fin },
                mensaje: 'No hay facturas en el período seleccionado'
            });
        }

        // Transformar resultado - convertir NULL a 0
        const fila = resultados[0];
        const datosFormateados = [
            { metodo_pago: 'Total General', cantidad_facturas: '-', total_facturado: parseFloat(fila.total_general) || 0 },
            { metodo_pago: 'Efectivo', cantidad_facturas: '-', total_facturado: parseFloat(fila.efectivo) || 0 },
            { metodo_pago: 'Tarjeta', cantidad_facturas: '-', total_facturado: parseFloat(fila.tarjeta) || 0 },
            { metodo_pago: 'Cheque', cantidad_facturas: '-', total_facturado: parseFloat(fila.cheque) || 0 },
            { metodo_pago: 'Transferencia', cantidad_facturas: '-', total_facturado: parseFloat(fila.transferencia) || 0 }
        ];
        
        res.json({
            success: true,
            data: datosFormateados,
            periodo: { fecha_inicio, fecha_fin }
        });
        
    } catch (error) {
        console.error('Error en reporte facturación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 2: Productos que más dinero generan
 */
exports.productosMasIngresos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, limite = 10 } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar fecha_inicio y fecha_fin'
            });
        }
        
        const resultados = await sequelize.query(
            'CALL sp_reporte_productos_mas_ingresos(:fecha_inicio, :fecha_fin, :limite)',
            { replacements: { fecha_inicio, fecha_fin, limite: parseInt(limite) } }
        );

        // FIXED
        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            producto_nombre: item.nombre,
            sku: item.sku,
            categoria_nombre: item.categoria,
            total_vendido: item.cantidad_vendida,
            total_ingresos: item.total_generado
        }));
        
        res.json({
            success: true,
            data: datos,
            periodo: { fecha_inicio, fecha_fin }
        });
        
    } catch (error) {
        console.error('Error en reporte productos más ingresos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 3: Productos más vendidos
 */
exports.productosMasVendidos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, limite = 10 } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar fecha_inicio y fecha_fin'
            });
        }
        
        const resultados = await sequelize.query(
            'CALL sp_reporte_productos_mas_vendidos(:fecha_inicio, :fecha_fin, :limite)',
            { replacements: { fecha_inicio, fecha_fin, limite: parseInt(limite) } }
        );

        // FIXED
        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            producto_nombre: item.nombre,
            sku: item.sku,
            unidad_medida: item.unidad_medida,
            total_vendido: item.cantidad_vendida,
            total_ingresos: item.total_ingresos
        }));
        
        res.json({
            success: true,
            data: datos,
            periodo: { fecha_inicio, fecha_fin }
        });
        
    } catch (error) {
        console.error('Error en reporte productos más vendidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 4: Inventario general
 */
exports.inventarioGeneral = async (req, res) => {
    try {
        const resultados = await sequelize.query('CALL sp_reporte_inventario_general()');

        // FIXED
        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            sucursal_nombre: item.sucursal,
            producto_nombre: item.producto,
            sku: item.sku,
            categoria_nombre: item.categoria,
            marca_nombre: item.marca,
            stock_actual: item.stock_actual,
            stock_minimo: item.stock_minimo
        }));
        
        res.json({
            success: true,
            data: datos
        });
        
    } catch (error) {
        console.error('Error en reporte inventario general:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 5: Productos menos vendidos
 */
exports.productosMenosVendidos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, limite = 10 } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar fecha_inicio y fecha_fin'
            });
        }

        const resultados = await sequelize.query(
            'CALL sp_reporte_productos_menos_vendidos(:fecha_inicio, :fecha_fin, :limite)',
            { replacements: { fecha_inicio, fecha_fin, limite: parseInt(limite) } }
        );

        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            producto_nombre: item.nombre,
            sku: item.sku,
            total_vendido: item.cantidad_vendida,
            total_ingresos: item.total_ingresos
        }));

        res.json({
            success: true,
            data: datos,
            periodo: { fecha_inicio, fecha_fin }
        });

    } catch (error) {
        console.error('Error en reporte productos menos vendidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 6: Productos sin stock
 */
exports.productosSinStock = async (req, res) => {
    try {
        const resultados = await sequelize.query('CALL sp_reporte_productos_sin_stock()');

        // FIXED
        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            sucursal_nombre: item.sucursal,
            producto_nombre: item.producto,
            sku: item.sku,
            categoria_nombre: item.categoria || ''
        }));
        
        res.json({
            success: true,
            data: datos
        });
        
    } catch (error) {
        console.error('Error en reporte productos sin stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 7: Detalle de factura
 */
exports.detalleFactura = async (req, res) => {
    try {
        const { numero_factura } = req.params;
        
        if (!numero_factura) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el número de factura'
            });
        }
        
        // Consultar encabezado
        const [encabezado] = await sequelize.query(
            `SELECT
                f.numero_factura, f.serie, f.correlativo, f.fecha_emision,
                f.tipo_venta, f.cliente_tipo, f.cliente_nombre, f.cliente_nit,
                f.cliente_direccion, f.subtotal, f.descuento_total, f.total, f.estado,
                CONCAT(u.nombre, ' ', u.apellido) AS empleado_emite,
                s.nombre AS sucursal
            FROM facturas f
            JOIN usuarios u ON f.usuario_emite_id = u.id
            JOIN sucursales s ON f.sucursal_id = s.id
            WHERE f.numero_factura = :numero_factura`,
            { replacements: { numero_factura } }
        );

        // Consultar productos
        const [productos] = await sequelize.query(
            `SELECT
                COALESCE(fd.producto_nombre, p.nombre) AS producto_nombre,
                COALESCE(fd.producto_sku, p.sku) AS producto_sku,
                fd.cantidad, fd.precio_unitario, fd.subtotal
            FROM facturas_detalle fd
            JOIN facturas f ON fd.factura_id = f.id
            LEFT JOIN productos p ON fd.producto_id = p.id
            WHERE f.numero_factura = :numero_factura`,
            { replacements: { numero_factura } }
        );

        // Consultar métodos de pago
        const [pagos] = await sequelize.query(
            `SELECT
                mp.nombre AS metodo_pago, fp.monto,
                fp.numero_referencia, fp.banco, fp.fecha_pago
            FROM facturas_pagos fp
            JOIN facturas f ON fp.factura_id = f.id
            JOIN metodos_pago mp ON fp.metodo_pago_id = mp.id
            WHERE f.numero_factura = :numero_factura`,
            { replacements: { numero_factura } }
        );

        res.json({
            success: true,
            data: {
                encabezado: encabezado[0] || null,
                productos: productos || [],
                pagos: pagos || []
            }
        });
        
    } catch (error) {
        console.error('Error en reporte detalle factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 8: Ingresos al inventario
 */
exports.ingresosInventario = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar fecha_inicio y fecha_fin'
            });
        }
        
        const resultados = await sequelize.query(
            'CALL sp_reporte_ingresos_inventario(:fecha_inicio, :fecha_fin)',
            { replacements: { fecha_inicio, fecha_fin } }
        );
        
        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            codigo_lote: item.codigo_lote,
            fecha_ingreso: item.fecha_ingreso,
            producto_nombre: item.producto,
            proveedor_nombre: item.proveedor,
            cantidad_total: item.cantidad_total,
            precio_compra_unidad: item.precio_compra_unidad,
            costo_total: item.costo_total,
            sucursales_asignadas: item.sucursales_asignadas
        }));
        
        res.json({
            success: true,
            data: datos,
            periodo: { fecha_inicio, fecha_fin }
        });
        
    } catch (error) {
        console.error('Error en reporte ingresos inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 9: Stock bajo mínimo
 */
exports.stockBajoMinimo = async (req, res) => {
    try {
        const resultados = await sequelize.query('CALL sp_reporte_stock_bajo_minimo()');

        // FIXED
        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            sucursal_nombre: item.sucursal,
            producto_nombre: item.producto,
            sku: item.sku,
            categoria_nombre: item.categoria || '',
            stock_actual: item.stock_actual,
            stock_minimo: item.stock_minimo
        }));
        
        res.json({
            success: true,
            data: datos
        });
        
    } catch (error) {
        console.error('Error en reporte stock bajo mínimo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Reporte 10: Inventario por tienda
 */
exports.inventarioPorTienda = async (req, res) => {
    try {
        const { sucursal_id } = req.params;
        
        if (!sucursal_id) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el ID de la sucursal'
            });
        }
        
        const resultados = await sequelize.query(
            'CALL sp_reporte_inventario_por_tienda(:sucursal_id)',
            { replacements: { sucursal_id: parseInt(sucursal_id) } }
        );

        // FIXED
        const datos = (Array.isArray(resultados) ? resultados : []).map(item => ({
            producto_nombre: item.producto,
            sku: item.sku,
            categoria_nombre: item.categoria,
            marca_nombre: item.marca,
            stock_actual: item.stock_actual,
            stock_minimo: item.stock_minimo,
            stock_maximo: item.stock_maximo
        }));
        
        res.json({
            success: true,
            data: datos
        });
        
    } catch (error) {
        console.error('Error en reporte inventario por tienda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Exportar reporte en PDF o Excel
 */
exports.exportarReporte = async (req, res) => {
  try {
    const { tipo, formato } = req.params;
    const { fecha_inicio, fecha_fin, limite, sucursal_id, numero_factura } = req.query;

    let datos = [];
    let titulo = '';
    let columnas = [];

    // Obtener datos según el tipo de reporte
    switch (tipo) {
      case 'facturacion-metodo-pago':
        if (!fecha_inicio || !fecha_fin) {
          return res.status(400).json({
            success: false,
            message: 'Debe proporcionar fecha_inicio y fecha_fin'
          });
        }
        titulo = `Facturación por Método de Pago (${fecha_inicio} al ${fecha_fin})`;
        const [r1] = await sequelize.query(
          'CALL sp_reporte_facturacion_metodo_pago(:fecha_inicio, :fecha_fin)',
          { replacements: { fecha_inicio, fecha_fin } }
        );
        const fila = (r1 && r1[0]) || {};
        datos = [
          { metodo_pago: 'Total General', total_facturado: `Q${parseFloat(fila.total_general || 0).toFixed(2)}` },
          { metodo_pago: 'Efectivo', total_facturado: `Q${parseFloat(fila.efectivo || 0).toFixed(2)}` },
          { metodo_pago: 'Tarjeta', total_facturado: `Q${parseFloat(fila.tarjeta || 0).toFixed(2)}` },
          { metodo_pago: 'Cheque', total_facturado: `Q${parseFloat(fila.cheque || 0).toFixed(2)}` },
          { metodo_pago: 'Transferencia', total_facturado: `Q${parseFloat(fila.transferencia || 0).toFixed(2)}` }
        ];
        columnas = [
          { header: 'Método de Pago', field: 'metodo_pago', width: 25 },
          { header: 'Total Facturado', field: 'total_facturado', width: 20 }
        ];
        break;

      case 'productos-mas-ingresos':
        if (!fecha_inicio || !fecha_fin) {
          return res.status(400).json({
            success: false,
            message: 'Debe proporcionar fecha_inicio y fecha_fin'
          });
        }
        titulo = `Productos que Más Ingresos Generan (${fecha_inicio} al ${fecha_fin})`;
        const r2 = await sequelize.query(
          'CALL sp_reporte_productos_mas_ingresos(:fecha_inicio, :fecha_fin, :limite)',
          { replacements: { fecha_inicio, fecha_fin, limite: parseInt(limite) || 10 } }
        );
        datos = (Array.isArray(r2) ? r2 : []).map(item => ({
          nombre: item.nombre,
          sku: item.sku,
          categoria: item.categoria,
          cantidad_vendida: item.cantidad_vendida,
          total_generado: `Q${parseFloat(item.total_generado).toFixed(2)}`
        }));
        columnas = [
          { header: 'Producto', field: 'nombre', width: 30 },
          { header: 'SKU', field: 'sku', width: 15 },
          { header: 'Categoría', field: 'categoria', width: 20 },
          { header: 'Cantidad Vendida', field: 'cantidad_vendida', width: 18 },
          { header: 'Total Ingresos', field: 'total_generado', width: 20 }
        ];
        break;

      case 'productos-mas-vendidos':
        if (!fecha_inicio || !fecha_fin) {
          return res.status(400).json({
            success: false,
            message: 'Debe proporcionar fecha_inicio y fecha_fin'
          });
        }
        titulo = `Productos Más Vendidos (${fecha_inicio} al ${fecha_fin})`;
        const r3 = await sequelize.query(
          'CALL sp_reporte_productos_mas_vendidos(:fecha_inicio, :fecha_fin, :limite)',
          { replacements: { fecha_inicio, fecha_fin, limite: parseInt(limite) || 10 } }
        );
        datos = (Array.isArray(r3) ? r3 : []).map(item => ({
          nombre: item.nombre,
          sku: item.sku,
          unidad_medida: item.unidad_medida,
          cantidad_vendida: item.cantidad_vendida,
          total_ingresos: `Q${parseFloat(item.total_ingresos).toFixed(2)}`
        }));
        columnas = [
          { header: 'Producto', field: 'nombre', width: 30 },
          { header: 'SKU', field: 'sku', width: 15 },
          { header: 'U. Medida', field: 'unidad_medida', width: 15 },
          { header: 'Cantidad', field: 'cantidad_vendida', width: 15 },
          { header: 'Ingresos', field: 'total_ingresos', width: 20 }
        ];
        break;

      case 'inventario-general':
        titulo = 'Inventario General';
        const r4 = await sequelize.query('CALL sp_reporte_inventario_general()');
        datos = (Array.isArray(r4) ? r4 : []).map(item => ({
          sucursal: item.sucursal,
          producto: item.producto,
          sku: item.sku,
          categoria: item.categoria,
          marca: item.marca,
          stock_actual: item.stock_actual,
          stock_minimo: item.stock_minimo,
          precio_venta: `Q${parseFloat(item.precio_venta).toFixed(2)}`,
          valor_inventario: `Q${parseFloat(item.valor_inventario).toFixed(2)}`
        }));
        columnas = [
          { header: 'Sucursal', field: 'sucursal', width: 20 },
          { header: 'Producto', field: 'producto', width: 30 },
          { header: 'SKU', field: 'sku', width: 15 },
          { header: 'Stock', field: 'stock_actual', width: 12 },
          { header: 'Mínimo', field: 'stock_minimo', width: 12 },
          { header: 'Valor', field: 'valor_inventario', width: 18 }
        ];
        break;

      case 'productos-menos-vendidos':
        if (!fecha_inicio || !fecha_fin) {
          return res.status(400).json({
            success: false,
            message: 'Debe proporcionar fecha_inicio y fecha_fin'
          });
        }
        titulo = `Productos Menos Vendidos (${fecha_inicio} al ${fecha_fin})`;
        const r5 = await sequelize.query(
          'CALL sp_reporte_productos_menos_vendidos(:fecha_inicio, :fecha_fin, :limite)',
          { replacements: { fecha_inicio, fecha_fin, limite: parseInt(limite) || 10 } }
        );
        datos = (Array.isArray(r5) ? r5 : []).map(item => ({
          nombre: item.nombre,
          sku: item.sku,
          cantidad_vendida: item.cantidad_vendida,
          total_ingresos: `Q${parseFloat(item.total_ingresos).toFixed(2)}`
        }));
        columnas = [
          { header: 'Producto', field: 'nombre', width: 30 },
          { header: 'SKU', field: 'sku', width: 15 },
          { header: 'Cantidad', field: 'cantidad_vendida', width: 15 },
          { header: 'Ingresos', field: 'total_ingresos', width: 20 }
        ];
        break;

      case 'productos-sin-stock':
        titulo = 'Productos Sin Stock';
        const r6 = await sequelize.query('CALL sp_reporte_productos_sin_stock()');
        datos = (Array.isArray(r6) ? r6 : []).map(item => ({
          sucursal: item.sucursal,
          producto: item.producto,
          sku: item.sku,
          proveedor: item.proveedor_sugerido || 'N/A',
          telefono: item.telefono_proveedor || 'N/A'
        }));
        columnas = [
          { header: 'Sucursal', field: 'sucursal', width: 20 },
          { header: 'Producto', field: 'producto', width: 30 },
          { header: 'SKU', field: 'sku', width: 15 },
          { header: 'Proveedor', field: 'proveedor', width: 25 },
          { header: 'Teléfono', field: 'telefono', width: 15 }
        ];
        break;

      case 'detalle-factura':
        titulo = `Detalle de Factura ${numero_factura}`;
        const r7 = await sequelize.query(
          'CALL sp_reporte_detalle_factura(:numero_factura)',
          { replacements: { numero_factura } }
        );
        const enc = r7[0][0];
        const prods = r7[1] || [];
        const pagos = r7[2] || [];

        if (!enc) {
          return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        datos = [
          { campo: 'Número Factura', valor: enc.numero_factura },
          { campo: 'Cliente', valor: enc.cliente_nombre },
          { campo: 'NIT', valor: enc.cliente_nit },
          { campo: 'Fecha', valor: enc.fecha_emision },
          { campo: 'Estado', valor: enc.estado_texto },
          { campo: '', valor: '' },
          { campo: '=== PRODUCTOS ===', valor: '' },
          ...prods.map(p => ({
            campo: `${p.producto_nombre} (${p.cantidad})`,
            valor: `Q${parseFloat(p.subtotal).toFixed(2)}`
          })),
          { campo: '', valor: '' },
          { campo: 'Subtotal', valor: `Q${parseFloat(enc.subtotal).toFixed(2)}` },
          { campo: 'Descuento', valor: `Q${parseFloat(enc.descuento_total).toFixed(2)}` },
          { campo: 'TOTAL', valor: `Q${parseFloat(enc.total).toFixed(2)}` }
        ];
        columnas = [
          { header: 'Campo', field: 'campo', width: 35 },
          { header: 'Valor', field: 'valor', width: 30 }
        ];
        break;

      case 'ingresos-inventario':
        if (!fecha_inicio || !fecha_fin) {
          return res.status(400).json({
            success: false,
            message: 'Debe proporcionar fecha_inicio y fecha_fin'
          });
        }
        titulo = `Ingresos al Inventario (${fecha_inicio} al ${fecha_fin})`;
        const r8 = await sequelize.query(
          'CALL sp_reporte_ingresos_inventario(:fecha_inicio, :fecha_fin)',
          { replacements: { fecha_inicio, fecha_fin } }
        );
        datos = (Array.isArray(r8) ? r8 : []).map(item => ({
          codigo_lote: item.codigo_lote,
          fecha: item.fecha_ingreso,
          producto: item.producto,
          proveedor: item.proveedor,
          cantidad: item.cantidad_total,
          costo_total: `Q${parseFloat(item.costo_total).toFixed(2)}`,
          sucursales: item.sucursales_asignadas || 'Sin asignar'
        }));
        columnas = [
          { header: 'Código Lote', field: 'codigo_lote', width: 20 },
          { header: 'Fecha', field: 'fecha', width: 15 },
          { header: 'Producto', field: 'producto', width: 30 },
          { header: 'Proveedor', field: 'proveedor', width: 25 },
          { header: 'Cantidad', field: 'cantidad', width: 15 },
          { header: 'Costo Total', field: 'costo_total', width: 18 }
        ];
        break;

      case 'stock-bajo-minimo':
        titulo = 'Productos con Stock Bajo el Mínimo';
        const r9 = await sequelize.query('CALL sp_reporte_stock_bajo_minimo()');
        datos = (Array.isArray(r9) ? r9 : []).map(item => ({
          sucursal: item.sucursal,
          producto: item.producto,
          sku: item.sku,
          stock_actual: item.stock_actual,
          stock_minimo: item.stock_minimo,
          cantidad_requerida: item.cantidad_requerida,
          proveedor: item.proveedor_sugerido || 'N/A'
        }));
        columnas = [
          { header: 'Sucursal', field: 'sucursal', width: 20 },
          { header: 'Producto', field: 'producto', width: 30 },
          { header: 'Stock', field: 'stock_actual', width: 12 },
          { header: 'Mínimo', field: 'stock_minimo', width: 12 },
          { header: 'Requerido', field: 'cantidad_requerida', width: 15 },
          { header: 'Proveedor', field: 'proveedor', width: 25 }
        ];
        break;

      case 'inventario-por-tienda':
        if (!sucursal_id) {
          return res.status(400).json({
            success: false,
            message: 'Debe proporcionar el ID de la sucursal'
          });
        }
        titulo = `Inventario por Tienda (Sucursal ID: ${sucursal_id})`;
        const r10 = await sequelize.query(
          'CALL sp_reporte_inventario_por_tienda(:sucursal_id)',
          { replacements: { sucursal_id: parseInt(sucursal_id) } }
        );
        datos = (Array.isArray(r10) ? r10 : []).map(item => ({
          producto: item.producto,
          sku: item.sku,
          categoria: item.categoria,
          marca: item.marca,
          stock_actual: item.stock_actual,
          stock_minimo: item.stock_minimo,
          stock_maximo: item.stock_maximo,
          estado: item.estado_stock
        }));
        columnas = [
          { header: 'Producto', field: 'producto', width: 30 },
          { header: 'SKU', field: 'sku', width: 15 },
          { header: 'Categoría', field: 'categoria', width: 20 },
          { header: 'Stock', field: 'stock_actual', width: 12 },
          { header: 'Mínimo', field: 'stock_minimo', width: 12 },
          { header: 'Máximo', field: 'stock_maximo', width: 12 },
          { header: 'Estado', field: 'estado', width: 15 }
        ];
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido'
        });
    }

    // Generar según formato
    if (formato === 'pdf') {
      await generarPDF(titulo, datos, columnas, res);
    } else if (formato === 'excel') {
      await generarExcel(titulo, datos, columnas, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Formato no válido. Use pdf o excel'
      });
    }

  } catch (error) {
    console.error('Error al exportar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte',
      error: error.message
    });
  }
};