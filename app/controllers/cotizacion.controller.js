const { 
  Cotizacion, 
  CotizacionDetalle, 
  Usuario, 
  Producto, 
  Sucursal,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

/**
 * Crear cotización
 */
exports.crearCotizacion = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      cliente_id,
      sucursal_id,
      fecha_vencimiento,
      productos, // [{ producto_id, cantidad, precio_unitario, descuento_porcentaje }]
      observaciones
    } = req.body;

    const usuario_genera_id = req.session.userId;

    if (!productos || productos.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
    }

    // Calcular totales
    let subtotal = 0;
    let descuento_total = 0;

    const detallesConInfo = [];

    for (const prod of productos) {
      const producto = await Producto.findByPk(prod.producto_id);
      if (!producto) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Producto ${prod.producto_id} no encontrado`
        });
      }

      const precio = prod.precio_unitario || producto.precio_venta;
      const descuento_monto = (precio * prod.cantidad * (prod.descuento_porcentaje || 0)) / 100;
      const subtotal_prod = (precio * prod.cantidad) - descuento_monto;

      subtotal += subtotal_prod;
      descuento_total += descuento_monto;

      detallesConInfo.push({
        producto_id: prod.producto_id,
        cantidad: prod.cantidad,
        precio_unitario: precio,
        descuento_porcentaje: prod.descuento_porcentaje || 0,
        subtotal: subtotal_prod
      });
    }

    const total = subtotal;

    // Generar número de cotización
    const ultimaCotizacion = await Cotizacion.findOne({
      order: [['id', 'DESC']]
    });

    const numeroCorrelativo = ultimaCotizacion ? parseInt(ultimaCotizacion.numero_cotizacion.split('-')[1]) + 1 : 1;
    const numero_cotizacion = `COT-${String(numeroCorrelativo).padStart(8, '0')}`;

    // Crear cotización
    const cotizacion = await Cotizacion.create({
      numero_cotizacion,
      cliente_id,
      sucursal_id,
      usuario_genera_id,
      fecha_vencimiento,
      subtotal,
      descuento_total,
      total,
      observaciones,
      estado: 1 // Vigente
    }, { transaction: t });

    // Crear detalles
    for (const detalle of detallesConInfo) {
      await CotizacionDetalle.create({
        cotizacion_id: cotizacion.id,
        ...detalle
      }, { transaction: t });
    }

    await t.commit();

    // Recargar con relaciones
    await cotizacion.reload({
      include: [
        { model: Usuario, as: 'cliente', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'usuario_genera', attributes: ['id', 'nombre', 'apellido'] },
        {
          model: CotizacionDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: cotizacion
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al crear cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cotización',
      error: error.message
    });
  }
};

/**
 * Obtener cotización por número
 */
exports.obtenerCotizacionPorNumero = async (req, res) => {
  try {
    const { numero_cotizacion } = req.params;

    const cotizacion = await Cotizacion.findOne({
      where: { numero_cotizacion },
      include: [
        { model: Usuario, as: 'cliente' },
        { model: Sucursal, as: 'sucursal' },
        { model: Usuario, as: 'usuario_genera' },
        {
          model: CotizacionDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      data: cotizacion
    });

  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotización',
      error: error.message
    });
  }
};

/**
 * Listar cotizaciones
 */
exports.listarCotizaciones = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      cliente_id,
      sucursal_id,
      estado
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {};

    if (cliente_id) {
      where.cliente_id = cliente_id;
    }

    if (sucursal_id) {
      where.sucursal_id = sucursal_id;
    }

    if (estado !== undefined) {
      where.estado = parseInt(estado);
    }

    const { count, rows } = await Cotizacion.findAndCountAll({
      where,
      include: [
        { model: Usuario, as: 'cliente', attributes: ['id', 'nombre', 'apellido'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_cotizacion', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error al listar cotizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar cotizaciones',
      error: error.message
    });
  }
};

/**
 * Cambiar estado de cotización
 */
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 1=Vigente, 2=Aceptada, 3=Rechazada, 4=Vencida

    const cotizacion = await Cotizacion.findByPk(id);

    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    await cotizacion.update({ estado });

    res.json({
      success: true,
      message: 'Estado actualizado',
      data: cotizacion
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};