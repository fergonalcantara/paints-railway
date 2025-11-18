const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const FacturaPago = sequelize.define('FacturaPago', {
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
  metodo_pago_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'metodos_pago',
      key: 'id'
    }
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  numero_referencia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  banco: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'facturas_pagos',
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

module.exports = FacturaPago;