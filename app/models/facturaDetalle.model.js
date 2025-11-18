const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const FacturaDetalle = sequelize.define('FacturaDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  factura_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'facturas',
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
  lote_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'lotes',
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
  },
  descuento_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // Datos históricos
  producto_nombre: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  producto_sku: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'facturas_detalle',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  deletedAt: false,
  paranoid: false,
  indexes: [
    {
      name: 'idx_factura',
      fields: ['factura_id']
    }
  ]
});

module.exports = FacturaDetalle;