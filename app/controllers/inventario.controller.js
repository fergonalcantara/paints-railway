const { 
  Inventario, 
  Producto, 
  Sucursal, 
  Lote, 
  LoteInventario,
  Proveedor,
  Usuario,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener inventario por sucursal
 */
exports.obtenerInventarioPorSucursal = async (req, res) => {
  try {
    const { sucursal_id } = req.params;
    const { page = 1, limit = 20, buscar, bajo_stock } = req.query;

    const offset = (page - 1) * limit;

    const where = { sucursal_id, estado: 1 };

    // Filtrar productos con bajo stock
    if (bajo_stock === 'true') {
      where[Op.and] = sequelize.literal('stock_actual < stock_minimo');
    }

    const include = [
      {
        model: Producto,
        as: 'producto',
        attributes: ['id', 'sku', 'nombre', 'precio_venta'],
        where: buscar ? {
          [Op.or]: [
            { nombre: { [Op.like]: `%${buscar}%` } },
            { sku: { [Op.like]: `%${buscar}%` } }
          ]
        } : {}
      },
      {
        model: Sucursal,
        as: 'sucursal',
        attributes: ['id', 'nombre']
      }
    ];

    const { count, rows } = await Inventario.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['stock_actual', 'ASC']]
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
    console.error('Error al obtener inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario',
      error: error.message
    });
  }
};

/**
 * Crear o actualizar inventario
 */
exports.actualizarInventario = async (req, res) => {
  try {
    const { sucursal_id, producto_id, stock_minimo, stock_maximo } = req.body;

    // Buscar si existe
    let inventario = await Inventario.findOne({
      where: { sucursal_id, producto_id }
    });

    if (inventario) {
      // Actualizar
      await inventario.update({
        stock_minimo: stock_minimo !== undefined ? stock_minimo : inventario.stock_minimo,
        stock_maximo: stock_maximo !== undefined ? stock_maximo : inventario.stock_maximo
      });

      res.json({
        success: true,
        message: 'Inventario actualizado',
        data: inventario
      });

    } else {
      // Crear nuevo
      inventario = await Inventario.create({
        sucursal_id,
        producto_id,
        stock_actual: 0,
        stock_minimo: stock_minimo || 5,
        stock_maximo: stock_maximo || 1000,
        estado: 1
      });

      res.status(201).json({
        success: true,
        message: 'Inventario creado',
        data: inventario
      });
    }

  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar inventario',
      error: error.message
    });
  }
};

/**
 * Registrar ingreso de lote
 */
exports.registrarLote = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      codigo_lote,
      proveedor_id,
      producto_id,
      fecha_ingreso,
      cantidad_total,
      precio_compra_unidad,
      numero_factura_proveedor,
      distribuciones // [{ inventario_id, cantidad }]
    } = req.body;

    const usuario_asigna_id = req.session.userId;

    // Validar que la suma de distribuciones = cantidad_total
    const totalDistribuido = distribuciones.reduce((sum, d) => sum + d.cantidad, 0);
    if (totalDistribuido !== cantidad_total) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'La suma de distribuciones debe ser igual a la cantidad total'
      });
    }

    // Crear lote
    const lote = await Lote.create({
      codigo_lote,
      proveedor_id,
      producto_id,
      fecha_ingreso,
      cantidad_total,
      cantidad_disponible: cantidad_total,
      precio_compra_unidad,
      costo_total: cantidad_total * precio_compra_unidad,
      numero_factura_proveedor,
      estado: 1
    }, { transaction: t });

    // Distribuir a inventarios
    for (const dist of distribuciones) {
      await LoteInventario.create({
        lote_id: lote.id,
        inventario_id: dist.inventario_id,
        cantidad_asignada: dist.cantidad,
        usuario_asigna_id
      }, { transaction: t });

      // El trigger trg_after_lote_inventario_insert actualizará automáticamente:
      // - inventarios.stock_actual += cantidad
      // - lotes.cantidad_disponible -= cantidad
    }

    await t.commit();

    // Recargar con relaciones
    await lote.reload({
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: Producto, as: 'producto' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Lote registrado y distribuido exitosamente',
      data: lote
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al registrar lote:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar lote',
      error: error.message
    });
  }
};

/**
 * Obtener lotes de un producto
 */
