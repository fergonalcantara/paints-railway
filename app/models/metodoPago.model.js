const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const MetodoPago = sequelize.define('MetodoPago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  requiere_referencia: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '1=Requiere, 0=No requiere'
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'metodos_pago',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true
});

module.exports = MetodoPago;