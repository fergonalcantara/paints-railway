/**
 * Middleware de Verificación de Roles
 * Verifica que el usuario tenga un rol específico
 */

/**
 * Verificar si el usuario es empleado (cualquier rol administrativo)
 */
exports.esEmpleado = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (!req.user.es_empleado) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo empleados pueden acceder'
    });
  }

  next();
};

/**
 * Verificar si el usuario es cliente
 */
exports.esCliente = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.es_empleado) {
    return res.status(403).json({
      success: false,
      message: 'Esta área es solo para clientes'
    });
  }

  next();
};

/**
 * Verificar rol específico (admin, gerente, cajero, digitador, cliente)
 */
exports.tieneRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.user.rol_nombre)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Verificar que sea administrador
 */
exports.esAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.rol_nombre !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores'
    });
  }

  next();
};

/**
 * Verificar que sea admin o gerente
 */
exports.esAdminOGerente = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (!['admin', 'gerente'].includes(req.user.rol_nombre)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores o gerentes'
    });
  }

  next();
};

/**
 * Verificar que pertenezca a la misma sucursal (o sea admin)
 */
exports.mismaSucursalOAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Admins pueden acceder a cualquier sucursal
  if (req.user.rol_nombre === 'admin') {
    return next();
  }

  // Verificar sucursal en params o body
  const sucursal_id = req.params.sucursal_id || req.body.sucursal_id || req.query.sucursal_id;

  if (sucursal_id && parseInt(sucursal_id) !== req.user.sucursal_id) {
    return res.status(403).json({
      success: false,
      message: 'No tiene acceso a esta sucursal'
    });
  }

  next();
};