exports.obtenerLotesProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;

    const lotes = await Lote.findAll({
      where: {
        producto_id,
        cantidad_disponible: { [Op.gt]: 0 },
        estado: 1
      },
      include: [
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre_comercial'] }
      ],
      order: [['fecha_ingreso', 'DESC']]
    });

    res.json({
      success: true,
      data: lotes
    });

  } catch (error) {
    console.error('Error al obtener lotes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes',
      error: error.message
    });
  }
};

/**
 * Productos con bajo stock
 */
exports.productosBajoStock = async (req, res) => {
  try {
    const { sucursal_id } = req.query;

    const where = {
      estado: 1,
      [Op.and]: sequelize.literal('stock_actual < stock_minimo')
    };

    if (sucursal_id) {
      where.sucursal_id = sucursal_id;
    }

    const inventarios = await Inventario.findAll({
      where,
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'sku', 'nombre', 'precio_venta']
        },
        {
          model: Sucursal,
          as: 'sucursal',
          attributes: ['id', 'nombre']
        }
      ],
      order: [
        [sequelize.literal('(stock_minimo - stock_actual)'), 'DESC']
      ]
    });

    res.json({
      success: true,
      data: inventarios
    });

  } catch (error) {
    console.error('Error al obtener productos bajo stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos bajo stock',
      error: error.message
    });
  }
};

/**
 * Registrar ingreso de lote (con o sin distribución)
 */
/**
 * Registrar ingreso de lote (con o sin distribución)
 */
exports.registrarLote = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            codigo,
            codigo_lote,
            proveedor_id,
            producto_id,
            fecha_ingreso,
            cantidad,
            cantidad_total,
            precio_compra_unitario,
            precio_compra_unidad,
            numero_factura_proveedor,
            distribucion,
            distribuciones
        } = req.body;

        const usuario_asigna_id = req.session.userId;

        // Normalizar nombres de campos
        const codigoFinal = codigo_lote || codigo;
        const cantidadFinal = cantidad_total || cantidad;
        const precioFinal = precio_compra_unitario || precio_compra_unidad; // Acepta ambos
        const distribucionesFinal = distribuciones || distribucion || [];

        console.log(' Datos recibidos:', { codigoFinal, cantidadFinal, precioFinal, distribucionesFinal });

        // Validación básica
        if (!codigoFinal || !proveedor_id || !producto_id || !fecha_ingreso || !cantidadFinal || !precioFinal) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        // Permitir distribuciones vacías []
        if (!Array.isArray(distribucionesFinal)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El campo distribuciones debe ser un array (puede estar vacío)'
            });
        }

        // Procesar distribuciones si existen
        const distribucionesConInventarioId = [];
        
        for (const dist of distribucionesFinal) {
            let inventarioId = dist.inventario_id;
            
            // Si viene sucursal_id, buscar o crear el inventario
            if (!inventarioId && dist.sucursal_id) {
                let inventario = await Inventario.findOne({
                    where: {
                        sucursal_id: dist.sucursal_id,
                        producto_id: producto_id
                    }
                });
                
                if (!inventario) {
                    inventario = await Inventario.create({
                        sucursal_id: dist.sucursal_id,
                        producto_id: producto_id,
                        stock_actual: 0,
                        stock_minimo: 5,
                        stock_maximo: 1000,
                        estado: 1
                    }, { transaction: t });
                }
                
                inventarioId = inventario.id;
            }
            
            if (!inventarioId) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Cada distribución debe tener inventario_id o sucursal_id'
                });
            }
            
            distribucionesConInventarioId.push({
                inventario_id: inventarioId,
                cantidad: parseInt(dist.cantidad)
            });
        }

        // Validar solo si hay distribuciones
        let totalDistribuido = 0;
        if (distribucionesConInventarioId.length > 0) {
            totalDistribuido = distribucionesConInventarioId.reduce((sum, d) => sum + d.cantidad, 0);
            
            if (totalDistribuido > cantidadFinal) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: `No puedes distribuir más de lo disponible. Total: ${cantidadFinal}, Distribuido: ${totalDistribuido}`
                });
            }
        }

        // Calcular cantidad disponible
        const cantidadDisponible = cantidadFinal - totalDistribuido;

        console.log('💾 Creando lote:', {
            codigo_lote: codigoFinal,
            cantidad_total: cantidadFinal,
            precio_compra_unitario: precioFinal,
            cantidad_disponible: cantidadDisponible
        });

        // Crear lote
        const lote = await Lote.create({
            codigo_lote: codigoFinal,
            proveedor_id,
            producto_id,
            fecha_ingreso,
            cantidad_total: cantidadFinal,
            cantidad_disponible: cantidadDisponible,
            precio_compra_unidad: precioFinal,  // NOMBRE CORRECTO
            costo_total: cantidadFinal * precioFinal,
            numero_factura_proveedor,
            estado: 1
        }, { transaction: t });

        console.log(' Lote creado con ID:', lote.id);

        // Distribuir si hay distribuciones
        if (distribucionesConInventarioId.length > 0) {
            for (const dist of distribucionesConInventarioId) {
                await LoteInventario.create({
                    lote_id: lote.id,
                    inventario_id: dist.inventario_id,
                    cantidad_asignada: dist.cantidad,
                    usuario_asigna_id
                }, { transaction: t });
                
                // Actualizar stock del inventario
                await sequelize.query(`
                    UPDATE inventarios 
                    SET stock_actual = stock_actual + ${dist.cantidad}
                    WHERE id = ${dist.inventario_id}
                `, { transaction: t });
            }
            console.log(` ${distribucionesConInventarioId.length} distribuciones creadas`);
        }

        await t.commit();
        console.log(' Transacción completada');

        // Recargar con relaciones
        await lote.reload({
            include: [
                { model: Proveedor, as: 'proveedor' },
                { model: Producto, as: 'producto' }
            ]
        });

        res.status(201).json({
            success: true,
            message: distribucionesConInventarioId.length > 0 
                ? `Lote registrado y ${totalDistribuido} unidades distribuidas. ${cantidadDisponible} disponibles.`
                : `Lote registrado. ${cantidadFinal} unidades disponibles para distribuir.`,
            data: lote
        });

    } catch (error) {
        await t.rollback();
        console.error('Error al registrar lote:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar lote',
            error: error.message
        });
    }
};

