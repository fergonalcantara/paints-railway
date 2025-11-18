const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Sucursal = sequelize.define('Sucursal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  municipio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'municipios',
      key: 'id'
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  latitud: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    comment: 'Coordenada GPS'
  },
  longitud: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    comment: 'Coordenada GPS'
  },
  es_matriz: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '1=Matriz, 0=Sucursal'
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'sucursales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  indexes: [
    {
      name: 'idx_ubicacion',
      fields: ['latitud', 'longitud']
    }
  ]
});

module.exports = Sucursal;