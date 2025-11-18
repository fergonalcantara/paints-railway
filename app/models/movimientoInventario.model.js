const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const MovimientoInventario = sequelize.define('MovimientoInventario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo_movimiento: {
    type: DataTypes.ENUM('entrada', 'salida', 'transferencia', 'ajuste'),
    allowNull: false
  },
  sucursal_origen_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  },
  sucursal_destino_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
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
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_autoriza_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  fecha_movimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1=Completado, 2=Pendiente, 3=Cancelado'
  }
}, {
  tableName: 'movimientos_inventario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: false,
  paranoid: false,
  indexes: [
    {
      name: 'idx_fecha',
      fields: ['fecha_movimiento']
    }
  ]
});

module.exports = MovimientoInventario;