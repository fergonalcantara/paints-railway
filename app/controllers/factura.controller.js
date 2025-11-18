const { 
  Factura, 
  FacturaDetalle, 
  FacturaPago, 
  FacturaAnulacion,
  Usuario, 
  Cliente,
  Producto, 
  Sucursal,
  MetodoPago,
  Inventario,
  Lote,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

/**
 * Generar número de factura automático
 */
const generarNumeroFactura = async (serie, sucursal_id) => {
  const ultimaFactura = await Factura.findOne({
    where: { serie, sucursal_id },
    order: [['correlativo', 'DESC']]
  });

  const nuevoCorrelativo = ultimaFactura ? ultimaFactura.correlativo + 1 : 1;
  const correlativoFormateado = String(nuevoCorrelativo).padStart(8, '0');
  
  return {
    numero_factura: `${serie}-${correlativoFormateado}`,
    serie,
    correlativo: nuevoCorrelativo
  };
};

/**
 * Crear factura (VENTA)
 */
exports.crearFactura = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      // Cliente
      cliente_tipo,
      cliente_id,
      cliente_fisico_id,
      cliente_fisico,
      
      // Venta
      sucursal_id,
      tipo_venta,
      productos,
      metodos_pago,
      observaciones,
      cotizacion_id
    } = req.body;

    const usuario_emite_id = req.user.id;

    // Validaciones
    if (!productos || productos.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
    }

    if (!metodos_pago || metodos_pago.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un método de pago'
      });
    }

    // Determinar cliente
    let clienteIdFinal = null;
    let clienteFisicoIdFinal = null;
    let clienteTipoFinal = cliente_tipo || 'usuario';
    let datosClienteHistorico = {};

    if (clienteTipoFinal === 'usuario') {
      if (!cliente_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar cliente_id para venta online'
        });
      }

      const usuario = await Usuario.findByPk(cliente_id);
      if (!usuario) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      clienteIdFinal = cliente_id;
      datosClienteHistorico = {
        cliente_nombre: `${usuario.nombre} ${usuario.apellido}`,
        cliente_nit: usuario.nit,
        cliente_direccion: usuario.direccion
      };
    }
    
    else if (clienteTipoFinal === 'cliente_fisico') {
      if (cliente_fisico_id) {
        const clienteExistente = await Cliente.findByPk(cliente_fisico_id);
        if (!clienteExistente) {
          await t.rollback();
          return res.status(404).json({
            success: false,
            message: 'Cliente físico no encontrado'
          });
        }

        clienteFisicoIdFinal = cliente_fisico_id;
        datosClienteHistorico = {
          cliente_nombre: `${clienteExistente.nombre} ${clienteExistente.apellido || ''}`.trim(),
          cliente_nit: clienteExistente.nit,
          cliente_direccion: clienteExistente.direccion
        };
      }
      
      else if (cliente_fisico && cliente_fisico.nombre) {
        let clienteNuevo;
        
        if (cliente_fisico.nit && cliente_fisico.nit !== 'CF') {
          clienteNuevo = await Cliente.findOne({
            where: { nit: cliente_fisico.nit }
          });
        }

        if (!clienteNuevo) {
          clienteNuevo = await Cliente.create({
            nombre: cliente_fisico.nombre,
            apellido: cliente_fisico.apellido || null,
            nit: cliente_fisico.nit || 'CF',
            telefono: cliente_fisico.telefono || null,
            direccion: cliente_fisico.direccion || null,
            email: cliente_fisico.email || null,
            municipio_id: cliente_fisico.municipio_id || null,
            tipo_cliente: (cliente_fisico.nit && cliente_fisico.nit !== 'CF') ? 'empresa' : 'consumidor_final'
          }, { transaction: t });
        }

        clienteFisicoIdFinal = clienteNuevo.id;
        datosClienteHistorico = {
          cliente_nombre: `${clienteNuevo.nombre} ${clienteNuevo.apellido || ''}`.trim(),
          cliente_nit: clienteNuevo.nit,
          cliente_direccion: clienteNuevo.direccion
        };
      }
      
      else {
        clienteFisicoIdFinal = 1;
        datosClienteHistorico = {
          cliente_nombre: 'Consumidor Final',
          cliente_nit: 'CF',
          cliente_direccion: null
        };
      }
    }
    
    else {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tipo de cliente inválido'
      });
    }

    // Validar y calcular productos
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

      const inventario = await Inventario.findOne({
        where: {
          sucursal_id,
          producto_id: prod.producto_id
        }
      });

      if (!inventario || inventario.stock_actual < prod.cantidad) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${producto.nombre}`
        });
      }

      const precio = prod.precio_unitario || producto.precio_venta;
      const descuento_monto = (precio * prod.cantidad * (prod.descuento_porcentaje || 0)) / 100;
      const subtotal_prod = (precio * prod.cantidad) - descuento_monto;

      subtotal += subtotal_prod;
      descuento_total += descuento_monto;

      detallesConInfo.push({
        producto_id: prod.producto_id,
        lote_id: prod.lote_id || null,
        cantidad: prod.cantidad,
        precio_unitario: precio,
        descuento_porcentaje: prod.descuento_porcentaje || 0,
        subtotal: subtotal_prod,
        producto_nombre: producto.nombre,
        producto_sku: producto.sku
      });
    }

    const total = subtotal;

    // Validar pagos
    const totalPagos = metodos_pago.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    if (Math.abs(totalPagos - total) > 0.01) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Los pagos (Q${totalPagos.toFixed(2)}) no coinciden con el total (Q${total.toFixed(2)})`
      });
    }

    // Generar número de factura
    const { numero_factura, serie, correlativo } = await generarNumeroFactura('A', sucursal_id);

    // Crear factura
    const factura = await Factura.create({
      numero_factura,
      serie,
      correlativo,
      cliente_id: clienteIdFinal,
      cliente_tipo: clienteTipoFinal,
      cliente_fisico_id: clienteFisicoIdFinal,
      sucursal_id,
      usuario_emite_id,
      cotizacion_id: cotizacion_id || null,
      tipo_venta,
      subtotal,
      descuento_total,
      total,
      ...datosClienteHistorico,
      observaciones,
      estado: 1
    }, { transaction: t });

    // Crear detalles
    for (const detalle of detallesConInfo) {
      await FacturaDetalle.create({
        factura_id: factura.id,
        ...detalle
      }, { transaction: t });
    }

    // CREAR PAGOS CON BÚSQUEDA DE ID
    for (const pago of metodos_pago) {
      let metodoPagoId = pago.metodo_pago_id;
      
      // Si viene nombre en lugar de ID, buscar el ID
      if (!metodoPagoId && pago.metodo_pago) {
        const metodoPago = await MetodoPago.findOne({
          where: {
            nombre: {
              [Op.like]: `%${pago.metodo_pago}%`
            },
            estado: 1
          }
        });
        
        if (!metodoPago) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `Método de pago no válido: ${pago.metodo_pago}`
          });
        }
        
        metodoPagoId = metodoPago.id;
      }
      
      // Validar que tengamos un ID
      if (!metodoPagoId) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar metodo_pago_id o metodo_pago para cada método de pago'
        });
      }
      
      await FacturaPago.create({
        factura_id: factura.id,
        metodo_pago_id: metodoPagoId,
        monto: pago.monto,
        numero_referencia: pago.numero_referencia || null,
        banco: pago.banco || null,
        estado: 1
      }, { transaction: t });
    }

    await t.commit();

    // Recargar con relaciones
    await factura.reload({
      include: [
        { model: Usuario, as: 'cliente' },
        { model: Cliente, as: 'cliente_fisico' },
        { model: Sucursal, as: 'sucursal' },
        { model: Usuario, as: 'usuario_emite' },
        {
          model: FacturaDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        },
        {
          model: FacturaPago,
          as: 'pagos',
          include: [{ model: MetodoPago, as: 'metodo_pago' }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Factura creada exitosamente',
      data: factura
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al crear factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear factura',
      error: error.message
    });
  }
};

/**
 * Anular factura (con trigger automático)
 */
exports.anularFactura = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { numero_factura } = req.params;
        const { motivo_anulacion } = req.body;
        const usuario_anula_id = req.user.id;
        
        console.log('Intentando anular factura:', { numero_factura, motivo_anulacion });
        
        // Validar motivo
        if (!motivo_anulacion || motivo_anulacion.trim() === '') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un motivo de anulación'
            });
        }
        
        // Buscar factura
        const factura = await Factura.findOne({
            where: { numero_factura }
        });
        
        if (!factura) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }
        
        // Validar que no esté ya anulada
        if (factura.estado === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'La factura ya está anulada'
            });
        }
        
        // Crear registro de anulación con TODOS los campos
        await FacturaAnulacion.create({
            factura_id: factura.id,
            numero_factura: factura.numero_factura,  //  Agregado
            subtotal_original: factura.subtotal,      // Agregado
            descuento_original: factura.descuento_total || 0,  //  Agregado
            total_original: factura.total,            //  Agregado
            motivo: motivo_anulacion,                 //  Cambiado de "motivo_anulacion" a "motivo"
            usuario_anula_id,
            requiere_devolucion_inventario: 1,
            fecha_anulacion: new Date()
        }, { transaction: t });
        
        await t.commit();
        
        console.log(' Factura anulada correctamente');
        
        // Recargar factura con estado actualizado por el trigger
        await factura.reload({
            include: [
                { model: Usuario, as: 'cliente' },
                { model: Cliente, as: 'cliente_fisico' },
                { model: Sucursal, as: 'sucursal' },
                { model: Usuario, as: 'usuario_emite' },
                {
                    model: FacturaDetalle,
                    as: 'detalles',
                    include: [{ model: Producto, as: 'producto' }]
                },
                {
                    model: FacturaPago,
                    as: 'pagos',
                    include: [{ model: MetodoPago, as: 'metodo_pago' }]
                },
                {
                    model: FacturaAnulacion,
                    as: 'anulacion',
                    include: [{ model: Usuario, as: 'usuario_anula' }]
                }
            ]
        });
        
        res.json({
            success: true,
            message: 'Factura anulada correctamente. Stock devuelto al inventario.',
            data: factura
        });
        
    } catch (error) {
        await t.rollback();
        console.error('Error al anular factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al anular factura',
            error: error.message
        });
    }
};

