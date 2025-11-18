const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const LoteInventario = sequelize.define('LoteInventario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lote_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lotes',
      key: 'id'
    }
  },
  inventario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'inventarios',
      key: 'id'
    }
  },
  cantidad_asignada: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  usuario_asigna_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'lotes_inventarios',
  timestamps: false,
  indexes: [
    {
      name: 'idx_lote',
      fields: ['lote_id']
    }
  ]
});

module.exports = LoteInventario;