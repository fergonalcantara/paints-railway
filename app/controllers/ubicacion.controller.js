const { Departamento, Municipio } = require('../models');

/**
 * Listar departamentos
 */
exports.listarDepartamentos = async (req, res) => {
  try {
    const departamentos = await Departamento.findAll({
      where: { estado: 1 },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: departamentos
    });
  } catch (error) {
    console.error('Error al listar departamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar departamentos',
      error: error.message
    });
  }
};

/**
 * Listar municipios por departamento
 */
exports.listarMunicipiosPorDepartamento = async (req, res) => {
  try {
    const { departamento_id } = req.params;

    const municipios = await Municipio.findAll({
      where: {
        departamento_id,
        estado: 1
      },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: municipios
    });
  } catch (error) {
    console.error('Error al listar municipios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar municipios',
      error: error.message
    });
  }
};

/**
 * Listar todos los municipios con departamento
 */
exports.listarTodosMunicipios = async (req, res) => {
  try {
    const municipios = await Municipio.findAll({
      where: { estado: 1 },
      include: [
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['id', 'nombre', 'codigo']
        }
      ],
      order: [
        [{ model: Departamento, as: 'departamento' }, 'nombre', 'ASC'],
        ['nombre', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: municipios
    });
  } catch (error) {
    console.error('Error al listar municipios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar municipios',
      error: error.message
    });
  }
};