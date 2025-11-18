const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const RolPermiso = sequelize.define('RolPermiso', {
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
  permiso_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permisos',
      key: 'id'
    }
  }
}, {
  tableName: 'roles_permisos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  deletedAt: false,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['rol_id', 'permiso_id']
    }
  ]
});

module.exports = RolPermiso;