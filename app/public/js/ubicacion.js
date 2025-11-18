// Variables globales
let ubicacionUsuario = null;
let sucursalCercana = null;
let todasSucursales = [];

// Solicitar ubicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar modal de ubicación
    const modal = new bootstrap.Modal(document.getElementById('ubicacionModal'));
    modal.show();
});

// Solicitar ubicación
function solicitarUbicacion() {
    const statusElement = document.getElementById('ubicacion-status');
    
    if (!navigator.geolocation) {
        statusElement.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                Tu navegador no soporta geolocalización
            </div>
        `;
        return;
    }

    statusElement.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Obteniendo ubicación...</span>
        </div>
        <p class="mt-2">Obteniendo tu ubicación...</p>
    `;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            ubicacionUsuario = {
                latitud: position.coords.latitude,
                longitud: position.coords.longitude
            };

            try {
                // Buscar sucursal más cercana
                const response = await obtenerSucursalCercana(
                    ubicacionUsuario.latitud,
                    ubicacionUsuario.longitud
                );

                if (response.success) {
                    // El backend devuelve: { success: true, data: { mas_cercana: {...}, todas: [...] } }
                    sucursalCercana = response.data.mas_cercana;
                    
                    statusElement.innerHTML = `
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle"></i>
                            <strong>${sucursalCercana.nombre}</strong><br>
                            <small>A ${sucursalCercana.distancia_km} km de tu ubicación</small>
                        </div>
                    `;

                    // Actualizar UI
                    actualizarSucursalCercanaUI();

                    // Cerrar modal después de 2 segundos
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('ubicacionModal'));
                        modal.hide();
                    }, 2000);
                }
            } catch (error) {
                console.error('Error al buscar sucursales:', error);
                statusElement.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-x-circle"></i>
                        Error al buscar sucursales cercanas
                    </div>
                `;
            }
        },
        (error) => {
            let mensaje = 'Error al obtener ubicación';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = 'Permiso de ubicación denegado';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = 'Ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    mensaje = 'Tiempo de espera agotado';
                    break;
            }

            statusElement.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-x-circle"></i> ${mensaje}
                </div>
            `;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Omitir ubicación
function omitirUbicacion() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('ubicacionModal'));
    modal.hide();
    cargarSucursales();
}

// Actualizar UI con sucursal cercana
function actualizarSucursalCercanaUI() {
    const topBar = document.getElementById('sucursal-cercana-top');
    
    if (sucursalCercana) {
        topBar.innerHTML = `
            <i class="bi bi-geo-alt-fill"></i> 
            <strong>${sucursalCercana.nombre}</strong> 
            (${sucursalCercana.distancia_km} km)
        `;
    }
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c;
    
    return distancia;
}

// Mostrar sucursales
function mostrarSucursales() {
    document.getElementById('sucursales-section').scrollIntoView({ behavior: 'smooth' });
    cargarSucursales();
}

// Cargar todas las sucursales
async function cargarSucursales() {
    const container = document.getElementById('sucursales-list');
    
    try {
        const response = await obtenerSucursales();
        
        if (response.success) {
            todasSucursales = response.data;
            
            // Si hay ubicación del usuario, calcular distancias
            if (ubicacionUsuario) {
                todasSucursales = todasSucursales.map(sucursal => ({
                    ...sucursal,
                    distancia: calcularDistancia(
                        ubicacionUsuario.latitud,
                        ubicacionUsuario.longitud,
                        parseFloat(sucursal.latitud),
                        parseFloat(sucursal.longitud)
                    )
                }));
                
                // Ordenar por distancia
                todasSucursales.sort((a, b) => a.distancia - b.distancia);
            }
            
            container.innerHTML = todasSucursales.map(sucursal => `
                <div class="col-md-4 col-sm-6">
                    <div class="sucursal-card">
                        <h5>
                            <i class="bi bi-shop"></i> ${sucursal.nombre}
                        </h5>
                        <p class="mb-2">
                            <i class="bi bi-geo-alt"></i> ${sucursal.direccion}
                        </p>
                        <p class="mb-2">
                            <i class="bi bi-telephone"></i> ${sucursal.telefono || 'N/A'}
                        </p>
                        ${sucursal.distancia ? `
                            <span class="sucursal-distancia">
                                <i class="bi bi-pin-map"></i> 
                                ${sucursal.distancia.toFixed(2)} km
                            </span>
                        ` : ''}
                        ${sucursal.es_matriz ? '<span class="badge bg-primary ms-2">Matriz</span>' : ''}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle"></i> Error al cargar sucursales
                </div>
            </div>
        `;
    }
}