/**
 * Obtener factura por número
 */
exports.obtenerFacturaPorNumero = async (req, res) => {
  try {
    const { numero_factura } = req.params;

    const factura = await Factura.findOne({
      where: { numero_factura },
      include: [
        { model: Usuario, as: 'cliente' },
        { model: Cliente, as: 'cliente_fisico' },
        { model: Sucursal, as: 'sucursal' },
        { model: Usuario, as: 'usuario_emite' },
        {
          model: FacturaDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        },
        {
          model: FacturaPago,
          as: 'pagos',
          include: [{ model: MetodoPago, as: 'metodo_pago' }]
        },
        {
          model: FacturaAnulacion,
          as: 'anulacion',
          include: [{ model: Usuario, as: 'usuario_anula' }]
        }
      ]
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    res.json({
      success: true,
      data: factura
    });

  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener factura',
      error: error.message
    });
  }
};

/**
 * Listar facturas con filtros
 */
exports.listarFacturas = async (req, res) => {
    try {
        const {
            numero_factura,
            cliente,
            fecha_desde,
            fecha_hasta,
            tipo_venta,
            estado,
            sucursal_id
        } = req.query;
        
        // Construir condiciones WHERE
        const where = {};
        
        if (numero_factura) {
            where.numero_factura = { [Op.like]: `%${numero_factura}%` };
        }
        
        if (cliente) {
            where[Op.or] = [
                { cliente_nombre: { [Op.like]: `%${cliente}%` } },
                { cliente_nit: { [Op.like]: `%${cliente}%` } }
            ];
        }
        
        if (fecha_desde && fecha_hasta) {
            where.created_at = {
                [Op.between]: [
                    new Date(fecha_desde),
                    new Date(fecha_hasta + ' 23:59:59')
                ]
            };
        } else if (fecha_desde) {
            where.created_at = { [Op.gte]: new Date(fecha_desde) };
        } else if (fecha_hasta) {
            where.created_at = { [Op.lte]: new Date(fecha_hasta + ' 23:59:59') };
        }
        
        if (tipo_venta) {
            where.tipo_venta = tipo_venta;
        }
        
        if (estado !== undefined && estado !== '') {
            where.estado = parseInt(estado);
        }
        
        if (sucursal_id) {
            where.sucursal_id = sucursal_id;
        }
        
        // Buscar facturas
        const facturas = await Factura.findAll({
            where,
            include: [
                { model: Usuario, as: 'cliente', attributes: ['nombre', 'apellido', 'email'] },
                { model: Cliente, as: 'cliente_fisico', attributes: ['nombre', 'apellido', 'nit'] },
                { model: Sucursal, as: 'sucursal', attributes: ['nombre'] },
                { model: Usuario, as: 'usuario_emite', attributes: ['nombre', 'apellido'] },
                {
                    model: FacturaDetalle,
                    as: 'detalles',
                    include: [{ model: Producto, as: 'producto', attributes: ['nombre', 'sku'] }]
                },
                {
                    model: FacturaPago,
                    as: 'pagos',
                    include: [{ model: MetodoPago, as: 'metodo_pago' }]
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        res.json({
            success: true,
            data: facturas
        });
        
    } catch (error) {
        console.error('Error al listar facturas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar facturas',
            error: error.message
        });
    }
};

// EXPORTACIÓN CORRECTA
module.exports = {
  crearFactura: exports.crearFactura,
  anularFactura: exports.anularFactura,
  obtenerFacturaPorNumero: exports.obtenerFacturaPorNumero,
  listarFacturas: exports.listarFacturas
};