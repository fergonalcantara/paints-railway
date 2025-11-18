/**
 * Middleware de Guest (Invitado)
 * Solo permite acceso a usuarios NO autenticados
 * Redirige a dashboard si ya está logueado
 */

/**
 * Verificar que NO esté autenticado
 * Usado para login/register (si ya estás logueado, te redirige)
 */
exports.soloInvitados = (req, res, next) => {
  // Si tiene sesión activa
  if (req.session && req.session.userId) {
    return res.status(403).json({
      success: false,
      message: 'Ya tiene una sesión activa',
      redirect: req.session.esEmpleado ? '/admin/dashboard' : '/'
    });
  }

  next();
};

/**
 * Verificar que NO esté autenticado (para vistas HTML)
 */
exports.soloInvitadosHTML = (req, res, next) => {
  if (req.session && req.session.userId) {
    const redirect = req.session.esEmpleado ? '/admin/dashboard' : '/';
    return res.redirect(redirect);
  }

  next();
};