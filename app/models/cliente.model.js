const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * Modelo Cliente
 * Clientes de ventas físicas (no requieren cuenta de usuario)
 */
const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido'
      }
    }
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  nit: {
    type: DataTypes.STRING(20),
    defaultValue: 'CF',
    validate: {
      notEmpty: true
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      }
    }
  },
  municipio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'municipios',
      key: 'id'
    }
  },
  tipo_cliente: {
    type: DataTypes.ENUM('consumidor_final', 'empresa'),
    defaultValue: 'consumidor_final',
    allowNull: false,
    comment: 'consumidor_final = C/F, empresa = con NIT'
  }
}, {
  tableName: 'clientes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true
});

// Método de instancia para obtener nombre completo
Cliente.prototype.getNombreCompleto = function() {
  return this.apellido ? `${this.nombre} ${this.apellido}` : this.nombre;
};

// Método de instancia para verificar si es empresa
Cliente.prototype.esEmpresa = function() {
  return this.tipo_cliente === 'empresa';
};

module.exports = Cliente;