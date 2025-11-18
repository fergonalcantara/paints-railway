const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const FacturaAnulacion = sequelize.define('FacturaAnulacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  factura_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'facturas',
      key: 'id'
    }
  },
  numero_factura: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  // Montos antes de la anulación (histórico)
  subtotal_original: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  descuento_original: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  total_original: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  // Datos de la anulación
  motivo: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  usuario_anula_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Empleado que autorizó la anulación'
  },
  fecha_anulacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // Control
  requiere_devolucion_inventario: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1=Sí devolver al inventario, 0=No'
  },
  inventario_devuelto: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '1=Ya devuelto, 0=Pendiente'
  }
}, {
  tableName: 'facturas_anulaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  deletedAt: false,
  paranoid: false,
  indexes: [
    {
      name: 'idx_numero_factura',
      fields: ['numero_factura']
    },
    {
      name: 'idx_fecha',
      fields: ['fecha_anulacion']
    }
  ]
});

module.exports = FacturaAnulacion;