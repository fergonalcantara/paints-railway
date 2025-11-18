const { 
  Categoria, 
  Marca, 
  UnidadMedida, 
  Color, 
  MetodoPago,
  Rol
} = require('../models');
const { Op } = require('sequelize');

// ============================================
// CATEGORÍAS - CRUD COMPLETO
// ============================================

exports.listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { estado: 1 },
      include: [
        {
          model: Categoria,
          as: 'subcategorias',
          where: { estado: 1 },
          required: false
        }
      ],
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: categorias });
  } catch (error) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar categorías',
      error: error.message
    });
  }
};

exports.obtenerCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id, {
      include: [
        { model: Categoria, as: 'subcategorias' },
        { model: Categoria, as: 'padre' }
      ]
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({ success: true, data: categoria });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
};

exports.crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, categoria_padre_id } = req.body;

    // Verificar nombre único
    const nombreExistente = await Categoria.findOne({ where: { nombre } });
    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const categoria = await Categoria.create({
      nombre,
      descripcion,
      categoria_padre_id: categoria_padre_id || null,
      estado: 1
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada',
      data: categoria
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

exports.actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoria_padre_id } = req.body;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar nombre único
    if (nombre && nombre !== categoria.nombre) {
      const nombreExistente = await Categoria.findOne({
        where: { nombre, id: { [Op.ne]: id } }
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }
    }

    await categoria.update({ nombre, descripcion, categoria_padre_id });

    res.json({
      success: true,
      message: 'Categoría actualizada',
      data: categoria
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

exports.eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Soft delete
    await categoria.update({ estado: 0 });
    await categoria.destroy();

    res.json({
      success: true,
      message: 'Categoría eliminada'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    });
  }
};

// ============================================
// MARCAS - CRUD COMPLETO
// ============================================

exports.listarMarcas = async (req, res) => {
  try {
    const marcas = await Marca.findAll({
      where: { estado: 1 },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: marcas });
  } catch (error) {
    console.error('Error al listar marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar marcas',
      error: error.message
    });
  }
};

exports.obtenerMarcaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const marca = await Marca.findByPk(id);

    if (!marca) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    res.json({ success: true, data: marca });
  } catch (error) {
    console.error('Error al obtener marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marca',
      error: error.message
    });
  }
};

exports.crearMarca = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const nombreExistente = await Marca.findOne({ where: { nombre } });
    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una marca con ese nombre'
      });
    }

    const marca = await Marca.create({ nombre, descripcion, estado: 1 });

    res.status(201).json({
      success: true,
      message: 'Marca creada',
      data: marca
    });
  } catch (error) {
    console.error('Error al crear marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear marca',
      error: error.message
    });
  }
};

exports.actualizarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const marca = await Marca.findByPk(id);

    if (!marca) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    if (nombre && nombre !== marca.nombre) {
      const nombreExistente = await Marca.findOne({
        where: { nombre, id: { [Op.ne]: id } }
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una marca con ese nombre'
        });
      }
    }

    await marca.update({ nombre, descripcion });

    res.json({
      success: true,
      message: 'Marca actualizada',
      data: marca
    });
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar marca',
      error: error.message
    });
  }
};

exports.eliminarMarca = async (req, res) => {
  try {
    const { id } = req.params;

    const marca = await Marca.findByPk(id);

    if (!marca) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    await marca.update({ estado: 0 });
    await marca.destroy();

    res.json({
      success: true,
      message: 'Marca eliminada'
    });
  } catch (error) {
    console.error('Error al eliminar marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar marca',
      error: error.message
    });
  }
};

// ============================================
// COLORES - CRUD COMPLETO
// ============================================

exports.listarColores = async (req, res) => {
  try {
    const colores = await Color.findAll({
      where: { estado: 1 },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: colores });
  } catch (error) {
    console.error('Error al listar colores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar colores',
      error: error.message
    });
  }
};

exports.crearColor = async (req, res) => {
  try {
    const { nombre, codigo_hex } = req.body;

    const color = await Color.create({ nombre, codigo_hex, estado: 1 });

    res.status(201).json({
      success: true,
      message: 'Color creado',
      data: color
    });
  } catch (error) {
    console.error('Error al crear color:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear color',
      error: error.message
    });
  }
};

