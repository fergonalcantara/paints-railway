const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categorias',
      key: 'id'
    }
  },
  marca_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'marcas',
      key: 'id'
    }
  },
  unidad_medida_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'unidades_medida',
      key: 'id'
    }
  },
  precio_venta: {
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
  imagen_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'URL de la imagen única'
  },
  
  // Campos específicos para pinturas/barnices (NULL si no aplica)
  duracion_anos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Años de duración - Solo pinturas/barnices'
  },
  cobertura_m2: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Metros cuadrados que cubre - Solo pinturas/barnices'
  },
  color_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'colores',
      key: 'id'
    },
    comment: 'Solo pinturas/barnices'
  },
  
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1=Activo, 0=Inactivo'
  }
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  indexes: [
    {
      name: 'idx_sku',
      fields: ['sku']
    },
    {
      name: 'idx_categoria',
      fields: ['categoria_id']
    }
  ]
});

// Método de instancia para verificar si es pintura/barniz
Producto.prototype.esPintura = function() {
  return this.duracion_anos !== null || this.cobertura_m2 !== null;
};

module.exports = Producto;