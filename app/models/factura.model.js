const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Factura = sequelize.define('Factura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_factura: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  serie: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  correlativo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  // ====================================
  // CLIENTE (PUEDE SER USUARIO O CLIENTE FÍSICO)
  // ====================================
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // ← Ahora es NULL para clientes físicos
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario online (ventas ecommerce)'
  },
  cliente_tipo: {
    type: DataTypes.ENUM('usuario', 'cliente_fisico'),
    allowNull: false,
    defaultValue: 'usuario',
    comment: 'Tipo de cliente: usuario online o cliente físico'
  },
  cliente_fisico_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    },
    comment: 'Cliente de tienda física (sin cuenta)'
  },
  
  // Sucursal y empleado
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  },
  usuario_emite_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Cajero que emite la factura'
  },
  cotizacion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'cotizaciones',
      key: 'id'
    }
  },
  tipo_venta: {
    type: DataTypes.ENUM('online', 'fisica'),
    allowNull: false
  },
  fecha_emision: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // Montos
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  descuento_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  // Datos históricos del cliente (para preservar información)
  cliente_nombre: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  cliente_nit: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cliente_direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1=Activa, 0=Anulada'
  }
}, {
  tableName: 'facturas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  indexes: [
    {
      name: 'idx_numero_factura',
      fields: ['numero_factura']
    },
    {
      name: 'idx_cliente_usuario',
      fields: ['cliente_id']
    },
    {
      name: 'idx_cliente_fisico',
      fields: ['cliente_fisico_id']
    },
    {
      name: 'idx_cliente_tipo',
      fields: ['cliente_tipo']
    },
    {
      name: 'idx_fecha',
      fields: ['fecha_emision']
    },
    {
      name: 'idx_estado',
      fields: ['estado']
    }
  ]
});

// Métodos de instancia
Factura.prototype.estaAnulada = function() {
  return this.estado === 0;
};

Factura.prototype.esVentaOnline = function() {
  return this.tipo_venta === 'online';
};

Factura.prototype.esVentaFisica = function() {
  return this.tipo_venta === 'fisica';
};

Factura.prototype.tieneClienteUsuario = function() {
  return this.cliente_tipo === 'usuario' && this.cliente_id !== null;
};

Factura.prototype.tieneClienteFisico = function() {
  return this.cliente_tipo === 'cliente_fisico' && this.cliente_fisico_id !== null;
};

module.exports = Factura;