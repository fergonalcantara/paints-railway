/**
 * cotizaciones.js - Gestión de Cotizaciones
 * Lista, busca, filtra e imprime cotizaciones
 */

// Variables globales
let cotizacionesActuales = [];
let filtrosActivos = {};

// ======================
// INICIALIZACIÓN
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Inicializando módulo de cotizaciones...');
    
    try {
        // Configurar fecha de hoy por defecto
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('filtroFechaHasta').value = hoy;
        
        // Cargar cotizaciones
        await cargarCotizaciones();
        
        console.log('✅ Módulo de cotizaciones inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar cotizaciones:', error);
        mostrarError('Error al inicializar cotizaciones');
    }
});

// ======================
// CARGAR Y FILTRAR COTIZACIONES
// ======================
async function cargarCotizaciones() {
    try {
        const resultado = await listarCotizaciones(filtrosActivos);
        
        if (resultado.success && Array.isArray(resultado.data)) {
            cotizacionesActuales = resultado.data;
            renderizarTablaCotizaciones(cotizacionesActuales);
            actualizarResumen(cotizacionesActuales);
        } else {
            cotizacionesActuales = [];
            renderizarTablaCotizaciones([]);
            actualizarResumen([]);
        }
    } catch (error) {
        console.error('Error cargando cotizaciones:', error);
        mostrarError('Error al cargar las cotizaciones');
    }
}

function aplicarFiltros() {
    filtrosActivos = {};
    
    const numero = document.getElementById('filtroNumero')?.value.trim();
    if (numero) filtrosActivos.numero_cotizacion = numero;
    
    const cliente = document.getElementById('filtroCliente')?.value.trim();
    if (cliente) filtrosActivos.cliente = cliente;
    
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value;
    if (fechaDesde) filtrosActivos.fecha_desde = fechaDesde;
    
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value;
    if (fechaHasta) filtrosActivos.fecha_hasta = fechaHasta;
    
    const estado = document.getElementById('filtroEstado')?.value;
    if (estado) filtrosActivos.estado = estado;
    
    cargarCotizaciones();
}

function limpiarFiltros() {
    document.getElementById('filtroNumero').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = new Date().toISOString().split('T')[0];
    document.getElementById('filtroEstado').value = '';
    
    filtrosActivos = {};
    cargarCotizaciones();
}

// ======================
// RENDERIZAR TABLA
// ======================
function renderizarTablaCotizaciones(cotizaciones) {
    const tbody = document.getElementById('cotizacionesTableBody');
    
    if (!tbody) return;
    
    if (cotizaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-3">No se encontraron cotizaciones</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = cotizaciones.map(cotizacion => {
        const estado = parseInt(cotizacion.estado);
        const estadoBadge = estado === 1 
            ? '<span class="badge bg-success">Vigente</span>' 
            : '<span class="badge bg-secondary">Vencida</span>';
        
        return `
            <tr>
                <td><strong>${cotizacion.numero_cotizacion}</strong></td>
                <td>${formatearFecha(cotizacion.fecha_cotizacion || cotizacion.created_at)}</td>
                <td>${cotizacion.cliente_nombre || 'N/A'}</td>
                <td>${cotizacion.cliente_nit || 'CF'}</td>
                <td><strong class="text-primary">${formatearPrecio(cotizacion.total)}</strong></td>
                <td>${estadoBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" 
                                onclick="verDetalleCotizacion('${cotizacion.numero_cotizacion}')"
                                title="Ver Detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" 
                                onclick="imprimirCotizacion('${cotizacion.numero_cotizacion}')"
                                title="Imprimir">
                            <i class="bi bi-printer"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ======================
// ACTUALIZAR RESUMEN
// ======================
function actualizarResumen(cotizaciones) {
    // Total cotizaciones
    document.getElementById('totalCotizaciones').textContent = cotizaciones.length;
    
    // Total monto cotizaciones
    const totalMonto = cotizaciones.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    document.getElementById('totalMontoCotizaciones').textContent = formatearPrecio(totalMonto);
    
    // Cotizaciones de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const cotizacionesHoyCalc = cotizaciones
        .filter(c => {
            const fechaCotizacion = new Date(c.fecha_cotizacion || c.created_at).toISOString().split('T')[0];
            return fechaCotizacion === hoy;
        })
        .reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    document.getElementById('cotizacionesHoy').textContent = formatearPrecio(cotizacionesHoyCalc);
    
    // Promedio por cotización
    const promedio = cotizaciones.length > 0 ? totalMonto / cotizaciones.length : 0;
    document.getElementById('promedioCotizacion').textContent = formatearPrecio(promedio);
}

// ======================
// ACCIONES
// ======================
function verDetalleCotizacion(numeroCotizacion) {
    // Implementar modal o redirección
    window.open(`cotizacion-print.html?numero=${numeroCotizacion}`, '_blank');
    console.log('Ver detalle de:', numeroCotizacion);
}

function imprimirCotizacion(numeroCotizacion) {
    window.open(`cotizacion-print.html?numero=${numeroCotizacion}`, '_blank');
}

function cambiarEstadoCotizacion(numeroCotizacion) {
    // Implementar cambio de estado
    console.log('Cambiar estado de:', numeroCotizacion);
}