const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Carrito = sequelize.define('Carrito', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    },
    comment: 'Sucursal más cercana según GPS'
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1=Activo, 2=Convertido, 3=Abandonado'
  }
}, {
  tableName: 'carritos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: false,
  paranoid: false,
  indexes: [
    {
      name: 'idx_usuario',
      fields: ['usuario_id']
    }
  ]
});

module.exports = Carrito;