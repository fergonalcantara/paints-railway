/**
 * Middleware de Verificación de Permisos Específicos
 * Verifica que el usuario tenga permisos específicos asignados a su rol
 */

const { Rol, Permiso } = require('../models');

/**
 * Cache de permisos por rol (para optimizar consultas)
 */
const permisosPorRolCache = new Map();

/**
 * Obtener permisos de un rol (con cache)
 */
async function obtenerPermisosRol(rol_id) {
  // Verificar cache
  if (permisosPorRolCache.has(rol_id)) {
    return permisosPorRolCache.get(rol_id);
  }

  // Consultar BD
  const rol = await Rol.findByPk(rol_id, {
    include: [
      {
        model: Permiso,
        as: 'permisos',
        attributes: ['nombre'],
        through: { attributes: [] }
      }
    ]
  });

  if (!rol) {
    return [];
  }

  const permisos = rol.permisos.map(p => p.nombre);

  // Guardar en cache por 5 minutos
  permisosPorRolCache.set(rol_id, permisos);
  setTimeout(() => permisosPorRolCache.delete(rol_id), 5 * 60 * 1000);

  return permisos;
}

/**
 * Verificar que el usuario tenga un permiso específico
 */
exports.tienePermiso = (...permisosRequeridos) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      // Admin siempre tiene todos los permisos
      if (req.user.rol_nombre === 'admin') {
        return next();
      }

      // Obtener permisos del rol del usuario
      const permisosUsuario = await obtenerPermisosRol(req.user.rol_id);

      // Verificar si tiene al menos uno de los permisos requeridos
      const tienePermiso = permisosRequeridos.some(permiso => 
        permisosUsuario.includes(permiso)
      );

      if (!tienePermiso) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere uno de estos permisos: ${permisosRequeridos.join(', ')}`
        });
      }

      next();

    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Verificar que tenga TODOS los permisos especificados
 */
exports.tieneTodosLosPermisos = (...permisosRequeridos) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      if (req.user.rol_nombre === 'admin') {
        return next();
      }

      const permisosUsuario = await obtenerPermisosRol(req.user.rol_id);

      const tieneTodos = permisosRequeridos.every(permiso => 
        permisosUsuario.includes(permiso)
      );

      if (!tieneTodos) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requieren todos estos permisos: ${permisosRequeridos.join(', ')}`
        });
      }

      next();

    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Limpiar cache de permisos (útil después de actualizar roles)
 */
exports.limpiarCachePermisos = () => {
  permisosPorRolCache.clear();
};