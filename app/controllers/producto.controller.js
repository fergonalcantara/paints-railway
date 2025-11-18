const { Producto, Categoria, Marca, UnidadMedida, Color, Inventario, Sucursal } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todos los productos (con paginación y filtros)
 */
exports.obtenerProductos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoria_id,
      marca_id,
      buscar,
      es_pintura
    } = req.query;

    const offset = (page - 1) * limit;

    // Construir filtros
    const where = { estado: 1 };

    if (categoria_id) {
      where.categoria_id = categoria_id;
    }

    if (marca_id) {
      where.marca_id = marca_id;
    }

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { sku: { [Op.like]: `%${buscar}%` } },
        { descripcion: { [Op.like]: `%${buscar}%` } }
      ];
    }

    // Filtrar pinturas (tienen duracion_anos o cobertura_m2)
    if (es_pintura === 'true') {
      where[Op.or] = [
        { duracion_anos: { [Op.not]: null } },
        { cobertura_m2: { [Op.not]: null } }
      ];
    }

    const { count, rows } = await Producto.findAndCountAll({
      where,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Marca, as: 'marca', attributes: ['id', 'nombre'] },
        { model: UnidadMedida, as: 'unidad_medida', attributes: ['id', 'nombre', 'abreviatura'] },
        { model: Color, as: 'color', attributes: ['id', 'nombre', 'codigo_hex'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

/**
 * Obtener producto por ID
 */
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Marca, as: 'marca' },
        { model: UnidadMedida, as: 'unidad_medida' },
        { model: Color, as: 'color' }
      ]
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: producto
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

/**
 * Crear nuevo producto
 */
exports.crearProducto = async (req, res) => {
  try {
    const {
      sku,
      nombre,
      descripcion,
      categoria_id,
      marca_id,
      unidad_medida_id,
      precio_venta,
      descuento_porcentaje = 0,
      imagen_url,
      // Campos de pinturas (opcionales)
      duracion_anos,
      cobertura_m2,
      color_id
    } = req.body;

    // Verificar si el SKU ya existe
    const skuExistente = await Producto.findOne({ where: { sku } });
    if (skuExistente) {
      return res.status(400).json({
        success: false,
        message: 'El SKU ya está registrado'
      });
    }

    const nuevoProducto = await Producto.create({
      sku,
      nombre,
      descripcion,
      categoria_id,
      marca_id,
      unidad_medida_id,
      precio_venta,
      descuento_porcentaje,
      imagen_url,
      duracion_anos: duracion_anos || null,
      cobertura_m2: cobertura_m2 || null,
      color_id: color_id || null,
      estado: 1
    });

    // Cargar relaciones
    await nuevoProducto.reload({
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Marca, as: 'marca' },
        { model: UnidadMedida, as: 'unidad_medida' },
        { model: Color, as: 'color' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

/**
 * Actualizar producto
 */
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizar = req.body;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Si se actualiza el SKU, verificar que no exista
    if (datosActualizar.sku && datosActualizar.sku !== producto.sku) {
      const skuExistente = await Producto.findOne({
        where: { sku: datosActualizar.sku, id: { [Op.ne]: id } }
      });

      if (skuExistente) {
        return res.status(400).json({
          success: false,
          message: 'El SKU ya está registrado en otro producto'
        });
      }
    }

    await producto.update(datosActualizar);

    // Recargar con relaciones
    await producto.reload({
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Marca, as: 'marca' },
        { model: UnidadMedida, as: 'unidad_medida' },
        { model: Color, as: 'color' }
      ]
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

/**
 * Eliminar producto (soft delete)
 */
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Soft delete
    await producto.update({ estado: 0 });
    await producto.destroy();

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

/**
 * Obtener stock de un producto por sucursal
 */
exports.obtenerStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { sucursal_id } = req.query;

    const where = { producto_id: id, estado: 1 };
    
    if (sucursal_id) {
      where.sucursal_id = sucursal_id;
    }

    const inventarios = await Inventario.findAll({
      where,
      include: [
        {
          model: Sucursal,
          as: 'sucursal',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.json({
      success: true,
      data: inventarios
    });

  } catch (error) {
    console.error('Error al obtener stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock',
      error: error.message
    });
  }
};

/**
 * Buscar productos para POS (con stock de sucursal)
 */
exports.buscarProductosPOS = async (req, res) => {
    try {
        const { buscar, sucursal_id } = req.query;
        
        console.log(' Búsqueda POS:', { buscar, sucursal_id });
        
        if (!buscar || buscar.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        if (!sucursal_id) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere sucursal_id'
            });
        }
        
        const { Inventario, Categoria, Marca } = require('../models');
        const { Op } = require('sequelize');
        
        // Buscar productos con stock en la sucursal
        const productos = await Producto.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.like]: `%${buscar}%` } },
                    { sku: { [Op.like]: `%${buscar}%` } }
                ],
                estado: 1
            },
            include: [
                {
                    model: Inventario,
                    as: 'inventarios',
                    where: {
                        sucursal_id: sucursal_id,
                        stock_actual: { [Op.gt]: 0 }
                    },
                    required: true,
                    attributes: ['stock_actual', 'stock_minimo']
                },
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['nombre']
                },
                {
                    model: Marca,
                    as: 'marca',
                    attributes: ['nombre']
                }
            ],
            limit: 10,
            attributes: ['id', 'sku', 'nombre', 'descripcion', 'precio_venta', 'imagen_url']
        });
        
        console.log(` ${productos.length} productos encontrados`);
        
        res.json({
            success: true,
            data: productos
        });
        
    } catch (error) {
        console.error(' Error buscando productos POS:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar productos',
            error: error.message
        });
    }
};