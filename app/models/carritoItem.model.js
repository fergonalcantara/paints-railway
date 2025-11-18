const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const CarritoItem = sequelize.define('CarritoItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  carrito_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'carritos',
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
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'carritos_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: false,
  paranoid: false
});

module.exports = CarritoItem;