/**
 * Distribuir lote existente (agregar más distribuciones)
 */
exports.distribuirLote = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { lote_id, distribuciones } = req.body;
        const usuario_asigna_id = req.session.userId;

        // Validar
        if (!lote_id || !Array.isArray(distribuciones) || distribuciones.length === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Faltan datos: lote_id y distribuciones requeridos'
            });
        }

        // Buscar el lote
        const lote = await Lote.findByPk(lote_id);
        
        if (!lote) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Lote no encontrado'
            });
        }

        // Calcular total a distribuir
        const totalADistribuir = distribuciones.reduce((sum, d) => sum + parseInt(d.cantidad), 0);

        if (totalADistribuir > lote.cantidad_disponible) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Solo hay ${lote.cantidad_disponible} unidades disponibles. Intentas distribuir ${totalADistribuir}.`
            });
        }

        // Procesar distribuciones
        for (const dist of distribuciones) {
            let inventarioId = dist.inventario_id;

            // Si viene sucursal_id, buscar o crear inventario
            if (!inventarioId && dist.sucursal_id) {
                let inventario = await Inventario.findOne({
                    where: {
                        sucursal_id: dist.sucursal_id,
                        producto_id: lote.producto_id
                    }
                });

                if (!inventario) {
                    inventario = await Inventario.create({
                        sucursal_id: dist.sucursal_id,
                        producto_id: lote.producto_id,
                        stock_actual: 0,
                        stock_minimo: 5,
                        stock_maximo: 1000,
                        estado: 1
                    }, { transaction: t });
                }

                inventarioId = inventario.id;
            }

            // Crear registro de distribución
            await LoteInventario.create({
                lote_id: lote.id,
                inventario_id: inventarioId,
                cantidad_asignada: parseInt(dist.cantidad),
                usuario_asigna_id
            }, { transaction: t });

            // Actualizar stock
            await sequelize.query(`
                UPDATE inventarios 
                SET stock_actual = stock_actual + ${parseInt(dist.cantidad)}
                WHERE id = ${inventarioId}
            `, { transaction: t });
        }

        // Actualizar cantidad disponible del lote
        await lote.update({
            cantidad_disponible: lote.cantidad_disponible - totalADistribuir
        }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: `${totalADistribuir} unidades distribuidas exitosamente. Disponibles: ${lote.cantidad_disponible - totalADistribuir}`,
            data: lote
        });

    } catch (error) {
        await t.rollback();
        console.error('Error distribuyendo lote:', error);
        res.status(500).json({
            success: false,
            message: 'Error al distribuir lote',
            error: error.message
        });
    }
};