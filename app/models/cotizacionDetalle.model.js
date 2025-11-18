const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const CotizacionDetalle = sequelize.define('CotizacionDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cotizacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cotizaciones',
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
  }
}, {
  tableName: 'cotizaciones_detalle',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  deletedAt: false,
  paranoid: false,
  indexes: [
    {
      name: 'idx_cotizacion',
      fields: ['cotizacion_id']
    }
  ]
});

module.exports = CotizacionDetalle;