exports.actualizarColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo_hex } = req.body;

    const color = await Color.findByPk(id);

    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Color no encontrado'
      });
    }

    await color.update({ nombre, codigo_hex });

    res.json({
      success: true,
      message: 'Color actualizado',
      data: color
    });
  } catch (error) {
    console.error('Error al actualizar color:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar color',
      error: error.message
    });
  }
};

exports.eliminarColor = async (req, res) => {
  try {
    const { id } = req.params;

    const color = await Color.findByPk(id);

    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Color no encontrado'
      });
    }

    await color.update({ estado: 0 });
    await color.destroy();

    res.json({
      success: true,
      message: 'Color eliminado'
    });
  } catch (error) {
    console.error('Error al eliminar color:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar color',
      error: error.message
    });
  }
};

// ============================================
// UNIDADES DE MEDIDA - CRUD COMPLETO
// ============================================

exports.listarUnidadesMedida = async (req, res) => {
  try {
    const unidades = await UnidadMedida.findAll({
      where: { estado: 1 },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: unidades });
  } catch (error) {
    console.error('Error al listar unidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar unidades',
      error: error.message
    });
  }
};

exports.crearUnidadMedida = async (req, res) => {
  try {
    const { nombre, abreviatura } = req.body;

    const nombreExistente = await UnidadMedida.findOne({ where: { nombre } });
    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una unidad con ese nombre'
      });
    }

    const unidad = await UnidadMedida.create({ nombre, abreviatura, estado: 1 });

    res.status(201).json({
      success: true,
      message: 'Unidad de medida creada',
      data: unidad
    });
  } catch (error) {
    console.error('Error al crear unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear unidad',
      error: error.message
    });
  }
};

exports.actualizarUnidadMedida = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, abreviatura } = req.body;

    const unidad = await UnidadMedida.findByPk(id);

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    await unidad.update({ nombre, abreviatura });

    res.json({
      success: true,
      message: 'Unidad actualizada',
      data: unidad
    });
  } catch (error) {
    console.error('Error al actualizar unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar unidad',
      error: error.message
    });
  }
};

exports.eliminarUnidadMedida = async (req, res) => {
  try {
    const { id } = req.params;

    const unidad = await UnidadMedida.findByPk(id);

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    await unidad.update({ estado: 0 });
    await unidad.destroy();

    res.json({
      success: true,
      message: 'Unidad eliminada'
    });
  } catch (error) {
    console.error('Error al eliminar unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar unidad',
      error: error.message
    });
  }
};

// ============================================
// MÉTODOS DE PAGO - CRUD COMPLETO
// ============================================

exports.listarMetodosPago = async (req, res) => {
  try {
    const metodos = await MetodoPago.findAll({
      where: { estado: 1 },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: metodos });
  } catch (error) {
    console.error('Error al listar métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar métodos de pago',
      error: error.message
    });
  }
};

exports.crearMetodoPago = async (req, res) => {
  try {
    const { nombre, requiere_referencia } = req.body;

    const nombreExistente = await MetodoPago.findOne({ where: { nombre } });
    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un método de pago con ese nombre'
      });
    }

    const metodo = await MetodoPago.create({
      nombre,
      requiere_referencia: requiere_referencia || 0,
      estado: 1
    });

    res.status(201).json({
      success: true,
      message: 'Método de pago creado',
      data: metodo
    });
  } catch (error) {
    console.error('Error al crear método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear método de pago',
      error: error.message
    });
  }
};

exports.actualizarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, requiere_referencia } = req.body;

    const metodo = await MetodoPago.findByPk(id);

    if (!metodo) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    await metodo.update({ nombre, requiere_referencia });

    res.json({
      success: true,
      message: 'Método de pago actualizado',
      data: metodo
    });
  } catch (error) {
    console.error('Error al actualizar método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar método de pago',
      error: error.message
    });
  }
};

exports.eliminarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;

    const metodo = await MetodoPago.findByPk(id);

    if (!metodo) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    await metodo.update({ estado: 0 });
    await metodo.destroy();

    res.json({
      success: true,
      message: 'Método de pago eliminado'
    });
  } catch (error) {
    console.error('Error al eliminar método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar método de pago',
      error: error.message
    });
  }
};

// ============================================
// ROLES - Solo listar (no se deben modificar fácilmente)
// ============================================

exports.listarRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      where: { estado: 1 },
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error al listar roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar roles',
      error: error.message
    });
  }
};