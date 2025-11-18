const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Inventario = sequelize.define('Inventario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  stock_actual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  stock_minimo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 0
    }
  },
  stock_maximo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1000,
    validate: {
      min: 0
    }
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'inventarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  indexes: [
    {
      unique: true,
      name: 'unique_sucursal_producto',
      fields: ['sucursal_id', 'producto_id']
    },
    {
      name: 'idx_stock',
      fields: ['stock_actual']
    }
  ]
});

// Métodos de instancia
Inventario.prototype.tieneBajoStock = function() {
  return this.stock_actual < this.stock_minimo;
};

Inventario.prototype.sinStock = function() {
  return this.stock_actual === 0;
};

module.exports = Inventario;