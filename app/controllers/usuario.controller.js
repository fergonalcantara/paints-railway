const { Usuario, Rol, Sucursal, Municipio } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todos los usuarios (con filtros)
 */
exports.obtenerUsuarios = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      rol_id,
      es_empleado,
      estado,
      buscar
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {};

    if (rol_id) {
      where.rol_id = rol_id;
    }

    if (es_empleado !== undefined) {
      where.es_empleado = parseInt(es_empleado);
    }

    if (estado !== undefined) {
      where.estado = parseInt(estado);
    }

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } },
        { dpi: { [Op.like]: `%${buscar}%` } }
      ];
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { model: Rol, as: 'rol', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Municipio, as: 'municipio', attributes: ['id', 'nombre'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
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
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * Obtener usuario por ID
 */
exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Rol, as: 'rol' },
        { model: Sucursal, as: 'sucursal' },
        { model: Municipio, as: 'municipio' }
      ]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: usuario
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * Crear usuario (empleados - solo admin)
 */
exports.crearUsuario = async (req, res) => {
  try {
    const {
      rol_id,
      nombre,
      apellido,
      email,
      password,
      dpi,
      nit,
      telefono,
      direccion,
      municipio_id,
      sucursal_id,
      es_empleado
    } = req.body;

    // Verificar si el email ya existe
    const emailExistente = await Usuario.findOne({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Si es empleado, verificar DPI único
    if (es_empleado && dpi) {
      const dpiExistente = await Usuario.findOne({ where: { dpi } });
      if (dpiExistente) {
        return res.status(400).json({
          success: false,
          message: 'El DPI ya está registrado'
        });
      }
    }

    const nuevoUsuario = await Usuario.create({
      rol_id,
      nombre,
      apellido,
      email,
      password,
      dpi: dpi || null,
      nit,
      telefono,
      direccion,
      municipio_id,
      sucursal_id: sucursal_id || null,
      es_empleado: es_empleado || 0,
      estado: 1
    });

    const usuarioRespuesta = nuevoUsuario.toJSON();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuarioRespuesta
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

/**
 * Actualizar usuario
 */
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizar = req.body;

    // No permitir actualizar password desde aquí
    delete datosActualizar.password;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar email único si se está actualizando
    if (datosActualizar.email && datosActualizar.email !== usuario.email) {
      const emailExistente = await Usuario.findOne({
        where: { email: datosActualizar.email, id: { [Op.ne]: id } }
      });

      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    await usuario.update(datosActualizar);

    const usuarioRespuesta = usuario.toJSON();

    res.json({
      success: true,
      message: 'Usuario actualizado',
      data: usuarioRespuesta
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * Cambiar estado de usuario
 */
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 0=Inactivo, 1=Activo, 2=Suspendido

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await usuario.update({ estado });

    res.json({
      success: true,
      message: 'Estado actualizado',
      data: { id: usuario.id, estado: usuario.estado }
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