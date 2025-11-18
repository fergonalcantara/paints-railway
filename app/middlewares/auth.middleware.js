/**
 * Middleware de Autenticación
 * Verifica que el usuario esté logueado (tenga sesión activa)
 */

const { Usuario, Rol } = require('../models');

/**
 * Verificar si el usuario está autenticado
 */
exports.verificarAutenticacion = async (req, res, next) => {
  try {
    // Verificar si existe sesión con userId
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado. Debe iniciar sesión',
        redirect: '/login'
      });
    }

    // Buscar usuario en BD para verificar que siga existiendo y activo
    const usuario = await Usuario.findByPk(req.session.userId, {
      include: [
        {
          model: Rol,
          as: 'rol',
          attributes: ['id', 'nombre']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!usuario) {
      // Usuario no existe, destruir sesión
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado. Sesión inválida',
        redirect: '/login'
      });
    }

    // Verificar estado del usuario
    if (usuario.estado === 0) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    if (usuario.estado === 2) {
      return res.status(403).json({
        success: false,
        message: 'Usuario suspendido. Contacte al administrador'
      });
    }

    // Adjuntar usuario a la request para usarlo en controladores
    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol_id: usuario.rol_id,
      rol_nombre: usuario.rol.nombre,
      es_empleado: usuario.es_empleado === 1,
      sucursal_id: usuario.sucursal_id
    };

    next();

  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación',
      error: error.message
    });
  }
};

/**
 * Verificar autenticación OPCIONAL
 * No bloquea si no hay sesión, pero adjunta el usuario si existe
 */
exports.verificarAutenticacionOpcional = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const usuario = await Usuario.findByPk(req.session.userId, {
        include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }],
        attributes: { exclude: ['password'] }
      });

      if (usuario && usuario.estado === 1) {
        req.user = {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol_id: usuario.rol_id,
          rol_nombre: usuario.rol.nombre,
          es_empleado: usuario.es_empleado === 1,
          sucursal_id: usuario.sucursal_id
        };
      }
    }

    next();

  } catch (error) {
    console.error('Error en autenticación opcional:', error);
    next();
  }
};