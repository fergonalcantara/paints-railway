const { Cliente, Municipio, Factura } = require('../models');
const { Op } = require('sequelize');

/**
 * Listar clientes físicos con paginación
 */
exports.listarClientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, buscar, tipo_cliente } = req.query;

    const offset = (page - 1) * limit;

    const where = {};

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { nit: { [Op.like]: `%${buscar}%` } },
        { telefono: { [Op.like]: `%${buscar}%` } }
      ];
    }

    if (tipo_cliente) {
      where.tipo_cliente = tipo_cliente;
    }

    const { count, rows } = await Cliente.findAndCountAll({
      where,
      include: [
        {
          model: Municipio,
          as: 'municipio',
          attributes: ['id', 'nombre']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nombre', 'ASC']]
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
    console.error('Error al listar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar clientes',
      error: error.message
    });
  }
};

/**
 * Obtener cliente por ID
 */
exports.obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id, {
      include: [
        {
          model: Municipio,
          as: 'municipio'
        },
        {
          model: Factura,
          as: 'facturas',
          limit: 10,
          order: [['fecha_emision', 'DESC']]
        }
      ]
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente',
      error: error.message
    });
  }
};

/**
 * Crear cliente físico
 */
exports.crearCliente = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      nit,
      telefono,
      direccion,
      email,
      municipio_id,
      tipo_cliente
    } = req.body;

    // Verificar si ya existe un cliente con ese NIT (excepto C/F)
    if (nit && nit !== 'CF') {
      const nitExistente = await Cliente.findOne({
        where: { nit }
      });

      if (nitExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con ese NIT',
          data: nitExistente
        });
      }
    }

    const cliente = await Cliente.create({
      nombre,
      apellido,
      nit: nit || 'CF',
      telefono,
      direccion,
      email,
      municipio_id,
      tipo_cliente: tipo_cliente || 'consumidor_final'
    });

    // Recargar con relaciones
    await cliente.reload({
      include: [{ model: Municipio, as: 'municipio' }]
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: cliente
    });

  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente',
      error: error.message
    });
  }
};

/**
 * Actualizar cliente
 */
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizar = req.body;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar NIT único si se está actualizando
    if (datosActualizar.nit && datosActualizar.nit !== 'CF' && datosActualizar.nit !== cliente.nit) {
      const nitExistente = await Cliente.findOne({
        where: {
          nit: datosActualizar.nit,
          id: { [Op.ne]: id }
        }
      });

      if (nitExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con ese NIT'
        });
      }
    }

    await cliente.update(datosActualizar);

    await cliente.reload({
      include: [{ model: Municipio, as: 'municipio' }]
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: cliente
    });

  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

/**
 * Eliminar cliente (soft delete)
 */
exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar si tiene facturas
    const facturas = await Factura.count({
      where: { cliente_fisico_id: id }
    });

    if (facturas > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar. El cliente tiene ${facturas} facturas asociadas`
      });
    }

    // Soft delete
    await cliente.destroy();

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente',
      error: error.message
    });
  }
};

/**
 * Buscar cliente por NIT
 */
exports.buscarPorNIT = async (req, res) => {
  try {
    const { nit } = req.params;

    const cliente = await Cliente.findOne({
      where: { nit },
      include: [
        {
          model: Municipio,
          as: 'municipio'
        }
      ]
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado con ese NIT'
      });
    }

    res.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error('Error al buscar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar cliente',
      error: error.message
    });
  }
};

/**
 * Obtener historial de compras del cliente
 */
exports.historialCompras = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const { count, rows } = await Factura.findAndCountAll({
      where: {
        cliente_fisico_id: id,
        estado: 1
      },
      attributes: ['id', 'numero_factura', 'fecha_emision', 'total', 'tipo_venta'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_emision', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        cliente: {
          id: cliente.id,
          nombre: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
          nit: cliente.nit
        },
        facturas: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de compras',
      error: error.message
    });
  }
};

// EXPORTACIÓN CORRECTA
module.exports = {
  listarClientes: exports.listarClientes,
  obtenerClientePorId: exports.obtenerClientePorId,
  crearCliente: exports.crearCliente,
  actualizarCliente: exports.actualizarCliente,
  eliminarCliente: exports.eliminarCliente,
  buscarPorNIT: exports.buscarPorNIT,
  historialCompras: exports.historialCompras
};