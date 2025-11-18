const { Sucursal, Municipio, Departamento } = require('../models');

/**
 * Calcular distancia entre dos coordenadas (Haversine)
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // en km
}

/**
 * Obtener sucursal más cercana según GPS
 */
exports.obtenerSucursalCercana = async (req, res) => {
  try {
    const { latitud, longitud } = req.query;

    if (!latitud || !longitud) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar latitud y longitud'
      });
    }

    const lat = parseFloat(latitud);
    const lon = parseFloat(longitud);

    // Obtener todas las sucursales activas
    const sucursales = await Sucursal.findAll({
      where: { estado: 1 },
      include: [
        {
          model: Municipio,
          as: 'municipio',
          include: [{ model: Departamento, as: 'departamento' }]
        }
      ]
    });

    // Calcular distancia a cada sucursal
    const sucursalesConDistancia = sucursales.map(s => {
      const distancia = calcularDistancia(
        lat,
        lon,
        parseFloat(s.latitud),
        parseFloat(s.longitud)
      );

      return {
        ...s.toJSON(),
        distancia_km: distancia.toFixed(2)
      };
    });

    // Ordenar por distancia
    sucursalesConDistancia.sort((a, b) => a.distancia_km - b.distancia_km);

    res.json({
      success: true,
      data: {
        mas_cercana: sucursalesConDistancia[0],
        todas: sucursalesConDistancia
      }
    });

  } catch (error) {
    console.error('Error al obtener sucursal cercana:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sucursal cercana',
      error: error.message
    });
  }
};

/**
 * Listar todas las sucursales
 */
exports.listarSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll({
      where: { estado: 1 },
      include: [
        {
          model: Municipio,
          as: 'municipio',
          include: [{ model: Departamento, as: 'departamento' }]
        }
      ]
    });

    res.json({
      success: true,
      data: sucursales
    });

  } catch (error) {
    console.error('Error al listar sucursales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar sucursales',
      error: error.message
    });
  }
};

/**
 * Obtener sucursal por ID
 */
exports.obtenerSucursalPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await Sucursal.findByPk(id, {
      include: [
        {
          model: Municipio,
          as: 'municipio',
          include: [{ model: Departamento, as: 'departamento' }]
        }
      ]
    });

    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    res.json({
      success: true,
      data: sucursal
    });

  } catch (error) {
    console.error('Error al obtener sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sucursal',
      error: error.message
    });
  }
};