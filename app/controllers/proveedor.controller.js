const { Proveedor } = require('../models');
const { Op } = require('sequelize');

/**
 * Listar proveedores con filtros
 */
exports.listarProveedores = async (req, res) => {
  try {
    const { page = 1, limit = 10, buscar, estado } = req.query;

    const offset = (page - 1) * limit;

    const where = {};

    if (estado !== undefined) {
      where.estado = parseInt(estado);
    } else {
      where.estado = 1; // Por defecto solo activos
    }

    if (buscar) {
      where[Op.or] = [
        { nombre_comercial: { [Op.like]: `%${buscar}%` } },
        { nit: { [Op.like]: `%${buscar}%` } },
        { contacto_nombre: { [Op.like]: `%${buscar}%` } }
      ];
    }

    const { count, rows } = await Proveedor.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nombre_comercial', 'ASC']]
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
    console.error('Error al listar proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar proveedores',
      error: error.message
    });
  }
};

/**
 * Obtener proveedor por ID
 */
exports.obtenerProveedorPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: proveedor
    });

  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

/**
 * Crear proveedor
 */
exports.crearProveedor = async (req, res) => {
  try {
    const {
      nombre_comercial,
      nit,
      telefono,
      email,
      direccion,
      contacto_nombre,
      contacto_telefono
    } = req.body;

    // Verificar NIT único
    const nitExistente = await Proveedor.findOne({ where: { nit } });
    if (nitExistente) {
      return res.status(400).json({
        success: false,
        message: 'El NIT ya está registrado'
      });
    }

    const proveedor = await Proveedor.create({
      nombre_comercial,
      nit,
      telefono,
      email,
      direccion,
      contacto_nombre,
      contacto_telefono,
      estado: 1
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: proveedor
    });

  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

/**
 * Actualizar proveedor
 */
exports.actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_comercial,
      nit,
      telefono,
      email,
      direccion,
      contacto_nombre,
      contacto_telefono
    } = req.body;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar NIT único si se está actualizando
    if (nit && nit !== proveedor.nit) {
      const nitExistente = await Proveedor.findOne({
        where: { nit, id: { [Op.ne]: id } }
      });

      if (nitExistente) {
        return res.status(400).json({
          success: false,
          message: 'El NIT ya está registrado en otro proveedor'
        });
      }
    }

    await proveedor.update({
      nombre_comercial,
      nit,
      telefono,
      email,
      direccion,
      contacto_nombre,
      contacto_telefono
    });

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: proveedor
    });

  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

/**
 * Eliminar proveedor (soft delete)
 */
exports.eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Soft delete
    await proveedor.update({ estado: 0 });
    await proveedor.destroy();

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};

/**
 * Cambiar estado del proveedor
 */
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    await proveedor.update({ estado });

    res.json({
      success: true,
      message: 'Estado actualizado',
      data: { id: proveedor.id, estado: proveedor.estado }
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

/**
 * Obtener productos de un proveedor (con lotes)
 */
exports.obtenerProductosProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id, {
      include: [
        {
          model: require('../models').Lote,
          as: 'lotes',
          include: [
            {
              model: require('../models').Producto,
              as: 'producto',
              attributes: ['id', 'sku', 'nombre']
            }
          ],
          order: [['fecha_ingreso', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: proveedor
    });

  } catch (error) {
    console.error('Error al obtener productos del proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos del proveedor',
      error: error.message
    });
  }
};