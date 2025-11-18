const { Rol, Permiso, RolPermiso, Usuario } = require('../models');
const { Op } = require('sequelize');

/**
 * Listar roles
 */
exports.listarRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      where: { estado: 1 },
      include: [
        {
          model: Permiso,
          as: 'permisos',
          through: { attributes: [] },
          attributes: ['id', 'nombre', 'modulo', 'descripcion']
        }
      ],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Error al listar roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar roles',
      error: error.message
    });
  }
};

/**
 * Obtener rol por ID con permisos
 */
exports.obtenerRolPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findByPk(id, {
      include: [
        {
          model: Permiso,
          as: 'permisos',
          through: { attributes: [] }
        }
      ]
    });

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: rol
    });

  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rol',
      error: error.message
    });
  }
};

/**
 * Crear rol
 */
exports.crearRol = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Verificar nombre único
    const nombreExistente = await Rol.findOne({ where: { nombre } });
    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      });
    }

    const rol = await Rol.create({
      nombre,
      descripcion,
      estado: 1
    });

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: rol
    });

  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear rol',
      error: error.message
    });
  }
};

/**
 * Actualizar rol
 */
exports.actualizarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Verificar nombre único
    if (nombre && nombre !== rol.nombre) {
      const nombreExistente = await Rol.findOne({
        where: { nombre, id: { [Op.ne]: id } }
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un rol con ese nombre'
        });
      }
    }

    await rol.update({ nombre, descripcion });

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: rol
    });

  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: error.message
    });
  }
};

/**
 * Eliminar rol (solo si no tiene usuarios)
 */
exports.eliminarRol = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Verificar que no tenga usuarios asignados
    const usuariosConRol = await Usuario.count({ where: { rol_id: id } });

    if (usuariosConRol > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar. Hay ${usuariosConRol} usuarios con este rol`
      });
    }

    // Eliminar permisos asociados
    await RolPermiso.destroy({ where: { rol_id: id } });

    // Soft delete
    await rol.update({ estado: 0 });
    await rol.destroy();

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar rol',
      error: error.message
    });
  }
};

/**
 * Listar todos los permisos disponibles
 */
exports.listarPermisos = async (req, res) => {
  try {
    const permisos = await Permiso.findAll({
      where: { estado: 1 },
      order: [['modulo', 'ASC'], ['nombre', 'ASC']]
    });

    // Agrupar por módulo
    const permisosPorModulo = permisos.reduce((acc, permiso) => {
      const modulo = permiso.modulo || 'general';
      if (!acc[modulo]) {
        acc[modulo] = [];
      }
      acc[modulo].push(permiso);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        permisos,
        permisos_por_modulo: permisosPorModulo
      }
    });

  } catch (error) {
    console.error('Error al listar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar permisos',
      error: error.message
    });
  }
};

/**
 * Asignar permisos a un rol
 */
exports.asignarPermisos = async (req, res) => {
  try {
    const { id } = req.params;
    const { permisos } = req.body; // Array de IDs de permisos

    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Eliminar permisos actuales
    await RolPermiso.destroy({ where: { rol_id: id } });

    // Asignar nuevos permisos
    if (permisos && permisos.length > 0) {
      const permisosValidos = await Permiso.findAll({
        where: { id: permisos, estado: 1 }
      });

      if (permisosValidos.length !== permisos.length) {
        return res.status(400).json({
          success: false,
          message: 'Algunos permisos no son válidos'
        });
      }

      const permisosAsignar = permisos.map(permiso_id => ({
        rol_id: id,
        permiso_id
      }));

      await RolPermiso.bulkCreate(permisosAsignar);
    }

    // Recargar rol con permisos
    await rol.reload({
      include: [
        {
          model: Permiso,
          as: 'permisos',
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Permisos asignados exitosamente',
      data: rol
    });

  } catch (error) {
    console.error('Error al asignar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar permisos',
      error: error.message
    });
  }
};

/**
 * Obtener permisos de un rol
 */
exports.obtenerPermisosRol = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findByPk(id, {
      include: [
        {
          model: Permiso,
          as: 'permisos',
          through: { attributes: [] },
          where: { estado: 1 },
          required: false
        }
      ]
    });

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        rol: {
          id: rol.id,
          nombre: rol.nombre,
          descripcion: rol.descripcion
        },
        permisos: rol.permisos
      }
    });

  } catch (error) {
    console.error('Error al obtener permisos del rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del rol',
      error: error.message
    });
  }
};

/**
 * Clonar permisos de un rol a otro
 */
exports.clonarPermisos = async (req, res) => {
  try {
    const { id } = req.params; // Rol destino
    const { rol_origen_id } = req.body;

    const rolDestino = await Rol.findByPk(id);
    const rolOrigen = await Rol.findByPk(rol_origen_id, {
      include: [{ model: Permiso, as: 'permisos' }]
    });

    if (!rolDestino || !rolOrigen) {
      return res.status(404).json({
        success: false,
        message: 'Uno de los roles no fue encontrado'
      });
    }

    // Eliminar permisos actuales del destino
    await RolPermiso.destroy({ where: { rol_id: id } });

    // Copiar permisos del origen
    if (rolOrigen.permisos.length > 0) {
      const permisosAClonar = rolOrigen.permisos.map(permiso => ({
        rol_id: id,
        permiso_id: permiso.id
      }));

      await RolPermiso.bulkCreate(permisosAClonar);
    }

    // Recargar con permisos
    await rolDestino.reload({
      include: [{ model: Permiso, as: 'permisos' }]
    });

    res.json({
      success: true,
      message: `Permisos clonados de "${rolOrigen.nombre}" a "${rolDestino.nombre}"`,
      data: rolDestino
    });

  } catch (error) {
    console.error('Error al clonar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al clonar permisos',
      error: error.message
    });
  }
};