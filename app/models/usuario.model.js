const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  dpi: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: 'Solo empleados'
  },
  nit: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  municipio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'municipios',
      key: 'id'
    }
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sucursales',
      key: 'id'
    },
    comment: 'Solo empleados'
  },
  es_empleado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '1=Empleado, 0=Cliente'
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1=Activo, 0=Inactivo, 2=Suspendido'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    }
  }
});

// Método de instancia para verificar contraseña
Usuario.prototype.verificarPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método para obtener usuario sin password
Usuario.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Usuario;