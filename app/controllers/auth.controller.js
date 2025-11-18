const { Usuario, Rol } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Login de usuarios
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario por email (incluir rol)
        const usuario = await Usuario.findOne({
            where: { email },
            include: [
                {
                    model: Rol,
                    as: 'rol',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            attributes: { exclude: ['password'] } // Excluir password
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
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

        // Para verificar password, necesitamos buscarlo de nuevo CON password
        const usuarioConPassword = await Usuario.findByPk(usuario.id);
        const passwordValida = await usuarioConPassword.verificarPassword(password);
        
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Crear sesión
        req.session.userId = usuario.id;
        req.session.userEmail = usuario.email;
        req.session.userRole = usuario.rol.nombre;
        req.session.esEmpleado = usuario.es_empleado === 1;
        req.session.sucursalId = usuario.sucursal_id;

        // Preparar respuesta SIN password
        const usuarioRespuesta = usuario.toJSON();

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                usuario: usuarioRespuesta,
                sesion: {
                    rol: usuario.rol.nombre,
                    es_empleado: usuario.es_empleado === 1,
                    sucursal_id: usuario.sucursal_id
                }
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * Verificar sesión actual
 */
exports.verificarSesion = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        const usuario = await Usuario.findByPk(req.session.userId, {
            include: [
                {
                    model: Rol,
                    as: 'rol',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            attributes: { exclude: ['password'] } // Excluir password
        });

        if (!usuario) {
            // Destruir sesión si el usuario no existe
            req.session.destroy();
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar que el usuario siga activo
        if (usuario.estado === 0) {
            req.session.destroy();
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        const usuarioRespuesta = usuario.toJSON();

        res.json({
            success: true,
            data: {
                usuario: usuarioRespuesta,
                sesion: {
                    rol: usuario.rol.nombre,
                    es_empleado: usuario.es_empleado === 1,
                    sucursal_id: usuario.sucursal_id
                }
            }
        });
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar sesión',
            error: error.message
        });
    }
};

// Logout y cambiarPassword se quedan igual
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }
        
        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    });
};

exports.cambiarPassword = async (req, res) => {
    try {
        const { password_actual, password_nueva } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        const usuario = await Usuario.findByPk(userId);

        // Verificar contraseña actual
        const passwordValida = await usuario.verificarPassword(password_actual);
        if (!passwordValida) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Actualizar contraseña (el hook beforeUpdate hasheará la nueva)
        await usuario.update({ password: password_nueva });

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// Registro se queda igual
exports.registro = async (req, res) => {
    try {
        const { nombre, apellido, email, password, nit, telefono, direccion, municipio_id } = req.body;

        // Verificar si el email ya existe
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Obtener rol de cliente
        const rolCliente = await Rol.findOne({ where: { nombre: 'cliente' } });
        if (!rolCliente) {
            return res.status(500).json({
                success: false,
                message: 'Error de configuración: rol cliente no encontrado'
            });
        }

        // Crear usuario (el hook beforeCreate hasheará la contraseña)
        const nuevoUsuario = await Usuario.create({
            rol_id: rolCliente.id,
            nombre,
            apellido,
            email,
            password,
            nit,
            telefono,
            direccion,
            municipio_id,
            es_empleado: 0,
            estado: 1
        });

        // No devolver password
        const usuarioSinPassword = await Usuario.findByPk(nuevoUsuario.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Rol,
                    as: 'rol',
                    attributes: ['id', 'nombre']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: usuarioSinPassword.toJSON()
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};
