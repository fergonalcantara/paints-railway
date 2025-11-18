/**
 * Middleware de Validación de Datos
 * Validaciones comunes para diferentes endpoints
 */

const { validationResult } = require('express-validator');

/**
 * Manejar errores de validación de express-validator
 */
exports.validarResultado = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }

  next();
};

/**
 * Validar que los campos requeridos existan
 */
exports.camposRequeridos = (...campos) => {
  return (req, res, next) => {
    const camposFaltantes = [];

    for (const campo of campos) {
      if (!req.body[campo] || req.body[campo] === '') {
        camposFaltantes.push(campo);
      }
    }

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validar formato de email
 */
exports.validarEmail = (req, res, next) => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
  }

  next();
};

/**
 * Validar NIT guatemalteco
 */
exports.validarNIT = (req, res, next) => {
  const { nit } = req.body;

  if (nit && nit !== 'CF') {
    // NIT debe ser formato: 12345678-9 o solo números
    const nitRegex = /^\d{7,8}-?\d$/;
    if (!nitRegex.test(nit.replace(/-/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Formato de NIT inválido'
      });
    }
  }

  next();
};

/**
 * Validar que sea un número positivo
 */
exports.validarNumeroPositivo = (...campos) => {
  return (req, res, next) => {
    for (const campo of campos) {
      const valor = req.body[campo];
      
      if (valor !== undefined) {
        const numero = parseFloat(valor);
        
        if (isNaN(numero) || numero < 0) {
          return res.status(400).json({
            success: false,
            message: `${campo} debe ser un número positivo`
          });
        }
      }
    }

    next();
  };
};

/**
 * Validar longitud de password
 */
exports.validarPassword = (req, res, next) => {
  const { password } = req.body;

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
  }

  next();
};

/**
 * Sanitizar entrada para prevenir XSS
 */
exports.sanitizarEntrada = (req, res, next) => {
  // Remover scripts y tags HTML peligrosos
  const sanitizar = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizar(obj[key]);
      }
    }
  };

  sanitizar(req.body);
  sanitizar(req.query);
  sanitizar(req.params);

  next();
};