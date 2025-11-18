const { Carrito, CarritoItem, Producto, Sucursal, Inventario } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener o crear carrito del usuario/sesión
 */
exports.obtenerCarrito = async (req, res) => {
  try {
    const usuario_id = req.session.userId || null;
    const session_id = req.sessionID;

    let carrito;

    if (usuario_id) {
      // Buscar por usuario
      carrito = await Carrito.findOne({
        where: { usuario_id, estado: 1 },
        include: [
          {
            model: CarritoItem,
            as: 'items',
            include: [
              {
                model: Producto,
                as: 'producto',
                include: ['categoria', 'marca', 'unidad_medida']
              }
            ]
          },
          { model: Sucursal, as: 'sucursal' }
        ]
      });
    } else {
      // Buscar por session_id
      carrito = await Carrito.findOne({
        where: { session_id, estado: 1 },
        include: [
          {
            model: CarritoItem,
            as: 'items',
            include: [
              {
                model: Producto,
                as: 'producto',
                include: ['categoria', 'marca', 'unidad_medida']
              }
            ]
          },
          { model: Sucursal, as: 'sucursal' }
        ]
      });
    }

    if (!carrito) {
      return res.json({
        success: true,
        data: {
          carrito: null,
          items: [],
          total: 0
        }
      });
    }

    // Calcular total
    const total = carrito.items.reduce((sum, item) => {
      return sum + (parseFloat(item.precio_unitario) * item.cantidad);
    }, 0);

    res.json({
      success: true,
      data: {
        carrito,
        total: total.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito',
      error: error.message
    });
  }
};

/**
 * Agregar producto al carrito
 */
exports.agregarProducto = async (req, res) => {
  try {
    const { producto_id, cantidad, sucursal_id } = req.body;
    const usuario_id = req.session.userId || null;
    const session_id = req.sessionID;

    // Validar stock
    const inventario = await Inventario.findOne({
      where: { sucursal_id, producto_id }
    });

    if (!inventario || inventario.stock_actual < cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    // Obtener producto y precio
    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Buscar o crear carrito
    let carrito;

    if (usuario_id) {
      [carrito] = await Carrito.findOrCreate({
        where: { usuario_id, estado: 1 },
        defaults: {
          usuario_id,
          session_id: null,
          sucursal_id,
          estado: 1
        }
      });
    } else {
      [carrito] = await Carrito.findOrCreate({
        where: { session_id, estado: 1 },
        defaults: {
          usuario_id: null,
          session_id,
          sucursal_id,
          estado: 1
        }
      });
    }

    // Buscar si el producto ya está en el carrito
    let item = await CarritoItem.findOne({
      where: { carrito_id: carrito.id, producto_id }
    });

    if (item) {
      // Actualizar cantidad
      const nuevaCantidad = item.cantidad + cantidad;
      
      // Verificar stock nuevamente
      if (inventario.stock_actual < nuevaCantidad) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente para la cantidad solicitada'
        });
      }

      await item.update({ cantidad: nuevaCantidad });
    } else {
      // Crear nuevo item
      item = await CarritoItem.create({
        carrito_id: carrito.id,
        producto_id,
        cantidad,
        precio_unitario: producto.precio_venta
      });
    }

    // Recargar carrito con items
    await carrito.reload({
      include: [
        {
          model: CarritoItem,
          as: 'items',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      data: carrito
    });

  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto',
      error: error.message
    });
  }
};

/**
 * Actualizar cantidad de un item
 */
exports.actualizarCantidad = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { cantidad } = req.body;

    const item = await CarritoItem.findByPk(item_id, {
      include: [
        {
          model: Carrito,
          as: 'carrito',
          include: [{ model: Sucursal, as: 'sucursal' }]
        }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    // Verificar stock
    const inventario = await Inventario.findOne({
      where: {
        sucursal_id: item.carrito.sucursal_id,
        producto_id: item.producto_id
      }
    });

    if (!inventario || inventario.stock_actual < cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    await item.update({ cantidad });

    res.json({
      success: true,
      message: 'Cantidad actualizada',
      data: item
    });

  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cantidad',
      error: error.message
    });
  }
};

/**
 * Eliminar producto del carrito
 */
exports.eliminarProducto = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await CarritoItem.findByPk(item_id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Producto eliminado del carrito'
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
 * Vaciar carrito
 */
exports.vaciarCarrito = async (req, res) => {
  try {
    const { carrito_id } = req.params;

    await CarritoItem.destroy({
      where: { carrito_id }
    });

    res.json({
      success: true,
      message: 'Carrito vaciado'
    });

  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito',
      error: error.message
    });
  }
};